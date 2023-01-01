/* eslint-disable no-undefined, @typescript-eslint/no-floating-promises, @typescript-eslint/require-await */
import { common, logger, webpack } from "replugged";
import { SpotifyPlayerStateData } from "./types";

import * as controls from "./controls";
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
  pausePath,
  playPath,
  playPauseIcon,
  repeatAllPath,
  repeatIcon,
  repeatIconTitle,
  repeatOnePath,
  shuffleIcon,
  shuffleIconTitle,
  skipNextIcon,
  skipPreviousIcon,
} from "./icons";

const timebarUpdateRate = 500;

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

class ModalManager {
  public timebarSetIntervalId: undefined | number;
  public timebarUpdateHandler: () => Promise<void>;
  public fluxSubscriptionFunction: undefined | (() => Promise<void>);
  public modalInjected: boolean;
  public modalAnimations: {
    artistsElement: undefined | Animation;
    titleElement: undefined | Animation;
  };
  public panel: Element;
  public classes: Record<string, string>;
  public playerState: {
    isPlaying: boolean;
    accountId: string;
    shuffleOn: boolean;
    repeatMode: string;
    trackState: {
      passed: number;
      duration: number;
      albumUrl: string;
    };
  };

  public constructor() {
    this.timebarSetIntervalId = undefined;
    this.fluxSubscriptionFunction = undefined;
    this.modalInjected = false;
    this.modalAnimations = {
      artistsElement: undefined,
      titleElement: undefined,
    };
    // @ts-expect-error - When panel is falsy it gets catched so it doesn't matter
    this.panel = undefined;
    this.classes = {};
    this.playerState = {
      isPlaying: false,
      accountId: "",
      shuffleOn: false,
      repeatMode: "off",
      trackState: {
        passed: 0,
        duration: 0,
        albumUrl: "",
      },
    };

    // This is only an arrow function because it needs to stay in this context
    this.timebarUpdateHandler = async (): Promise<void> => {
      if (!this.playerState.isPlaying) {
        clearInterval(this.timebarSetIntervalId);
        this.timebarSetIntervalId = undefined;
        playbackTimeCurrentElement.innerText = playbackTimeCurrentElement.innerText || "0:00";
        return;
      }
      this.playerState.trackState.passed += timebarUpdateRate;
      if (parseTime(this.playerState.trackState.passed) !== playbackTimeCurrentElement.innerText)
        playbackTimeCurrentElement.innerText = parseTime(this.playerState.trackState.passed);
      timebarInnerElement.style.width = `${(
        (this.playerState.trackState.passed / this.playerState.trackState.duration) *
        100
      ).toFixed(4)}%`;
    };
  }

  public async getClasses(): Promise<void> {
    const activityClasses = await webpack.waitForModule<{
      activityName: string;
      bodyLink: string;
      ellipsis: string;
      nameNormal: string;
    }>(webpack.filters.byProps("activityName"));
    const anchorClasses = await webpack.waitForModule<{
      anchor: string;
      anchorUnderlineOnHover: string;
    }>(webpack.filters.byProps("anchorUnderlineOnHover"));
    const colorClasses = await webpack.waitForModule<{
      defaultColor: string;
      "text-sm/semibold": string;
    }>(webpack.filters.byProps("defaultColor"));
    const containerClasses = await webpack.waitForModule<{
      container: string;
    }>(webpack.filters.byProps("avatar", "customStatus"));
    const panelClasses = await webpack.waitForModule<{
      panels: string;
    }>(webpack.filters.byProps("panels"));

    this.classes = {
      activityName: this.classes.activityName || activityClasses.activityName,
      anchor: this.classes.anchor || anchorClasses.anchor,
      anchorUnderlineOnHover:
        this.classes.anchorUnderlineOnHover || anchorClasses.anchorUnderlineOnHover,
      bodyLink: this.classes.bodyLink || activityClasses.bodyLink,
      container: this.classes.container || containerClasses.container,
      defaultColor: this.classes.defaultColor || colorClasses.defaultColor,
      ellipsis: this.classes.ellipsis || activityClasses.ellipsis,
      nameNormal: this.classes.nameNormal || activityClasses.nameNormal,
      panels: this.classes.panels || panelClasses.panels,
      "text-sm/semibold": this.classes["text-sm/semibold"] || colorClasses["text-sm/semibold"],
    };
  }

