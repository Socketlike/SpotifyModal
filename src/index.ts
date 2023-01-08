import {
  ElementBuilders,
  SpotifyModal,
  SpotifyWatcher,
  getAllSpotifySockets,
  getSpotifySocket,
  spotifyControls,
} from "./utils";

export const modal = new SpotifyModal(500, true);
export const classes = {
  SpotifyModal,
  SpotifyWatcher,
};
export const functions = {
  ElementBuilders,
  spotifyControls,
  getAllSpotifySockets,
  getSpotifySocket,
};

export async function start(): Promise<void> {
  await modal.load();
}

export function stop(): void {
  modal.unload();
}
