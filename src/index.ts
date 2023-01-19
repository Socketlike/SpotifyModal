import { Component, EventEmitter, SpotifyAPI, SpotifySocketFunctions } from './common';
import { components, icons } from './components';
import { SpotifyWatcher } from './utils';

export const watcher = new SpotifyWatcher();
export const classes = {
  Component,
  EventEmitter,
  SpotifyAPI,
  SpotifyWatcher,
};
export const functions = {
  SpotifySocketFunctions,
};
export const ui = { components, icons };

export async function start(): Promise<void> {}

export function stop(): void {
  watcher.removeAllListeners();
  watcher.unload();
}
