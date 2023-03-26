/* eslint-disable
  @typescript-eslint/naming-convention
*/

import { Injector, common, util, types, webpack } from 'replugged';
import { Modal, config, defaultConfig, logger } from './components/index';
import { SpotifySocket, SpotifyStore } from './types';
import { Root, RootOptions } from 'react-dom/client';

const { ReactDOM, api } = common;
const { createRoot } = ReactDOM as unknown as {
  createRoot: (container: Element | DocumentFragment, options?: RootOptions) => Root;
};

export const injector = new Injector();
export const root = { element: document.createElement('div') } as {
  element: HTMLDivElement;
  react: Root;
};
root.element.classList.add('spotify-modal-root');
root.react = createRoot(root.element);

const modal = <Modal />;
root.react.render(modal);

const baseURL = 'https://api.spotify.com/v1/me/';
export let store = (await webpack.waitForModule(
  webpack.filters.byProps('getActiveSocketAndDevice'),
)) as unknown as SpotifyStore;
export let discordAnalytics = await webpack.waitForModule<{
  default: { track: (name: string) => unknown };
}>(webpack.filters.byProps('track', 'isThrottled'));
export let autoPauseModule = {} as { raw: Record<string, types.AnyFunction>; key: string };
autoPauseModule.raw = await webpack.waitForModule<Record<string, types.AnyFunction>>(
  webpack.filters.bySource(/\.PLAYER_PAUSE/),
);
autoPauseModule.key = webpack.getFunctionKeyBySource(autoPauseModule.raw, /\.PLAYER_PAUSE/);

export const spotifyAPI = {
  fetchToken: (accountId: string) =>
    api.get<{ access_token: string }>({
      url: `/users/@me/connections/spotify/${accountId}/access-token`,
    }),
  sendGenericRequest: (
    accessToken: string,
    endpoint: string,
    method?: string,
    query?: Record<string, string | number | boolean>,
    body?: BodyInit,
  ): void | Promise<Response> => {
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

    // eslint-disable-next-line consistent-return
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
  getActionFromResponse: (res: Response): types.AnyFunction => {
    if (res.url.match(/me\/player\/(play|pause)/g)) return spotifyAPI.setPlaybackState;
    else if (res.url.match(/me\/player\/shuffle/g)) return spotifyAPI.setShuffleState;
    else if (res.url.match(/me\/player\/repeat/g)) return spotifyAPI.setRepeatState;
    else if (res.url.match(/me\/player\/(next|previous)/g)) return spotifyAPI.skipNextOrPrevious;
    else if (res.url.match(/me\/player\/seek/g)) return spotifyAPI.seekToPosition;
    else if (res.url.match(/me\/player\/volume/g)) return spotifyAPI.setPlaybackVolume;
    else if (res.url.match(/me\/player/g)) return spotifyAPI.getPlayerState;
    else if (res.url.match(/me\/devices/g)) return spotifyAPI.getDevices;
    else if (res.url.match(/me\/tracks/g)) return spotifyAPI.saveOrRemoveTracks;
    else return spotifyAPI.sendGenericRequest;
  },
  getPlayerState: (accessToken: string): Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player', 'GET') as Promise<Response>,
  getDevices: (accessToken: string): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/devices', 'GET') as Promise<Response>,
  saveOrRemoveTracks: (
    accessToken: string,
    save = true,
    ...tracks: string[]
  ): Promise<Response> => {
    if (config.get('debuggingLogControls', false))
      logger.log(save ? 'Adding' : 'Removing', 'tracks:', tracks);
    return spotifyAPI.sendGenericRequest(
      accessToken,
      'tracks',
      save ? 'PUT' : 'DELETE',
      undefined,
      JSON.stringify({ ids: tracks }),
    ) as Promise<Response>;
  },
  setPlaybackState: (accessToken: string, state: boolean): Promise<Response> => {
    if (config.get('debuggingLogControls', false)) logger.log('Set playback state:', state);
    return spotifyAPI.sendGenericRequest(
      accessToken,
      `player/${state ? 'play' : 'pause'}`,
      'PUT',
    ) as Promise<Response>;
  },
  setRepeatState: (accessToken: string, state: 'off' | 'context' | 'track'): Promise<Response> => {
    if (config.get('debuggingLogControls', false)) logger.log('Set repeat state:', state);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/repeat', 'PUT', {
      state,
    }) as Promise<Response>;
  },
  setShuffleState: (accessToken: string, state: boolean): Promise<Response> => {
    if (config.get('debuggingLogControls', false)) logger.log('Set shuffle state:', state);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/shuffle', 'PUT', {
      state,
    }) as Promise<Response>;
  },
  seekToPosition: (accessToken: string, position: number): Promise<Response> => {
    if (config.get('debuggingLogControls', false)) logger.log('Seek to position:', position);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/seek', 'PUT', {
      position_ms: position,
    }) as Promise<Response>;
  },
  setPlaybackVolume: (accessToken: string, volume: number): Promise<Response> => {
    if (config.get('debuggingLogControls', false)) logger.log('Set playback volume:', volume);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/volume', 'PUT', {
      volume_percent: volume,
    }) as Promise<Response>;
  },
  skipNextOrPrevious: (accessToken: string, next = true): Promise<Response> => {
    if (config.get('debuggingLogControls', false))
      logger.log('Skipping to:', next ? 'next' : 'previous', 'track');
    return spotifyAPI.sendGenericRequest(
      accessToken,
      `player/${next ? 'next' : 'previous'}`,
      'POST',
    ) as Promise<Response>;
  },
};