  public async injectModal(): Promise<void> {
    if (this.modalInjected) {
      logger.warn("ModalManager#injectModal", "SpotifyModal", undefined, "Already injected");
      return;
    }

    if (Object.keys(this.classes).length === 0) await this.getClasses();

    if (!this.classes.panels) {
      logger.error("ModalManager#injectModal", "SpotifyModal", undefined, "Panel class not found");
      this.getClasses();
      return;
    }

    if (!this.classes.container) {
      logger.error(
        "ModalManager#injectModal",
        "SpotifyModal",
        undefined,
        "Container class not found",
      );
      this.getClasses();
      return;
    }

    this.panel = document.getElementsByClassName(this.classes.panels)[0];
    if (!this.panel) {
      logger.error("ModalManager#injectModal", "SpotifyModal", undefined, "Panel not found");
      return;
    }

    if (!modalElement.className.includes(this.classes.container))
      modalElement.classList.add(this.classes.container);
    if (!titleElement.className.includes(this.classes.anchor))
      titleElement.classList.add(
        this.classes.anchor,
        this.classes.anchorUnderlineOnHover,
        this.classes.defaultColor,
        this.classes["text-sm/semibold"],
        ...this.classes.nameNormal.split(" ").filter((classes) => !classes.match(/^ellipsis/)),
      );

    // @ts-expect-error - "afterBegin" is a valid argument for InsertPosition
    this.panel.insertAdjacentElement("afterBegin", modalElement);
    // @ts-expect-error - "afterEnd" is a valid argument for InsertPosition
    modalElement.insertAdjacentElement("afterEnd", dockElement);

    this.modalInjected = true;
    logger.log("ModalManager#injectModal", "SpotifyModal", undefined, "Modal injected");
  }

  public uninjectModal(): void {
    if (!this.modalInjected) {
      logger.warn("ModalManager#uninjectModal", "SpotifyModal", undefined, "Already uninjected");
      return;
    }

    this.panel.removeChild(modalElement);
    this.panel.removeChild(dockElement);
    this.modalInjected = false;
    logger.log("ModalManager#uninjectModal", "SpotifyModal", undefined, "Modal uninjected");
  }

