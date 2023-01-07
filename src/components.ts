export const ElementBuilders = {
  createSVGElement(
    classes?: string,
    style?: string,
    attributes?: { [key: string]: string },
    children?: Array<HTMLElement | SVGElement>,
  ): SVGSVGElement {
    const element: SVGSVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    element.setAttributeNS(null, "style", "width: 24px; height: 24px");
    element.setAttributeNS(null, "viewBox", "0 0 24 24");
    if (typeof classes === "string") element.classList.add(...classes.split(" "));
    if (typeof style === "string")
      element.setAttributeNS(null, "style", `${element.getAttribute("style")}; ${style}`);
    if (typeof attributes === "object" && !Array.isArray(attributes))
      Object.entries(attributes).forEach(([key, value]: [string, string]): void => {
        element.setAttributeNS(null, key, value);
      });
    if (Array.isArray(children) && children?.length)
      children.forEach((child: HTMLElement | SVGElement): void => {
        if (child && (child instanceof HTMLElement || child instanceof SVGElement))
          element.appendChild(child);
      });
    return element;
  },
  createPathElement(
    classes?: string,
    path?: string,
    style?: string,
    attributes?: { [key: string]: string },
    children?: Array<HTMLElement | SVGElement>,
  ): SVGPathElement {
    const element: SVGPathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    element.setAttributeNS(null, "fill", "currentColor");
    if (typeof path === "string") element.setAttributeNS(null, "d", path);
    if (typeof classes === "string") element.classList.add(...classes.split(" "));
    if (typeof style === "string") element.setAttributeNS(null, "style", style);
    if (typeof attributes === "object" && !Array.isArray(attributes))
      Object.entries(attributes).forEach(([key, value]: [string, string]): void => {
        element.setAttribute(key, value);
      });
    if (Array.isArray(children) && children?.length)
      children.forEach((child: HTMLElement | SVGElement): void => {
        if (child && (child instanceof HTMLElement || child instanceof SVGElement))
          element.appendChild(child);
      });
    return element;
  },
  createTitleElement(
    classes?: string,
    style?: string,
    attributes?: { [key: string]: string },
    children?: Array<HTMLElement | SVGElement>,
  ): SVGTitleElement {
    const element: SVGTitleElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "title",
    );
    if (typeof classes === "string") element.classList.add(...classes.split(" "));
    if (typeof style === "string") element.setAttributeNS(null, "style", style);
    if (typeof attributes === "object" && !Array.isArray(attributes))
      Object.entries(attributes).forEach(([key, value]: [string, string]): void => {
        element.setAttribute(key, value);
      });
    if (Array.isArray(children) && children?.length)
      children.forEach((child: HTMLElement | SVGElement): void => {
        if (child && (child instanceof HTMLElement || child instanceof SVGElement))
          element.appendChild(child);
      });
    return element;
  },
  createDivElement(
    classes?: string,
    style?: string,
    attributes?: { [key: string]: string },
    children?: Array<HTMLElement | SVGElement>,
  ): HTMLDivElement {
    const element: HTMLDivElement = document.createElement("div");
    if (typeof classes === "string") element.classList.add(...classes.split(" "));
    if (typeof style === "string") element.setAttribute("style", style);
    if (typeof attributes === "object" && !Array.isArray(attributes))
      Object.entries(attributes).forEach(([key, value]: [string, string]): void => {
        element.setAttribute(key, value);
      });
    if (Array.isArray(children) && children?.length)
      children.forEach((child: HTMLElement | SVGElement): void => {
        if (child && (child instanceof HTMLElement || child instanceof SVGElement))
          element.appendChild(child);
      });
    return element;
  },
  createImageElement(
    classes?: string,
    style?: string,
    attributes?: { [key: string]: string },
    children?: Array<HTMLElement | SVGElement>,
  ): HTMLImageElement {
    const element: HTMLImageElement = document.createElement("img");
    if (typeof classes === "string") element.classList.add(...classes.split(" "));
    if (typeof style === "string") element.setAttribute("style", style);
    if (typeof attributes === "object" && !Array.isArray(attributes))
      Object.entries(attributes).forEach(([key, value]: [string, string]): void => {
        element.setAttribute(key, value);
      });
    if (Array.isArray(children) && children?.length)
      children.forEach((child: HTMLElement | SVGElement): void => {
        if (child && (child instanceof HTMLElement || child instanceof SVGElement))
          element.appendChild(child);
      });
    return element;
  },
  createSpanElement(
    classes?: string,
    style?: string,
    attributes?: { [key: string]: string },
    children?: Array<HTMLElement | SVGElement>,
  ): HTMLSpanElement {
    const element: HTMLSpanElement = document.createElement("span");
    if (typeof classes === "string") element.classList.add(...classes.split(" "));
    if (typeof style === "string") element.setAttribute("style", style);
    if (typeof attributes === "object" && !Array.isArray(attributes))
      Object.entries(attributes).forEach(([key, value]: [string, string]): void => {
        element.setAttribute(key, value);
      });
    if (Array.isArray(children) && children?.length)
      children.forEach((child: HTMLElement | SVGElement): void => {
        if (child && (child instanceof HTMLElement || child instanceof SVGElement))
          element.appendChild(child);
      });
    return element;
  },
  createAnchorElement(
    classes?: string,
    style?: string,
    attributes?: { [key: string]: string },
    children?: Array<HTMLElement | SVGElement>,
  ): HTMLAnchorElement {
    const element: HTMLAnchorElement = document.createElement("a");
    if (typeof classes === "string") element.classList.add(...classes.split(" "));
    if (typeof style === "string") element.setAttribute("style", style);
    if (typeof attributes === "object" && !Array.isArray(attributes))
      Object.entries(attributes).forEach(([key, value]: [string, string]): void => {
        element.setAttribute(key, value);
      });
    if (Array.isArray(children) && children?.length)
      children.forEach((child: HTMLElement | SVGElement): void => {
        if (child && (child instanceof HTMLElement || child instanceof SVGElement))
          element.appendChild(child);
      });
    return element;
  },
};

