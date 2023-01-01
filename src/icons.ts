function createSVG(): SVGSVGElement {
  const svg: SVGSVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttributeNS(null, "style", "width: 24px; height: 24px");
  svg.setAttributeNS(null, "viewBox", "0 0 24 24");
  return svg;
}

function createPath(d: string): SVGPathElement {
  const path: SVGPathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttributeNS(null, "fill", "currentColor");
  path.setAttributeNS(null, "d", d);

  return path;
}

/* Desktop icon */
/* Removed to make space for the new control buttons
export const desktopIcon = createSVG();
export const desktopIconTitle: SVGTitleElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "title",
);
desktopIcon.setAttributeNS(
  "null",
  "style",
  desktopIcon.getAttribute("style") +
    `; color: var(--brand-experiment-500); ` +
    `position: relative; ` +
    `top: -125px; ` +
    `left: 210px`,
);
desktopIcon.style.color = "var(--brand-experiment-500)";
desktopIcon.classList.add("desktopIcon");
desktopIcon.appendChild(desktopIconTitle);
desktopIcon.appendChild(
  createPath(
    "M4,6H20V16H4M20,18A2,2 0 0,0 22,16V6C22,4.89 21.1,4 20,4H4C2.89,4 2,4.89 2,6V16A2,2 0 0,0 4,18H0V20H24V18H20Z",
  ),
); */

/* Play & pause icon */
export const playPauseIcon = createSVG();
export const playPath = createPath("M8,5.14V19.14L19,12.14L8,5.14Z");
export const pausePath = createPath("M14,19H18V5H14M6,19H10V5H6V19Z");
playPauseIcon.style.color = "var(--text-normal)";
playPauseIcon.style.margin = "0px 10px";
playPauseIcon.classList.add("playIcon");
playPauseIcon.appendChild(playPath);
playPauseIcon.onmouseenter = () => {
  playPauseIcon.style.color = "var(--brand-experiment-500)";
};
playPauseIcon.onmouseleave = () => {
  playPauseIcon.style.color = "var(--text-normal)";
};

/* Repeat icon */
export const repeatIcon = createSVG();
export const repeatAllPath = createPath(
  "M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",
);
export const repeatOnePath = createPath(
  "M13,15V9H12L10,10V11H11.5V15M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",
);
export const repeatIconTitle: SVGTitleElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "title",
);
repeatIcon.style.margin = "0px 10px 0px auto";
repeatIcon.style.color = "var(--text-normal)";
repeatIcon.classList.add("repeatIcon");
repeatIcon.appendChild(repeatIconTitle);
repeatIcon.appendChild(repeatAllPath);

/* Smartphone icon */
/* Removed to make space for the new control buttons
export const smartphoneIcon = createSVG();
export const smartphoneIconTitle: SVGTitleElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "title",
);
smartphoneIcon.setAttributeNS(
  null,
  "style",
  smartphoneIcon.getAttribute("style") +
    `; color: var(--brand-experiment-500); ` +
    `position: relative; ` +
    `top: 6px; ` +
    `left: 210px`,
);
smartphoneIcon.classList.add("smartphoneIcon");
smartphoneIcon.appendChild(smartphoneIconTitle);
smartphoneIcon.appendChild(
  createPath(
    "M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z",
  ),
); */

/* Shuffle icon */
export const shuffleIcon = createSVG();
export const shuffleIconTitle = document.createElementNS("http://www.w3.org/2000/svg", "title");
shuffleIcon.style.color = "var(--text-normal)";
shuffleIcon.classList.add("shuffleIcon");
shuffleIcon.appendChild(shuffleIconTitle);
shuffleIcon.appendChild(
  createPath(
    "M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z",
  ),
);

/* Skip previous icon */
export const skipPreviousIcon = createSVG();
skipPreviousIcon.style.color = "var(--text-normal)";
skipPreviousIcon.style.marginLeft = "auto";
skipPreviousIcon.classList.add("skipPreviousIcon");
skipPreviousIcon.appendChild(createPath("M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z"));
skipPreviousIcon.onmouseenter = () => {
  skipPreviousIcon.style.color = "var(--brand-experiment-400)";
};
skipPreviousIcon.onmouseleave = () => {
  skipPreviousIcon.style.color = "var(--text-normal)";
};

/* Skip next icon */
export const skipNextIcon = createSVG();
skipNextIcon.style.color = "var(--text-normal)";
skipNextIcon.classList.add("skipNextIcon");
skipNextIcon.appendChild(createPath("M16,18H18V6H16M6,18L14.5,12L6,6V18Z"));
skipNextIcon.onmouseenter = () => {
  skipNextIcon.style.color = "var(--brand-experiment-400)";
};
skipNextIcon.onmouseleave = () => {
  skipNextIcon.style.color = "var(--text-normal)";
};
