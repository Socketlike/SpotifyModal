import {
  _desktopPath,
  _repeatPath,
  _smartphonePath,
  desktopIcon,
  repeatIcon,
  smartphoneIcon,
} from "./icons";

export const modalElement: HTMLDivElement = document.createElement("div");
export const coverArtElement: HTMLImageElement = document.createElement("img");
export const titleElement: HTMLAnchorElement = document.createElement("a");
export const artistsElement: HTMLDivElement = document.createElement("div");
export const metadataElement: HTMLDivElement = document.createElement("div");
export const _timebarElement: HTMLDivElement = document.createElement("div");
export const timebarInnerElement: HTMLDivElement = document.createElement("div");
export const dockElement: HTMLDivElement = document.createElement("div");
export const _dockIconsElement: HTMLDivElement = document.createElement("div");

/* Main modal */
modalElement.classList.add("spotify-modal");
modalElement.appendChild(coverArtElement);
modalElement.appendChild(metadataElement);
modalElement.setAttribute("style", "display: flex; height: 60px; padding-bottom: 8px;");
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

/* Cover art */
coverArtElement.classList.add("spotify-modal-cover-art");
coverArtElement.setAttribute(
  "style",
  "max-height: 80%; max-width: 80%; border-radius: 8px; object-fit: contain;",
);

/* Song title */
titleElement.classList.add("spotify-modal-song-title");
titleElement.style.fontSize = "14px";
titleElement.target = "_blank";

/* Artist list */
artistsElement.classList.add("spotify-modal-song-artists");
artistsElement.setAttribute("style", "color: var(--header-secondary); font-size: 13px;");

/* Song title & Artists container */
metadataElement.classList.add("spotify-modal-metadata");
metadataElement.setAttribute(
  "style",
  "padding: 10px; display: flex; flex-direction: column; max-width: 145px;",
);
metadataElement.appendChild(titleElement);
metadataElement.appendChild(artistsElement);

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
    "margin: 0px;",
);
_timebarElement.appendChild(timebarInnerElement);

/* Playback time inner bar */
timebarInnerElement.classList.add("spotify-modal-timebar-inner");
timebarInnerElement.setAttribute(
  "style",
  "background-color: var(--text-normal); " +
    "height: 4px; " +
    "max-width: 100%; " +
    "border-radius: 8px",
);

/* Playback time bar & Icons container */
dockElement.classList.add("spotify-modal-dock");
dockElement.setAttribute("style", "display: flex; flex-direction: column");
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

/* Dock icons container */
_dockIconsElement.classList.add("spotify-modal-dock-icons");
_dockIconsElement.setAttribute(
  "style",
  "padding-top: 5px; padding-left: 5px; height: 24px; width: 100%; display: flex; flex-direction: row;",
);
_dockIconsElement.appendChild(desktopIcon);
_dockIconsElement.appendChild(smartphoneIcon);
_dockIconsElement.appendChild(repeatIcon);

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