/* Play & pause icon */
const playPath: SVGPathElement = ElementBuilders.createPathElement(
  "spotify-modal-play-icon-path",
  "M8,5.14V19.14L19,12.14L8,5.14Z",
);
const pausePath: SVGPathElement = ElementBuilders.createPathElement(
  "spotify-modal-pause-icon-path",
  "M14,19H18V5H14M6,19H10V5H6V19Z",
);
const playPauseIcon: SVGSVGElement = ElementBuilders.createSVGElement(
  "spotify-modal-play-pause-icon",
  "color: var(--text-normal); margin: 0px 10px",
  undefined,
  [playPath],
);
playPauseIcon.onmouseenter = () => {
  playPauseIcon.style.color = "var(--brand-experiment-500)";
};
playPauseIcon.onmouseleave = () => {
  playPauseIcon.style.color = "var(--text-normal)";
};

/* Repeat icon */
const repeatAllPath: SVGPathElement = ElementBuilders.createPathElement(
  "spotify-modal-repeat-all-path",
  "M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",
);
const repeatOnePath: SVGPathElement = ElementBuilders.createPathElement(
  "spotify-modal-repeat-one-path",
  "M13,15V9H12L10,10V11H11.5V15M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",
);
const repeatIconTitle: SVGTitleElement = ElementBuilders.createTitleElement(
  "spotify-modal-repeat-icon-title",
);
const repeatIcon: SVGSVGElement = ElementBuilders.createSVGElement(
  "spotify-modal-repeat-icon",
  "color: var(--text-normal); margin: 0px 10px 0px auto",
  undefined,
  [repeatIconTitle, repeatAllPath],
);

/* Shuffle icon */
const shuffleIconTitle: SVGTitleElement = ElementBuilders.createTitleElement(
  "spotify-modal-shuffle-icon-title",
);
const shuffleIcon: SVGSVGElement = ElementBuilders.createSVGElement(
  "spotify-modal-shuffle-icon",
  "color: var(--text-normal);",
  undefined,
  [
    shuffleIconTitle,
    ElementBuilders.createPathElement(
      "spotify-modal-shuffle-icon-path",
      "M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z",
    ),
  ],
);

/* Skip previous icon */
export const skipPreviousIcon: SVGSVGElement = ElementBuilders.createSVGElement(
  "spotify-modal-skip-previous-icon",
  "color: var(--text-normal); margin-left: auto",
  undefined,
  [
    ElementBuilders.createPathElement(
      "spotify-modal-skip-previous-icon-path",
      "M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z",
    ),
  ],
);
skipPreviousIcon.onmouseenter = () => {
  skipPreviousIcon.style.color = "var(--brand-experiment-400)";
};
skipPreviousIcon.onmouseleave = () => {
  skipPreviousIcon.style.color = "var(--text-normal)";
};

/* Skip next icon */
export const skipNextIcon = ElementBuilders.createSVGElement(
  "spotify-modal-skip-next-icon",
  "color: var(--text-normal)",
  undefined,
  [
    ElementBuilders.createPathElement(
      "spotify-modal-skip-next-icon-path",
      "M16,18H18V6H16M6,18L14.5,12L6,6V18Z",
    ),
  ],
);
skipNextIcon.onmouseenter = () => {
  skipNextIcon.style.color = "var(--brand-experiment-400)";
};
skipNextIcon.onmouseleave = () => {
  skipNextIcon.style.color = "var(--text-normal)";
};

