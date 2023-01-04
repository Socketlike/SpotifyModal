import { common, webpack, logger } from "replugged";
import { getSpotifySocket, SpotifyWatcher } from "./utils";

const watcher = new SpotifyWatcher();

window.SpotifyModal = {
  getSpotifySocket,
  watcher,
}

export async function start() {
  await watcher.registerFlux();
}

export function stop() {
  watcher.removeFlux();
  watcher.removeSocketEvent();
}