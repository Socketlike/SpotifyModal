import {
  _desktopPath,
  _repeatPath,
  _smartphonePath,
  desktopIcon,
  repeatIcon,
  smartphoneIcon,
} from "./icons";

export const _dockIconsElement: HTMLDivElement = document.createElement("div");
export const _metadataElement: HTMLDivElement = document.createElement("div");
export const _playbackTimeDisplayElement: HTMLDivElement = document.createElement("div");
export const _timebarElement: HTMLDivElement = document.createElement("div");
export const artistsElement: HTMLDivElement = document.createElement("div");
export const coverArtElement: HTMLImageElement = document.createElement("img");
export const dockElement: HTMLDivElement = document.createElement("div");
export const modalElement: HTMLDivElement = document.createElement("div");
export const playbackTimeCurrentElement: HTMLSpanElement = document.createElement("span");
export const playbackTimeDurationElement: HTMLSpanElement = document.createElement("span");
export const timebarInnerElement: HTMLDivElement = document.createElement("div");
export const titleElement: HTMLAnchorElement = document.createElement("a");

/* Dock icons container */
_dockIconsElement.classList.add("spotify-modal-dock-icons");
_dockIconsElement.setAttribute(
  "style",
  "padding-top: 5px; padding-left: 5px; height: 24px; width: 100%; display: flex; flex-direction: row",
);
_dockIconsElement.appendChild(desktopIcon);
_dockIconsElement.appendChild(smartphoneIcon);
_dockIconsElement.appendChild(repeatIcon);

/* Song title & Artists container */
_metadataElement.classList.add("spotify-modal-metadata");
_metadataElement.setAttribute(
  "style",
  "padding: 10px; display: flex; flex-direction: column; max-width: 145px",
);
_metadataElement.appendChild(titleElement);
_metadataElement.appendChild(artistsElement);

/* Playback time display container */
_playbackTimeDisplayElement.classList.add("spotify-modal-playback-time");
_playbackTimeDisplayElement.setAttribute(
  "style",
  "display: flex; " +
    "position: relative; " +
    "top: -7px; " +
    "left: 8px; " +
    "height: 16px; " +
    "color: var(--text-normal); " +
    "font-size: 12px",
);
_playbackTimeDisplayElement.appendChild(playbackTimeCurrentElement);
_playbackTimeDisplayElement.appendChild(playbackTimeDurationElement);

/* Playback time bar */
_timebarElement.classList.add("spotify-modal-timebar");
_timebarElement.setAttribute(
  "style",
  "height: 4px; " +
    "border-radius: 8px; " +
    "background-color: var(--background-modifier-accent); " +
    "width: calc(100% - 10px); " +
    "position: relative; " +
    "left: 5px; " +
    "top: -5px; " +
    "margin: 0px",
);
_timebarElement.appendChild(timebarInnerElement);

/* Artist list */
artistsElement.classList.add("spotify-modal-song-artists");
artistsElement.setAttribute("style", "color: var(--header-secondary); font-size: 13px");

/* Cover art */
coverArtElement.classList.add("spotify-modal-cover-art");
coverArtElement.setAttribute(
  "style",
  "max-height: 80%; max-width: 80%; border-radius: 8px; object-fit: contain",
);

/* Playback time & Icons container */
dockElement.classList.add("spotify-modal-dock");
dockElement.setAttribute("style", "display: flex; flex-direction: column");
dockElement.appendChild(_playbackTimeDisplayElement);
dockElement.appendChild(_timebarElement);
dockElement.appendChild(_dockIconsElement);
export let dockAnimations: {
  animations: {
    fadein: Animation;
    fadeout: Animation;
  };
  fadein: () => void;
  fadeout: () => void;
};
dockAnimations = {
  animations: {
    fadein: dockElement.animate({ opacity: [0, 1] }, 700),
    fadeout: dockElement.animate({ opacity: [1, 0] }, 700),
  },
  fadein: (): void => {
    dockElement.style.display = "";
    dockAnimations.animations.fadein.play();
  },
  fadeout: (): void => {
    dockAnimations.animations.fadeout.play();
  },
};
dockAnimations.animations.fadeout.addEventListener("finish", () => {
  dockElement.style.display = "none";
});

