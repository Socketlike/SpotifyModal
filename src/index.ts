import { common, webpack, logger } from "replugged";
import { getSpotifySocket, getAllSpotifySockets, SpotifyWatcher, SpotifyModal } from "./utils";

const watcher = new SpotifyWatcher();

window.SpotifyModal = {
  getSpotifySocket,
  getAllSpotifySockets,
  watcher,
}

export async function start() {
  await watcher.load();
}

export const stop = watcher.unload;