export const modalElement: HTMLDivElement = document.createElement("div");
export const coverArtElement: HTMLImageElement = document.createElement("img");
export const titleElement: HTMLAnchorElement = document.createElement("a");
export const artistsElement: HTMLDivElement = document.createElement("div");
export const metadataElement: HTMLDivElement = document.createElement("div");
modalElement.classList.add("spotify-modal");
coverArtElement.classList.add("spotify-modal-cover-art");
titleElement.classList.add("spotify-modal-song-title");
artistsElement.classList.add("spotify-modal-song-artists");
metadataElement.classList.add("spotify-modal-metadata");
modalElement.setAttribute("style", "display: flex; height: 80px;");
metadataElement.appendChild(titleElement);
metadataElement.appendChild(artistsElement);
modalElement.appendChild(coverArtElement);
modalElement.appendChild(metadataElement);
titleElement.setAttribute("target", "_blank");
titleElement.setAttribute("style", "font-size: 14px");
artistsElement.setAttribute("style", "color: var(--header-secondary); font-size: 13px;");
coverArtElement.setAttribute(
  "style",
  "max-height: 80%; max-width: 80%; border-radius: 8px; object-fit: contain;",
);
metadataElement.setAttribute(
  "style",
  "padding: 10px; display: flex; flex-direction: column; max-width: 145px;",
);

export function parseArtists(
  track: {
    artists: Array<{ name: string; id: string }>;
    name: string;
  },
  additionalLinkElementClasses: string,
): Array<Text | HTMLAnchorElement> {
  const res: Array<Text | HTMLAnchorElement> = [document.createTextNode("by ")];
  if (track.artists.length) {
    track.artists.forEach(({ name, id }: { name: string; id: string }, index: number) => {
      const element = document.createElement("a");
      element.setAttribute("target", "_blank");
      if (typeof id === "string") {
        element.setAttribute("href", `https://open.spotify.com/artist/${id}`);
        element.style.color = "var(--header-secondary)";
        element.classList.add(
          ...(typeof additionalLinkElementClasses === "string"
            ? additionalLinkElementClasses.split(" ")
            : []),
        );
      }
      element.appendChild(document.createTextNode(name));
      if (track.artists.length - 1 !== index) {
        res.push(element);
        res.push(document.createTextNode(", "));
      } else res.push(element);
    });
  }
  if (res.length === 1) res[0] = document.createTextNode("by Unknown");
  return res;
}
