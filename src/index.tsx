/* eslint-disable @typescript-eslint/no-floating-promises */
import { common } from 'replugged';
import { Settings, Modal } from '@?components';
import {
  ceaseListeningAllAccountSockets,
  injector,
  listenAllAccountSockets,
  patchDiscordAnalytics,
  patchStoreLogger,
  patchSpotifyAutoPause,
  removeControlInteractionListener,
  root,
  rootInjection,
} from '@?utils';

import './style.css';

export * as utils from '@?utils';
export * as components from '@?components';

const { React } = common;

export async function start(): Promise<void> {
  root.fiber.render(<Modal />);
  await Promise.all([
    patchStoreLogger(),
    patchDiscordAnalytics(),
    patchSpotifyAutoPause(),
    listenAllAccountSockets(),
  ]);
}

export function stop(): void {
  ceaseListeningAllAccountSockets();
  removeControlInteractionListener();
  rootInjection.removeRoot();
  injector.uninjectAll();
}

export { Settings };
