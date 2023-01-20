import { Component, EventEmitter, SpotifyAPI, SpotifySocketFunctions } from './common';
import { components, icons } from './components';
import { SpotifyModalManager, SpotifyWatcher } from './utils';

/**
 * Issues:
 * PlayPause button not updating state
 * Watcher behaves weirdly on startup - investigate
 */

export const modal = new SpotifyModalManager();
export const classes = {
  Component,
  EventEmitter,
  SpotifyAPI,
  SpotifyModalManager,
  SpotifySocketFunctions,
  SpotifyWatcher,
};
export const ui = { components, icons };

export async function start(): Promise<void> {
  await modal.load();
}

export function stop(): void {
  modal.unload();
}
