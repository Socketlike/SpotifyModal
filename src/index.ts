import {
  ElementBuilders,
  SpotifyControls,
  SpotifyModal,
  SpotifyWatcher,
  getAllSpotifySockets,
  getSpotifySocket,
} from "./utils";

export const modal = new SpotifyModal();
export const classes = {
  SpotifyModal,
  SpotifyWatcher,
};
export const functions = {
  ElementBuilders,
  SpotifyControls,
  getAllSpotifySockets,
  getSpotifySocket,
};

/* For debugging purposes only
window.SpotifyModal = {
  components,
  classes: {
    SpotifyWatcher,
    SpotifyControls,
    SpotifyModal,
  },
  icons,
  modal,
  sockets: {
    getSpotifySocket,
    getAllSpotifySockets,
  },
};
*/

export async function start(): Promise<void> {
  await modal.load();
}

export function stop(): void {
  modal.unload();
}
