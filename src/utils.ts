/* eslint-disable
  @typescript-eslint/naming-convention
*/

import { Logger, common, webpack } from 'replugged';
import { Root } from 'react-dom/client';
import { ReactDOMCreateRoot, SpotifySocket, SpotifyStore } from './types';

const { ReactDOM } = common;
// @ts-expect-error - No other way to type ReactDOM.createRoot
const { createRoot }: { createRoot: ReactDOMCreateRoot } = ReactDOM;

const baseURL = 'https://api.spotify.com/v1/me/';
let store = (await webpack.waitForModule(
  webpack.filters.byProps('getActiveSocketAndDevice'),
)) as unknown as SpotifyStore;

export const logger = Logger.plugin('SpotifyModal');

export const spotifyAPI = {
  sendGenericRequest(
    accessToken: string,
    endpoint: string,
    method?: string,
    query?: Record<string, string | number | boolean>,
    body?: BodyInit,
  ): void | Promise<Response> {
    if (
      typeof accessToken !== 'string' ||
      typeof endpoint !== 'string' ||
      (method && !['GET', 'POST', 'PUT'].includes(method))
    )
      return;
    const url = new URL(endpoint, baseURL);

    if (typeof query === 'object' && !Array.isArray(query))
      Object.entries(query).forEach(([key, val]): void => {
        if (typeof key !== 'string' || !['string', 'number', 'boolean'].includes(typeof val))
          return;
        // @ts-expect-error - String, number, boolean all work on this
        url.searchParams.append(key, val);
      });

    return fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      ...(body ? { body } : {}),
      mode: 'cors',
    });
  },
  getPlayerState: (accessToken: string): Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player', 'GET') as Promise<Response>,
  getDevices: (accessToken: string): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/devices', 'GET') as Promise<Response>,
  // it's just the 'like tracks' endpoint but instead of being called like tracks they called it save tracks
  saveTracks: (accessToken: string, ...tracks: string[]): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(
      accessToken,
      'tracks',
      'PUT',
      undefined,
      JSON.stringify({ ids: tracks }),
    ) as Promise<Response>,
  setPlaybackState: (
    accessToken: string,
    state: boolean,
    deviceId?: string,
  ): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, `player/${state ? 'play' : 'pause'}`, 'PUT', {
      device_id: deviceId,
    }) as Promise<Response>,
  setRepeatState: (
    accessToken: string,
    state: 'off' | 'context' | 'track',
    deviceId?: string,
  ): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/repeat', 'PUT', {
      state,
      device_id: deviceId,
    }) as Promise<Response>,
  setShuffleState: (
    accessToken: string,
    state: boolean,
    deviceId?: string,
  ): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/shuffle', 'PUT', {
      state,
      device_id: deviceId,
    }) as Promise<Response>,
  seekToPosition: (
    accessToken: string,
    position: number,
    deviceId?: string,
  ): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/seek', 'PUT', {
      position_ms: position,
      device_id: deviceId,
    }) as Promise<Response>,
  setPlaybackVolume: (
    accessToken: string,
    volume: number,
    deviceId?: string,
  ): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/volume', 'PUT', {
      volume_percent: volume,
      device_id: deviceId,
    }) as Promise<Response>,
  skipNextOrPrevious: (
    accessToken: string,
    next = true,
    deviceId?: string,
  ): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, `player/${next ? 'next' : 'previous'}`, 'POST', {
      device_id: deviceId,
    }) as Promise<Response>,
};

export async function getStore(): Promise<SpotifyStore> {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps('getActiveSocketAndDevice'),
    )) as unknown as SpotifyStore;
  return store;
}

export async function getAllSpotifyAccounts(): Promise<Record<string, SpotifySocket>> {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps('getActiveSocketAndDevice'),
    )) as unknown as SpotifyStore;
  return store.__getLocalVars().accounts;
}

// Components related
export function panelExists(): boolean {
  const panels = document.body.querySelectorAll('[class^="panels-"]');
  return Boolean(panels.length);
}

export function addRootToPanel(): void | { element: HTMLDivElement; root: Root } {
  if (!panelExists()) return;
  const element = document.createElement('div');
  element.classList.add('spotify-modal-root');

  const panels = document.body.querySelectorAll('[class^="panels-"]');
  let panel: HTMLDivElement;
  if (panels.length) panel = panels[0] as HTMLDivElement;
  else return;

  panel.insertAdjacentElement('afterbegin', element);
  const root = createRoot(element);

  return { element, root };
}

export function removeRootFromPanelAndUnmount(root: { element: HTMLDivElement; root: Root }): void {
  if (!(root?.element instanceof HTMLDivElement) || (root?.root && !('_internalRoot' in root.root)))
    return;

  const panels = document.body.querySelectorAll('[class^="panels-"]');
  let panel: HTMLDivElement;
  if (panels.length) panel = panels[0] as HTMLDivElement;
  else return;

  panel.removeChild(root.element);
  root.root.unmount();
}