export const icons = {
  playPath,
  pausePath,
  playPauseIcon,
  repeatIconTitle,
  repeatAllPath,
  repeatOnePath,
  repeatIcon,
  shuffleIconTitle,
  shuffleIcon,
  skipPreviousIcon,
  skipNextIcon,
};

/* Dock icons container */
const _dockIconsElement: HTMLDivElement = ElementBuilders.createDivElement(
  "spotify-modal-dock-icons",
  "padding-top: 5px; " +
    "padding-left: 5px; " +
    "height: 24px; " +
    "width: 100%; " +
    "display: flex; " +
    "flex-direction: row",
  undefined,
  [shuffleIcon, skipPreviousIcon, playPauseIcon, skipNextIcon, repeatIcon],
);

/* Song title */
const titleElement: HTMLAnchorElement = ElementBuilders.createAnchorElement(
  "spotify-modal-song-title",
  "font-size: 14px",
  { target: "_blank" },
);

/* Artist list */
const artistsElement: HTMLDivElement = ElementBuilders.createDivElement(
  "spotify-modal-song-artists",
  "color: var(--header-secondary); font-size: 13px",
);

/* Song title & Artists container */
const _metadataElement: HTMLDivElement = ElementBuilders.createDivElement(
  "spotify-modal-metadata",
  "margin: 10px; " +
    "display: flex; " +
    "flex-direction: column; " +
    "max-width: 145px; " +
    "overflow: hidden; " +
    "white-space: nowrap",
  undefined,
  [titleElement, artistsElement],
);

/* Current playback time element */
const playbackTimeCurrentElement: HTMLSpanElement = ElementBuilders.createSpanElement(
  "spotify-modal-playback-time-current",
);

/* Playback duration element */
const playbackTimeDurationElement: HTMLSpanElement = ElementBuilders.createSpanElement(
  "spotify-modal-playback-time-duration",
  "margin-left: auto; margin-right: 16px",
);

/* Playback time display container */
const _playbackTimeDisplayElement: HTMLDivElement = ElementBuilders.createDivElement(
  "spotify-modal-playback-time",
  "display: flex; " +
    "position: relative; " +
    "top: -7px; " +
    "left: 8px; " +
    "height: 16px; " +
    "color: var(--text-normal); " +
    "font-size: 12px",
  undefined,
  [playbackTimeCurrentElement, playbackTimeDurationElement],
);

/* Progress bar inner */
const progressBarInnerElement: HTMLDivElement = ElementBuilders.createDivElement(
  "spotify-modal-progressbar-inner",
  "background-color: var(--text-normal); " +
    "height: 4px; " +
    "width: 0%; " +
    "max-width: 100%; " +
    "border-radius: 8px",
);

/* Progress bar */
const _progressBarElement: HTMLDivElement = ElementBuilders.createDivElement(
  "spotify-modal-progressbar",
  "height: 4px; " +
    "border-radius: 8px; " +
    "background-color: var(--background-modifier-accent); " +
    "width: calc(100% - 10px); " +
    "position: relative; " +
    "left: 5px; " +
    "top: -5px; " +
    "margin: 0px",
  undefined,
  [progressBarInnerElement],
);

/* Cover art */
const coverArtElement: HTMLImageElement = ElementBuilders.createImageElement(
  "spotify-modal-cover-art",
  "max-height: 80%; max-width: 80%; border-radius: 8px; object-fit: contain",
);

/* Playback time & Icons container */
const dockElement: HTMLDivElement = ElementBuilders.createDivElement(
  "spotify-modal-dock",
  "display: flex; flex-direction: column; padding-bottom: 4px",
  undefined,
  [_playbackTimeDisplayElement, _progressBarElement, _dockIconsElement],
);
let dockAnimations: {
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
const modalElement = ElementBuilders.createDivElement(
  "spotify-modal",
  "display: flex; height: 60px; padding-bottom: 8px; padding-top: 4px",
  undefined,
  [coverArtElement, _metadataElement],
);
let modalAnimations: {
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

export const components = {
  _dockIconsElement,
  titleElement,
  artistsElement,
  _metadataElement,
  playbackTimeCurrentElement,
  playbackTimeDurationElement,
  _playbackTimeDisplayElement,
  progressBarInnerElement,
  _progressBarElement,
  coverArtElement,
  dockElement,
  dockAnimations,
  modalElement,
  modalAnimations,
};
