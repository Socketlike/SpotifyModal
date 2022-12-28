import { Logger, common, webpack } from "replugged";
import { artistsElement, coverArtElement, modalElement, parseArtists, titleElement } from "./modal";

/*
  Very WIP Spotify modal implementation
  FYI: This is my first time using JavaScript's Web APIs so if I do
       things differently than normal people does then please let me know
 */

// asportnoy please export Logger as a global Replugged module
const logger = new Logger("SpotifyModal", "SpotifyModal");

let panel: Element;
let modalInjected = false;
let classes: {
  panels: {
    panels: string;
  };
  container: string;
  anchors: {
    anchor: string;
    anchorUnderlineOnHover: string;
  };
  activity: {
    activityName: string;
    bodyLink: string;
    ellipsis: string;
    nameNormal: string;
  };
  colors: {
    defaultColor: string;
    "text-sm/semibold": string;
  };
};
let fluxDispatcherFunctionIndex = 0;

const handleSpotifyPlayerStateChange = (data: {
  isPlaying: boolean;
  track: {
    id: string;
    album: { image: { url: string } };
    artists: Array<{ name: string; id: string }>;
    name: string;
  };
}): void => {
  if (!modalInjected)
    if (!injectModal()) {
      logger.warn("handleSpotifyPlayerStateChange() failed: Modal injection failed");
      return;
    }
  if (data.isPlaying) {
    modalElement.style.display = "flex";
    coverArtElement.src =
      typeof data?.track?.album?.image?.url === "string" ? data.track.album.image.url : "";

    const trackArtists = parseArtists(
      data.track,
      `${classes.anchors.anchor} ` +
        `${classes.anchors.anchorUnderlineOnHover} ` +
        `${classes.activity.bodyLink} ` +
        `${classes.activity.ellipsis}`,
    );
    const trackName = typeof data?.track?.name === "string" ? data.track.name : "Unknown";

    if (typeof data?.track?.id === "string")
      titleElement.setAttribute("href", `https://open.spotify.com/track/${data.track.id}`);
    else titleElement.removeAttribute("href");

    titleElement.replaceChildren(document.createTextNode(trackName));
    artistsElement.replaceChildren(...trackArtists);
    logger.log("Spotify state changed; player is playing", data);
  } else {
    logger.log("Spotify state changed; player is not playing", data);
    modalElement.style.display = "none";
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
    fluxDispatcherFunctionIndex =
      // @ts-expect-error - _subscriptions exists on fluxDispatcher
      common.fluxDispatcher._subscriptions.SPOTIFY_PLAYER_STATE.size - 1;
  }
}

export function injectModal(): boolean {
  if (!document.body.getElementsByClassName(classes.panels.panels)[0]) {
    logger.warn("injectModal() failed: Cannot get user panel");
    return false;
  }
  if (!panel) panel = document.body.getElementsByClassName(classes.panels.panels)[0];
  if (!classes.container)
    for (const element of panel.children) {
      if (/^container-[a-zA-Z0-9]{6}$/.test(element.className))
        classes.container = element.className;
    }
  if (!classes.container) {
    logger.warn("injectModal() failed: Container class name was still not found");
    return false;
  }
  if (modalInjected) {
    logger.warn("injectModal() failed: Modal was already injected");
    return false;
  }
  if (!modalElement.className.includes("container")) modalElement.classList.add(classes.container);
  // @ts-expect-error - afterBegin is assignable to InsertPosition
  panel.insertAdjacentElement("afterBegin", modalElement);
  logger.log("Modal injected");
  return (modalInjected = true);
}

export function uninjectModal(): boolean {
  if (!modalInjected) {
    logger.warn("uninjectModal() failed: Modal is not injected");
    return false;
  }
  if (!document.body.getElementsByClassName(classes.panels.panels)[0]) {
    logger.warn("uninjectModal() failed: Cannot get user panel");
    return false;
  }
  if (!panel) panel = document.body.getElementsByClassName(classes.panels.panels)[0];
  panel.removeChild(modalElement);
  logger.warn("Modal uninjected");
  return true;
}

export function stop(): void {
  uninjectModal();
  // @ts-expect-error - _subscriptions exists on fluxDispatcher
  if (common.fluxDispatcher._subscriptions.SPOTIFY_PLAYER_STATE)
    // @ts-expect-error - fluxDispatcher is not string
    common.fluxDispatcher.unsubscribe(
      "SPOTIFY_PLAYER_STATE",
      // @ts-expect-error - _subscriptions exists on fluxDispatcher
      [...common.fluxDispatcher._subscriptions.SPOTIFY_PLAYER_STATE][fluxDispatcherFunctionIndex],
    );
}