export async function getStore(): Promise<SpotifyStore> {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps('getActiveSocketAndDevice'),
    )) as unknown as SpotifyStore;
  return store;
}

// For patching out SPOTIFY_AUTO_PAUSED analytics
export async function getDiscordAnalytics(): Promise<{
  default: { track: (name: string) => unknown };
}> {
  if (!discordAnalytics)
    discordAnalytics = await webpack.waitForModule<{
      default: { track: (name: string) => unknown };
    }>(webpack.filters.byProps('track', 'isThrottled'));
  return discordAnalytics;
}

export async function getAutoPauseModule(): Promise<{
  raw: Record<string, types.AnyFunction>;
  key: string;
}> {
  if (!autoPauseModule.raw || !autoPauseModule.key) {
    autoPauseModule.raw = await webpack.waitForModule<Record<string, types.AnyFunction>>(
      webpack.filters.bySource(/\.PLAYER_PAUSE/),
    );
    autoPauseModule.key = webpack.getFunctionKeyBySource(autoPauseModule.raw, /\.PLAYER_PAUSE/);
  }

  return autoPauseModule;
}

export async function getAllSpotifyAccounts(): Promise<Record<string, SpotifySocket>> {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps('getActiveSocketAndDevice'),
    )) as unknown as SpotifyStore;
  return store.__getLocalVars().accounts;
}

export function logIfConfigTrue(
  key: keyof typeof defaultConfig,
  level: 'log' | 'warn' | 'error' = 'log',
  ...rest: unknown[]
): void {
  if (config.get(key)) logger[level](`(${key})`, ...rest);
}

// Components related
export function panelExists(): boolean {
  return Boolean(document.body.querySelectorAll('[class^="panels-"]').length);
}

export function isModalInjected(): boolean {
  return Boolean(document.body.querySelectorAll('.spotify-modal-root').length);
}

export function addRootToPanel(): void {
  if (!panelExists() || isModalInjected()) return;

  const panel = document.body.querySelector('[class^="panels-"] > [class^="container-"]');
  if (!panel) {
    logIfConfigTrue(
      'debuggingLogModalInjection',
      'error',
      'Adding modal root failed: User panel container does not exist',
    );
    return;
  }

  panel.insertAdjacentElement('beforebegin', root.element);
  if (isModalInjected())
    logIfConfigTrue('debuggingLogModalInjection', 'log', 'Modal root added to panel');
  else
    logIfConfigTrue(
      'debuggingLogModalInjection',
      'error',
      'Modal root not added to panel. Please contact plugin developer.',
    );
}

export function removeRootFromPanel(): void {
  if (!panelExists() || !isModalInjected()) return;

  const panels = document.body.querySelector('[class^="panels-"]');
  if (!panels) {
    logIfConfigTrue(
      'debuggingLogModalInjection',
      'error',
      'Removing modal root failed: User panel does not exist',
    );
    return;
  }

  panels.removeChild(root.element);
  if (!isModalInjected())
    logIfConfigTrue('debuggingLogModalInjection', 'log', 'Modal root removed from panel');
  else
    logIfConfigTrue(
      'debuggingLogModalInjection',
      'error',
      'Modal root not removed from panel. Please contact plugin developer.',
    );
}

export function patchPanel(): void {
  if (!panelExists() || isModalInjected()) return;

  const panels = document.body.querySelector('[class^="panels-"] > [class^="container-"]');
  if (!panels) {
    logIfConfigTrue(
      'debuggingLogModalInjection',
      'error',
      'Patching panel failed: User panel container does not exist',
    );
    return;
  }

  const instance = util.getOwnerInstance(panels);

  if (!instance) {
    logIfConfigTrue(
      'debuggingLogModalInjection',
      'error',
      "Patching panel failed: Cannot get user panel container's owner instance",
    );
    return;
  }

  injector.after(Object.getPrototypeOf(instance), 'render', (_, res) => {
    if (!isModalInjected()) addRootToPanel();
    return res;
  });

  instance.forceUpdate();
  logIfConfigTrue('debuggingLogModalInjection', 'log', 'Panel render function patched');
}
