/* eslint-disable
  @typescript-eslint/naming-convention
*/
import { Logger, common, webpack } from 'replugged';
import {
  SpotifyDevice,
  SpotifyStore,
  SpotifySocket,
  SpotifyWebSocketRawParsedMessage,
  SpotifyWebSocketState,
} from './types';

const { React, ReactDOM } = common;
const baseURL = 'https://api.spotify.com/v1/me/player/';
let store = (await webpack.waitForModule(
  webpack.filters.byProps('getActiveSocketAndDevice'),
)) as unknown as SpotifyStore;
let accountList: Record<string, SpotifySocket>;

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
    }) as Promise<Response>;
  },
  getPlayerState: (accessToken: string): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, '', 'GET'),
  getDevices: (accessToken: string): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'devices', 'GET'),
  setPlaybackState: (accessToken: string, state: boolean): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, `${state ? 'play' : 'pause'}`, 'PUT'),
  setRepeatState: (
    accessToken: string,
    state: 'off' | 'context' | 'track',
  ): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'repeat', 'PUT', { state }),
  setShuffleState: (accessToken: string, state: boolean): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'shuffle', 'PUT', { state }),
  seekToPosition: (accessToken: string, position: number): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'seek', 'PUT', { position_ms: position }),
  setPlaybackVolume: (accessToken: string, volume: number): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'volume', 'PUT', { volume_percent: volume }),
  skipNextOrPrevious: (accessToken: string, next = true): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, `${next ? 'next' : 'previous'}`, 'POST'),
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

export function addRootToPanel(): void | { element: HTMLDivElement; root: ReactDOM.Root } {
  if (!panelExists()) return;
  const element = document.createElement('div') as HTMLDivElement;
  element.classList.add('spotify-modal-root');

  const panels = document.body.querySelectorAll('[class^="panels-"]');
  let panel: HTMLDivElement;
  if (panels.length) panel = panels[0] as HTMLDivElement;
  else return;

  panel.insertAdjacentElement('afterbegin', element);
  const root = ReactDOM.createRoot(element);

  return { element, root };
}

export function removeRootFromPanelAndUnmount(root: {
  element: HTMLDivElement;
  root: ReactDOM.Root;
}): void {
  if (!(root?.element instanceof HTMLDivElement) || (root?.root && !('_internalRoot' in root.root)))
    return;

  const panels = document.body.querySelectorAll('[class^="panels-"]');
  let panel: HTMLDivElement;
  if (panels.length) panel = panels[0] as HTMLDivElement;
  else return;

  panel.removeChild(root.element);
  root.root.unmount();
}
