import { EventEmitter, SpotifyAPI, SpotifySocketFunctions, elementUtilities } from './common';
import * as com from '../unstaged/components';
import { SpotifyWatcher } from './utils';

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
export const components = com;

export async function start(): Promise<void> {}

export function stop(): void {
  watcher.removeAllListeners();
  watcher.unload();
}
