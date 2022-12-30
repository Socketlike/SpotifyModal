/* eslint-disable no-undefined
   ----
   So that I can use replugged.logger */
import { common, logger, webpack } from "replugged";
import { Classes, EnvironmentData, SpotifyPlayerStateData } from "./types";
import {
  _dockIconsElement,
  _metadataElement,
  _playbackTimeDisplayElement,
  _timebarElement,
  artistsElement,
  coverArtElement,
  dockAnimations,
  dockElement,
  modalAnimations,
  modalElement,
  parseArtists,
  playbackTimeCurrentElement,
  playbackTimeDurationElement,
  timebarInnerElement,
  titleElement,
} from "./modal";
import {
  desktopIcon,
  desktopIconTitle,
  repeatIcon,
  repeatIconTitle,
  smartphoneIcon,
  smartphoneIconTitle,
} from "./icons";

/*
  Very WIP Spotify modal implementation
  FYI: This is my first time using JavaScript's Web APIs so if I do
       things differently than normal people does then please let me know
 */

const timebarUpdateRate = 700;

const env: EnvironmentData = {
  panel: undefined,
  injected: false,
  fluxDispatcherIndex: 0,
  timebarInterval: undefined,
  isPlaying: false,
  trackStats: {
    passed: 0,
    duration: 0,
    albumUrl: "",
  },
};

let classes: Classes;

// Register anchorlike href for cover art image
coverArtElement.onclick = () => {
  if (!env.trackStats.albumUrl) return;
  window.open(env.trackStats.albumUrl, "_blank");
};

/**
 * Parse time in miliseconds to minutes:seconds format or hours:minutes:seconds format
 * @param {number} ms - Time in miliseconds
 * @returns {string} - Parsed time
 */
function parseTime(ms: number): string {
  if (typeof ms !== "number") return "";
  const dateObject = new Date(ms);
  const raw = {
    month: dateObject.getUTCMonth(),
    day: dateObject.getUTCDate(),
    hours: dateObject.getUTCHours(),
    minutes: dateObject.getUTCMinutes(),
    seconds: dateObject.getUTCSeconds(),
  };
  const parsedHours = raw.hours + (raw.day - 1) * 24 + raw.month * 30 * 24;

  return `${parsedHours > 0 ? `${parsedHours}:` : ""}${
    raw.minutes < 10 && parsedHours > 0 ? `0${raw.minutes}` : raw.minutes
  }:${raw.seconds < 10 ? `0${raw.seconds}` : raw.seconds}`;
}

/**
 * Handler for SPOTIFY_PLAYER_STATE
 * @param {SpotifyPlayerStateData} data
 */
const handleSpotifyPlayerStateChange = async (data: SpotifyPlayerStateData): Promise<void> => {
  env.isPlaying = data.isPlaying;
  if (!env.injected && !injectModal()) {
    logger.warn(
      "HandleSpotifyPlayerStateChange",
      "SpotifyModal",
      undefined,
      "Modal injection failed",
    );
  } else if (data.isPlaying) {
    logger.log(
      "HandleSpotifyPlayerStateChange",
      "SpotifyModal",
      undefined,
      "State update: Player is playing",
      data,
    );

    if (typeof env.timebarInterval !== "number")
      // @ts-expect-error - setInterval() returns a number, this is not pure NodeJS
      env.timebarInterval = setInterval(async (): Promise<void> => {
        if (!env.isPlaying) {
          timebarInnerElement.style.width = "0%";
          clearInterval(env.timebarInterval);
          env.timebarInterval = undefined;
          playbackTimeCurrentElement.innerText = "0:00";
          playbackTimeDurationElement.innerText = "0:00";
          return;
        }
        env.trackStats.passed += timebarUpdateRate;
        if (parseTime(env.trackStats.passed) !== playbackTimeCurrentElement.innerText)
          playbackTimeCurrentElement.innerText = parseTime(env.trackStats.passed);
        timebarInnerElement.style.width = `${(
          (env.trackStats.passed / env.trackStats.duration) *
          100
        ).toFixed(4)}%`;
      }, timebarUpdateRate);

    env.trackStats.duration = data.track.duration;
    env.trackStats.passed = data.position;

    if (modalElement.style.display === "none") modalAnimations.fadein();
    if (dockElement.style.display === "none") dockAnimations.fadein();

    coverArtElement.src = data.track.isLocal ? "" : data.track.album.image.url;
    coverArtElement.title = data.track.isLocal ? "" : data.track.album.name;
    env.trackStats.albumUrl = data.track.isLocal
      ? ""
      : `https://open.spotify.com/album/${data.track.album.id}`;

    const trackArtists = parseArtists(
      data.track,
      `${classes.anchors.anchor} ` +
        `${classes.anchors.anchorUnderlineOnHover} ` +
        `${classes.activity.bodyLink} ` +
        `${classes.activity.ellipsis}`,
      /* Todo: Remove this blob of code since "clipboard-write" is not enabled on Discord
        (mouseEvent) => {
          if (!mouseEvent.srcElement.href) return;
          navigator.clipboard.writeText(mouseEvent.srcElement.href).catch((error) => {
            logger.error(
              "ArtistUrlCopy",
              "SpotifyModal",
              undefined,
              "An error has occurred trying to write to clipboard",
              error,
            );
          });
        }, */
    );
    const trackName = typeof data?.track?.name === "string" ? data.track.name : "Unknown";

    if (data.track.isLocal) {
      titleElement.href = "";
      titleElement.style.textDecoration = "none";
      titleElement.style.cursor = "default";
      coverArtElement.style.cursor = "";
    } else {
      titleElement.href = `https://open.spotify.com/track/${data.track.id}`;
      titleElement.style.textDecoration = "";
      titleElement.style.cursor = "";
      coverArtElement.style.cursor = "pointer";
    }

    if (parseTime(env.trackStats.duration) !== playbackTimeDurationElement.innerText)
      playbackTimeDurationElement.innerText = parseTime(env.trackStats.duration);

    desktopIcon.style.display = data?.device?.type === "Computer" ? "" : "none";
    desktopIconTitle.replaceChildren(
      document.createTextNode(
        data?.device?.type === "Computer" ? `Listening on: ${data.device.name}` : "",
      ),
    );
    smartphoneIcon.style.display = data?.device?.type === "Smartphone" ? "" : "none";
    smartphoneIconTitle.replaceChildren(
      document.createTextNode(
        data?.device?.type === "Smartphone" ? `Listening on: ${data.device.name}` : "",
      ),
    );

    repeatIcon.style.color = data.repeat ? "var(--brand-experiment-500)" : "var(--text-normal)";
    repeatIconTitle.replaceChildren(
      document.createTextNode(data.repeat ? "Repeat on" : "Repeat off"),
    );

    titleElement.replaceChildren(document.createTextNode(trackName));
    titleElement.title = trackName;
    artistsElement.replaceChildren(...trackArtists);
  } else {
    logger.log(
      "HandleSpotifyPlayerStateChange",
      "SpotifyModal",
      undefined,
      "State update: Player is not playing",
      data,
    );
    if (modalElement.style.display !== "none") modalAnimations.fadeout();
    if (dockElement.style.display !== "none") dockAnimations.fadeout();
  }
};