  public async updateModal(data: SpotifyPlayerStateData): Promise<void> {
    if (data.isPlaying || data.track) {
      if (typeof this.timebarSetIntervalId !== "number")
        // @ts-expect-error - This is not Node.js, setInterval returns a Number.
        this.timebarSetIntervalId = setInterval(this.timebarUpdateHandler, timebarUpdateRate);

      (async () => {
        const res = await controls.getPlayerState();
        if (!res) return;

        // @ts-expect-error - this.playerState.repeatMode is not of type "{}"...?
        this.playerState.repeatMode = res.repeat_state || "off";
        this.playerState.shuffleOn = res.shuffle_state;

        repeatIcon.style.color = data.repeat ? "var(--brand-experiment-500)" : "var(--text-normal)";
        repeatIcon.replaceChild(
          res.repeat_state === "off" || res.repeat_state === "context"
            ? repeatAllPath
            : repeatOnePath,
          repeatIcon.children[1],
        );
        repeatIconTitle.replaceChildren(
          // res.repeat_state will be a String
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          document.createTextNode(`Repeat ${res.repeat_state || "off"}`),
        );

        shuffleIcon.style.color = res.shuffle_state
          ? "var(--brand-experiment-500)"
          : "var(--text-normal)";
        shuffleIconTitle.replaceChildren(
          // res.shuffle_state will be a String
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          document.createTextNode(`Shuffle ${res.shuffle_state || "off"}`),
        );
      })();

      if (modalElement.style.display === "none") modalAnimations.fadein();
      if (dockElement.style.display === "none") dockAnimations.fadein();

      const trackArtists = parseArtists(
        data.track,
        `${this.classes.anchor} ` +
          `${this.classes.anchorUnderlineOnHover} ` +
          `${this.classes.bodyLink} ` +
          `${this.classes.ellipsis}`,
      );
      const trackName = typeof data?.track?.name === "string" ? data.track.name : "Unknown";

      if (data.track.isLocal) {
        titleElement.href = "";
        titleElement.style.textDecoration = "none";
        titleElement.style.cursor = "default";
        coverArtElement.src = "";
        coverArtElement.title = "";
        coverArtElement.style.cursor = "";
      } else {
        titleElement.href = `https://open.spotify.com/track/${data.track.id}`;
        titleElement.style.textDecoration = "";
        titleElement.style.cursor = "";
        coverArtElement.src = data.track.album.image.url;
        coverArtElement.title = data.track.album.name;
        coverArtElement.style.cursor = "pointer";
      }

      if (parseTime(this.playerState.trackState.duration) !== playbackTimeDurationElement.innerText)
        playbackTimeDurationElement.innerText = parseTime(this.playerState.trackState.duration);

      playPauseIcon.replaceChildren(data?.isPlaying ? pausePath : playPath);

      titleElement.innerText = trackName;
      titleElement.title = trackName;
      if (titleElement.scrollWidth > titleElement.offsetWidth + 20) {
        if (this.modalAnimations.titleElement) this.modalAnimations.titleElement.cancel();
        this.modalAnimations.titleElement = titleElement.animate(
          [
            { transform: "translateX(0)" },
            {
              transform: `translateX(-${titleElement.scrollWidth - titleElement.offsetWidth}px)`,
            },
          ],
          {
            iterations: Infinity,
            duration: (titleElement.scrollWidth - titleElement.offsetWidth) * 50,
            direction: "alternate-reverse",
            easing: "linear",
          },
        );
      } else if (
        this.modalAnimations.titleElement &&
        titleElement.scrollWidth <= artistsElement.offsetWidth + 20
      ) {
        this.modalAnimations.titleElement.cancel();
        this.modalAnimations.titleElement = undefined;
      }

      if (
        !this.modalAnimations.titleElement &&
        titleElement.scrollWidth <= artistsElement.offsetWidth + 20
      ) {
        if (!titleElement.className.includes(this.classes.ellipsis))
          titleElement.classList.add(this.classes.ellipsis);
      } else if (titleElement.className.includes(this.classes.ellipsis))
        titleElement.classList.remove(this.classes.ellipsis);

      artistsElement.replaceChildren(...trackArtists);
      if (artistsElement.scrollWidth > artistsElement.offsetWidth + 20) {
        if (this.modalAnimations.artistsElement) this.modalAnimations.artistsElement.cancel();
        this.modalAnimations.artistsElement = artistsElement.animate(
          [
            { transform: "translateX(0)" },
            {
              transform: `translateX(-${
                artistsElement.scrollWidth - artistsElement.offsetWidth
              }px)`,
            },
          ],
          {
            iterations: Infinity,
            duration: (artistsElement.scrollWidth - artistsElement.offsetWidth) * 50,
            direction: "alternate-reverse",
            easing: "linear",
          },
        );
      } else if (
        this.modalAnimations.artistsElement &&
        artistsElement.scrollWidth <= artistsElement.offsetWidth + 20
      ) {
        this.modalAnimations.artistsElement.cancel();
        this.modalAnimations.artistsElement = undefined;
      }

      if (
        !this.modalAnimations.artistsElement &&
        artistsElement.scrollWidth <= artistsElement.offsetWidth + 20
      ) {
        if (!artistsElement.className.includes(this.classes.ellipsis))
          artistsElement.classList.add(this.classes.ellipsis);
      } else if (artistsElement.className.includes(this.classes.ellipsis))
        artistsElement.classList.remove(this.classes.ellipsis);
    } else {
      if (this.modalAnimations.artistsElement) {
        this.modalAnimations.artistsElement.cancel();
        this.modalAnimations.artistsElement = undefined;
      }

      if (this.modalAnimations.titleElement) {
        this.modalAnimations.titleElement.cancel();
        this.modalAnimations.titleElement = undefined;
      }

      if (modalElement.style.display !== "none") modalAnimations.fadeout();
      if (dockElement.style.display !== "none") dockAnimations.fadeout();
    }
  }

  public async handleSpotifyStateChange(data: SpotifyPlayerStateData): Promise<void> {
    if (!this.modalInjected) this.injectModal();
    this.playerState.isPlaying = data.isPlaying;

    if (!this.playerState.accountId) {
      this.playerState.accountId = data.accountId;
      logger.log(
        "ModalManager#handleSpotifyStateChange",
        "SpotifyModal",
        undefined,
        "Registered new account ID:",
        this.playerState.accountId,
      );
    }

    if (this.playerState.accountId !== data.accountId) {
      logger.warn(
        "ModalManager#handleSpotifyStateChange",
        "SpotifyModal",
        undefined,
        "New state's account ID differs from current account ID. State change will be ignored.",
      );
      return;
    }

    if (data.isPlaying) {
      logger.log(
        "ModalManager#handleSpotifyStateChange",
        "SpotifyModal",
        undefined,
        "State updated: Playing",
        data,
      );

      if (!data?.track) {
        logger.warn(
          "ModalManager#handleSpotifyStateChange",
          "SpotifyModal",
          undefined,
          "State is missing the track property!",
        );
        return;
      }

      this.playerState.trackState.duration = data.track.duration;
      this.playerState.trackState.passed = data.position;
      this.playerState.trackState.albumUrl = data.track.isLocal
        ? ""
        : `https://open.spotify.com/album/${data.track.album.id}`;

      this.updateModal(data);
    } else {
      logger.log(
        "ModalManager#handleSpotifyStateChange",
        "SpotifyModal",
        undefined,
        `State updated: Not playing, ${data.track ? "paused" : "closed"}`,
        data,
      );

      if (!data.track) this.playerState.accountId = "";

      this.updateModal(data);
    }
  }

