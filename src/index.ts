import { common, webpack, logger } from "replugged";
import { getSpotifySocket, getAllSpotifySockets, SpotifyWatcher, SpotifyControls, SpotifyModal } from "./utils";

const modal = new SpotifyModal();

window.SpotifyModal = {
  getSpotifySocket,
  getAllSpotifySockets,
  SpotifyWatcher,
  SpotifyControls,
  SpotifyModal,
  modal,
}

export async function start() {
  await modal.load();
}

export async function stop() {
  modal.unload();
}