/* Main modal */
modalElement.classList.add("spotify-modal");
modalElement.appendChild(coverArtElement);
modalElement.appendChild(_metadataElement);
modalElement.setAttribute("style", "display: flex; height: 60px; padding-bottom: 8px");
export let modalAnimations: {
  animations: {
    fadein: Animation;
    fadeout: Animation;
  };
  fadein: () => void;
  fadeout: () => void;
};
modalAnimations = {
  animations: {
    fadein: modalElement.animate({ opacity: [0, 1] }, 700),
    fadeout: modalElement.animate({ opacity: [1, 0] }, 700),
  },
  fadein: (): void => {
    modalElement.style.display = "flex";
    modalAnimations.animations.fadein.play();
  },
  fadeout: (): void => {
    modalAnimations.animations.fadeout.play();
  },
};
modalAnimations.animations.fadeout.addEventListener("finish", () => {
  modalElement.style.display = "none";
});

/* Current playback time element */
playbackTimeCurrentElement.classList.add("spotify-modal-playback-time-current");

/* Playback duration element */
playbackTimeDurationElement.classList.add("spotify-modal-playback-time-duration");
playbackTimeDurationElement.setAttribute("style", "margin-left: auto; margin-right: 16px");

/* Playback time inner bar */
timebarInnerElement.classList.add("spotify-modal-timebar-inner");
timebarInnerElement.setAttribute(
  "style",
  "background-color: var(--text-normal); " +
    "height: 4px; " +
    "max-width: 100%; " +
    "border-radius: 8px",
);

/* Song title */
titleElement.classList.add("spotify-modal-song-title");
titleElement.style.fontSize = "14px";
titleElement.target = "_blank";

/**
 * Parse artists list from a track to an array of Text and HTMLAnchorElements.
 * @param  {object}             track                        Track object
 * @param  {(string|undefined)} additionalLinkElementClasses Additional HTML classes for HTMLAnchorElements created
 * @param  {boolean}            [enableTooltip]              Enable tooltips (aka: title) on elements
 * @return {Array.<Text|HTMLAnchorElement>}                  An array of Text and HTMLAnchorElements
 */
export function parseArtists(
  track: {
    artists: Array<{ name: string; id: string }>;
    name: string;
  },
  additionalLinkElementClasses: string | undefined,
  // onRightClick: Function | undefined,
  enableTooltip?: boolean,
): Array<Text | HTMLAnchorElement> {
  const res: Array<Text | HTMLAnchorElement> = [document.createTextNode("by ")];
  if (track.artists.length) {
    track.artists.forEach(({ name, id }: { name: string; id: string }, index: number) => {
      const element =
        typeof id === "string" ? document.createElement("a") : document.createTextNode("");
      if (typeof id === "string") {
        // @ts-expect-error - In this case .target does exist on element
        element.target = "_blank";
        // @ts-expect-error - In this case .href does exist on element
        element.href = `https://open.spotify.com/artist/${id}`;
        // @ts-expect-error - In this case .style does exist on element
        element.style.color = "var(--header-secondary)";
        // @ts-expect-error - In this case .classList does exist on element
        element.classList.add(
          ...(typeof additionalLinkElementClasses === "string"
            ? additionalLinkElementClasses.split(" ")
            : []),
        );
        // @ts-expect-error - In this case .title does exist on element
        if (enableTooltip) element.title = name;
        // if (typeof onRightClick === "function") element.oncontextmenu = onRightClick;
        element.appendChild(document.createTextNode(name));
      } else {
        element.nodeValue = name;
      }
      if (track.artists.length - 1 !== index) {
        res.push(element);
        res.push(document.createTextNode(", "));
      } else res.push(element);
    });
  }
  if (res.length === 1) res[0] = document.createTextNode("by Unknown");
  return res;
}