  public registerFluxSubscription(): void {
    if (this.fluxSubscriptionFunction !== undefined) {
      logger.warn(
        "ModalManager#registerFluxSubscription",
        "SpotifyModal",
        undefined,
        "Already registered",
      );
    } else {
      // @ts-expect-error - fluxDispatcher is not a string
      common.fluxDispatcher.subscribe(
        "SPOTIFY_PLAYER_STATE",
        this.handleSpotifyStateChange.bind(this),
      );
      this.fluxSubscriptionFunction = [
        // @ts-expect-error - fluxDispatcher is not a string
        ...common.fluxDispatcher._subscriptions.SPOTIFY_PLAYER_STATE.values(),
        // @ts-expect-error - fluxDispatcher is not a string
      ][common.fluxDispatcher._subscriptions.SPOTIFY_PLAYER_STATE.size - 1];
      logger.log(
        "ModalManager#registerFluxSubscription",
        "SpotifyModal",
        undefined,
        "Registered FluxDispatcher subscription",
      );
    }
  }

  public unregisterFluxSubscription(): void {
    if (this.fluxSubscriptionFunction === undefined) {
      logger.warn(
        "ModalManager#unregisterFluxSubscription",
        "SpotifyModal",
        undefined,
        "Already unregistered",
      );
    } else {
      // @ts-expect-error - fluxDispatcher is not a string
      common.fluxDispatcher.unsubscribe("SPOTIFY_PLAYER_STATE", this.fluxSubscriptionFunction);
      logger.log(
        "ModalManager#unregisterFluxSubscription",
        "SpotifyModal",
        undefined,
        "Unregistered FluxDispatcher subscription",
      );
    }
  }
}

const modalManager = new ModalManager();

// Register anchorlike href for cover art image
coverArtElement.onclick = () => {
  if (!modalManager.playerState.trackState.albumUrl) return;
  window.open(modalManager.playerState.trackState.albumUrl, "_blank");
};

// Register controls
playPauseIcon.onclick = () => {
  controls.togglePlaybackState();
};

repeatIcon.onclick = () => {
  let nextMode = 0;
  if (modalManager.playerState.repeatMode === "off") nextMode = 1;
  else if (modalManager.playerState.repeatMode === "context") nextMode = 2;
  else if (modalManager.playerState.repeatMode === "track") nextMode = 0;
  controls.toggleRepeatState(nextMode);
};

repeatIcon.onmouseenter = () => {
  repeatIcon.style.color = "var(--brand-experiment-400)";
};

repeatIcon.onmouseleave = () => {
  repeatIcon.style.color =
    modalManager.playerState.repeatMode === "off"
      ? "var(--text-normal)"
      : "var(--brand-experiment-500)";
};

shuffleIcon.onclick = () => {
  controls.togglePlaybackShuffle(!modalManager.playerState.shuffleOn);
};

shuffleIcon.onmouseenter = () => {
  shuffleIcon.style.color = "var(--brand-experiment-400)";
};

shuffleIcon.onmouseleave = () => {
  shuffleIcon.style.color = modalManager.playerState.shuffleOn
    ? "var(--brand-experiment-500)"
    : "var(--text-normal)";
};

skipPreviousIcon.onclick = () => {
  controls.skipToPreviousOrNext(false);
};

skipNextIcon.onclick = () => {
  controls.skipToPreviousOrNext();
};

// @ts-expect-error - We are doing mutations
window.SpotifyModal = {
  components: {
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
  },
  icons: {
    pausePath,
    playPath,
    playPauseIcon,
    repeatIcon,
    repeatAllPath,
    repeatOnePath,
    repeatIconTitle,
    shuffleIcon,
    shuffleIconTitle,
    skipNextIcon,
    skipPreviousIcon,
  },
  controls,
  modalManager,
};

export async function start(): Promise<void> {
  await modalManager.getClasses();
  modalManager.registerFluxSubscription();
}

export function stop(): void {
  modalManager.uninjectModal();
  if (typeof modalManager.timebarSetIntervalId === "number")
    clearInterval(modalManager.timebarSetIntervalId);
  modalManager.unregisterFluxSubscription();
}
