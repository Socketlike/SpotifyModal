import { EventEmitter, SpotifyAPI, SpotifySocketFunctions, elementUtilities } from "./common";
import { SpotifyWatcher } from "./utils";

export const watcher = new SpotifyWatcher();
export const classes = {
  EventEmitter,
  SpotifyAPI,
  SpotifyWatcher,
};
export const functions = {
  SpotifySocketFunctions,
  elementUtilities,
};

export async function start(): Promise<void> {}

export function stop(): void {
  watcher.removeAllListeners();
  watcher.unload();
}
