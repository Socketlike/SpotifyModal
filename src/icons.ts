/* Smartphone icon */
export const smartphoneIcon: SVGSVGElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "svg",
);
export const _smartphonePath: SVGPathElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "path",
);
export const smartphoneIconTitle: SVGTitleElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "title",
);
smartphoneIcon.setAttributeNS(
  null,
  "style",
  "width: 24px; height: 24px; color: var(--brand-experiment-500)",
);
smartphoneIcon.setAttributeNS(null, "viewBox", "0 0 24 24");
_smartphonePath.setAttributeNS(null, "fill", "currentColor");
_smartphonePath.setAttributeNS(
  null,
  "d",
  "M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z",
);
smartphoneIcon.appendChild(smartphoneIconTitle);
smartphoneIcon.appendChild(_smartphonePath);
smartphoneIcon.classList.add("smartphoneIcon");

/* Desktop icon */
export const desktopIcon: SVGSVGElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "svg",
);
export const _desktopPath: SVGPathElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "path",
);
export const desktopIconTitle: SVGTitleElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "title",
);
desktopIcon.setAttributeNS(
  null,
  "style",
  "width: 24px; height: 24px; color: var(--brand-experiment-500)",
);
desktopIcon.setAttributeNS(null, "viewBox", "0 0 24 24");
_desktopPath.setAttributeNS(null, "fill", "currentColor");
_desktopPath.setAttributeNS(
  null,
  "d",
  "M4,6H20V16H4M20,18A2,2 0 0,0 22,16V6C22,4.89 21.1,4 20,4H4C2.89,4 2,4.89 2,6V16A2,2 0 0,0 4,18H0V20H24V18H20Z",
);
desktopIcon.appendChild(desktopIconTitle);
desktopIcon.appendChild(_desktopPath);
desktopIcon.classList.add("desktopIcon");

/* Repeat icon */
export const repeatIcon: SVGSVGElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "svg",
);
export const _repeatPath: SVGPathElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "path",
);
export const repeatIconTitle: SVGTitleElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "title",
);
repeatIcon.setAttributeNS(
  null,
  "style",
  "width: 24px; " +
    "height: 24px; " +
    "color: var(--text-normal); " +
    "margin-left: auto; " +
    "margin-right: 10px",
);
repeatIcon.setAttributeNS(null, "viewBox", "0 0 24 24");
_repeatPath.setAttributeNS(null, "fill", "currentColor");
_repeatPath.setAttributeNS(
  null,
  "d",
  "M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",
);
repeatIcon.appendChild(repeatIconTitle);
repeatIcon.appendChild(_repeatPath);
repeatIcon.classList.add("repeatIcon");