// fluxDispatcher: SPOTIFY_PLAYER_STATE
export async function start(): Promise<void> {
  classes = {
    panels: await webpack.waitForModule<{
      panels: string;
    }>(webpack.filters.byProps("panels")),
    container: "",
    anchors: await webpack.waitForModule<{
      anchor: string;
      anchorUnderlineOnHover: string;
    }>(webpack.filters.byProps("anchorUnderlineOnHover")),
    activity: await webpack.waitForModule<{
      activityName: string;
      bodyLink: string;
      ellipsis: string;
      nameNormal: string;
    }>(webpack.filters.byProps("activityName")),
    colors: await webpack.waitForModule<{
      defaultColor: string;
      "text-sm/semibold": string;
    }>(webpack.filters.byProps("defaultColor")),
  };
  if (classes) {
    titleElement.classList.add(
      classes.anchors.anchor,
      classes.anchors.anchorUnderlineOnHover,
      classes.colors.defaultColor,
      classes.colors["text-sm/semibold"],
      ...classes.activity.nameNormal.split(" "),
    );
    // @ts-expect-error - .subscribe() exists on fluxDispatcher
    common.fluxDispatcher.subscribe("SPOTIFY_PLAYER_STATE", handleSpotifyPlayerStateChange);
    env.fluxDispatcherIndex =
      // @ts-expect-error - _subscriptions exists on fluxDispatcher
      common.fluxDispatcher._subscriptions.SPOTIFY_PLAYER_STATE.size - 1;
  }
}

export function injectModal(): boolean {
  if (env.injected)
    logger.warn("InjectModal", "SpotifyModal", undefined, "Modal is already injected");
  else if (!document.body.getElementsByClassName(classes.panels.panels)[0])
    logger.error("InjectModal", "SpotifyModal", undefined, "Cannot get user panel");
  else {
    if (!env.panel) env.panel = document.body.getElementsByClassName(classes.panels.panels)[0];
    if (!classes.container) {
      for (const element of env.panel.children) {
        if (/^container-[a-zA-Z0-9]{6}$/.test(element.className))
          classes.container = element.className;
      }
      if (!classes.container) {
        logger.error("InjectModal", "SpotifyModal", undefined, "Container class name not found");
        return false;
      }
    }
    if (!modalElement.className.includes("container"))
      modalElement.classList.add(classes.container);
    // @ts-expect-error - "afterBegin" is a valid argument for "InsertPosition"
    env.panel.insertAdjacentElement("afterBegin", modalElement);
    // @ts-expect-error - "afterEnd" is a valid argument for "InsertPosition"
    modalElement.insertAdjacentElement("afterEnd", dockElement);
    logger.log("InjectModal", "SpotifyModal", undefined, "Modal injected");
    return (env.injected = true);
  }
  return false;
}

export function uninjectModal(): boolean {
  if (!env.injected)
    logger.warn("UninjectModal", "SpotifyModal", undefined, "Modal is not injected");
  else if (!document.body.getElementsByClassName(classes.panels.panels)[0]) {
    logger.error("UninjectModal", "SpotifyModal", undefined, "Cannot get user panel");
  } else {
    if (!env.panel) env.panel = document.body.getElementsByClassName(classes.panels.panels)[0];
    env.panel.removeChild(modalElement);
    env.panel.removeChild(dockElement);
    logger.log("UninjectModal", "SpotifyModal", undefined, "Modal uninjected");
    return !(env.injected = false);
  }
  return false;
}

export function stop(): void {
  uninjectModal();
  if (typeof env.timebarInterval === "number") clearInterval(env.timebarInterval);
  // @ts-expect-error - _subscriptions exists on fluxDispatcher
  if (common.fluxDispatcher._subscriptions.SPOTIFY_PLAYER_STATE)
    // @ts-expect-error - fluxDispatcher is not string
    common.fluxDispatcher.unsubscribe(
      "SPOTIFY_PLAYER_STATE",
      // @ts-expect-error - _subscriptions exists on fluxDispatcher
      [...common.fluxDispatcher._subscriptions.SPOTIFY_PLAYER_STATE][env.fluxDispatcherIndex],
    );
}
