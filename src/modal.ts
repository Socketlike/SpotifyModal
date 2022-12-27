const imageElement: HTMLImageElement = document.createElement("img"),
  titleElement = document.createElement("div"),
  artistsElement = document.createElement("div"),
  metadataElement = document.createElement("div");
imageElement.classList.add("spotify-modal-image");
imageElement.setAttribute(
  "style",
  "max-height: 80%; " +
    "max-width: 80%; " +
    "border-radius: 8px; " +
    "object-fit: contain; " +
    "margin-top: 5px;",
);
titleElement.classList.add("spotify-modal-song-title");
titleElement.setAttribute(
  "style",
  "color: var(--header-primary); " +
    "font-family: var(--font-primary); " +
    "font-weight: 600; " +
    "font-size: 14px; " +
    "padding-top: 2px; " +
    "padding-bottom: 5px; " +
    "height: 14px; " +
    "overflow: hidden; " +
    "text-overflow: ellipsis;",
);
artistsElement.classList.add("spotify-modal-song-artists");
artistsElement.setAttribute(
  "style",
  "color: var(--header-secondary); " +
    "font-family: var(--font-primary); " +
    "font-weight: 400; " +
    "font-size: 13px; " +
    "overflow: hidden; " +
    "text-overflow: ellipsis;",
);
metadataElement.classList.add("spotify-modal-metadata");
metadataElement.setAttribute(
  "style",
  "padding-left: 10px; display: flex; flex-direction: column; flex-grow: 1;",
);
metadataElement.appendChild(titleElement);
metadataElement.appendChild(artistsElement);
export const modal = document.createElement("div");
modal.classList.add("spotify-modal");
modal.setAttribute("style", "display: flex; height: 80px;");
modal.appendChild(imageElement);
modal.appendChild(metadataElement);
// Todo: Remove this function
export function createLinkText(text, link): Node {
  const linkElement = document.createElement("a");
  if (typeof text === "string") linkElement.appendChild(document.createTextNode(text));
  if (typeof link === "string") {
    linkElement.setAttribute("href", link);
    linkElement.setAttribute("target", "_blank");
  }
  return linkElement;
}
