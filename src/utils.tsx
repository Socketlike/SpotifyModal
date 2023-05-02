/* eslint-disable
  @typescript-eslint/naming-convention
*/

import { Injector, common, util, types, webpack } from 'replugged';
import { Modal, config, defaultConfig, logger } from './components/index';
import { Root, RootOptions } from 'react-dom/client';

const { ReactDOM, api } = common;
const { createRoot } = ReactDOM as unknown as {
  createRoot: (container: Element | DocumentFragment, options?: RootOptions) => Root;
};

const styleClasses = await webpack.waitForModule<{
  container: string;
}>(webpack.filters.byProps('container', 'godlike'));

export const injector = new Injector();
export const root = { element: document.createElement('div') } as {
  element: HTMLDivElement;
  react: Root;
};
root.element.id = 'spotify-modal-root';
root.element.classList.add('spotify-modal-root');
root.react = createRoot(root.element);

const modal = <Modal containerClass={styleClasses.container || ''} />;
root.react.render(modal);

const baseURL = 'https://api.spotify.com/v1/me/';
export let store = (await webpack.waitForModule(
  webpack.filters.byProps('getActiveSocketAndDevice'),
)) as unknown as Spotify.Store;
export let discordAnalytics = await webpack.waitForModule<{
  default: { track: (name: string) => unknown };
}>(webpack.filters.byProps('track', 'isThrottled'));
export let autoPauseModule = {} as { raw: Record<string, types.AnyFunction>; key: string };
autoPauseModule.raw = await webpack.waitForModule<Record<string, types.AnyFunction>>(
  webpack.filters.bySource(/\.PLAYER_PAUSE/),
);
autoPauseModule.key = webpack.getFunctionKeyBySource(autoPauseModule.raw, /\.PLAYER_PAUSE/);

export const spotifyAPI = {
  get actionToResponseMatches() {
    return [
      { match: /me\/player\/(play|pause)/g, action: spotifyAPI.setPlaybackState },
      { match: /me\/player\/shuffle/g, action: spotifyAPI.setShuffleState },
      { match: /me\/player\/repeat/g, action: spotifyAPI.setRepeatState },
      { match: /me\/player\/(next|previous)/g, action: spotifyAPI.skipNextOrPrevious },
      { match: /me\/player\/seek/g, action: spotifyAPI.seekToPosition },
      { match: /me\/player\/volume/g, action: spotifyAPI.setPlaybackVolume },
      { match: /me\/player/g, action: spotifyAPI.getPlayerState },
      { match: /me\/devices/g, action: spotifyAPI.getDevices },
      { match: /.*/, action: spotifyAPI.sendGenericRequest },
    ];
  },
  fetchToken: (accountId: string) =>
    api.get<{ access_token: string }>({
      url: `/users/@me/connections/spotify/${accountId}/access-token`,
    }),
  refreshSpotifyAccessToken: async (
    accountId: string,
    discord: boolean,
  ): Promise<{ ok: boolean; accessToken?: string }> => {
    if (discord) {
      const newToken = await spotifyAPI.fetchToken(accountId);

      if (!newToken.ok) {
        logIfConfigTrue(
          'automaticReauthentication',
          'warn',
          'failed to fetch new token, status',
          newToken.status,
          newToken,
        );
      } else {
        common.fluxDispatcher.dispatch({
          type: 'SPOTIFY_ACCOUNT_ACCESS_TOKEN',
          accountId: accountId,
          accessToken: newToken.body.access_token,
        });

        return { ok: true, accessToken: newToken.body.access_token };
      }

      return { ok: false };
    }
  },
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
    for (const { match, action } of spotifyAPI.actionToResponseMatches) {
      if (match.test(res.url)) return action;
    }
  },
  getPlayerState: (accessToken: string): Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player', 'GET') as Promise<Response>,
  getDevices: (accessToken: string): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/devices', 'GET') as Promise<Response>,
  setPlaybackState: (accessToken: string, state: boolean): Promise<Response> => {
    logIfConfigTrue('debuggingLogControls', 'log', 'set playback state:', state);
    return spotifyAPI.sendGenericRequest(
      accessToken,
      `player/${state ? 'play' : 'pause'}`,
      'PUT',
    ) as Promise<Response>;
  },
  setRepeatState: (accessToken: string, state: 'off' | 'context' | 'track'): Promise<Response> => {
    logIfConfigTrue('debuggingLogControls', 'log', 'set repeat state:', state);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/repeat', 'PUT', {
      state,
    }) as Promise<Response>;
  },
  setShuffleState: (accessToken: string, state: boolean): Promise<Response> => {
    logIfConfigTrue('debuggingLogControls', 'log', 'set shuffle state:', state);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/shuffle', 'PUT', {
      state,
    }) as Promise<Response>;
  },
  seekToPosition: (accessToken: string, position: number): Promise<Response> => {
    logIfConfigTrue('debuggingLogControls', 'log', 'seek to position:', position);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/seek', 'PUT', {
      position_ms: position,
    }) as Promise<Response>;
  },
  setPlaybackVolume: (accessToken: string, volume: number): Promise<Response> => {
    logIfConfigTrue('debuggingLogControls', 'log', 'set playback volume:', volume);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/volume', 'PUT', {
      volume_percent: volume,
    }) as Promise<Response>;
  },
  skipNextOrPrevious: (accessToken: string, next = true): Promise<Response> => {
    logIfConfigTrue(
      'debuggingLogControls',
      'log',
      'skipping to:',
      next ? 'next' : 'previous',
      'track',
    );
    return spotifyAPI.sendGenericRequest(
      accessToken,
      `player/${next ? 'next' : 'previous'}`,
      'POST',
    ) as Promise<Response>;
  },
};

export async function getStore(): Promise<Spotify.Store> {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps('getActiveSocketAndDevice'),
    )) as unknown as Spotify.Store;
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

export async function getAllSpotifyAccounts(): Promise<Record<string, Spotify.Account>> {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps('getActiveSocketAndDevice'),
    )) as unknown as Spotify.Store;
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
/* Currently unused
export function openModal(
  Component: (props: {
    modalProps: RepluggedMissingComponentsType.ModalProps;
    [key: string]: unknown;
  }) => JSX.Element,
  otherProps = {} as Record<string, unknown>,
): string {
  return common.modal.openModal((props) => <Component modalProps={props} {...otherProps} />);
} */

export function panelExists(): boolean {
  return !!document.body.querySelectorAll('[class^=panels-]').length;
}

export function isModalInjected(): boolean {
  return !!document.getElementById('spotify-modal-root');
}

enum ManageRootModes {
  add = 'add',
  patch = 'patch',
  remove = 'remove',
}

export const manageRoot = Object.assign(
  (mode: keyof typeof ManageRootModes) => {
    if (!panelExists())
      logIfConfigTrue(
        'debuggingLogModalInjection',
        'error',
        'managing modal root failed: user panel does not exist',
      );

    const panel = document.body.querySelector('[class^=panels-] > [class^=container-]');
    const rootPanel = document.body.querySelector('[class^=panels-]');

    switch (mode) {
      case 'add': {
        if (!isModalInjected()) {
          panel.insertAdjacentElement('beforebegin', root.element);
          logIfConfigTrue('debuggingLogModalInjection', 'log', 'modal root added to panel');
        } else logIfConfigTrue('debuggingLogModalInjection', 'log', 'modal root already exists');
        break;
      }

      case 'remove': {
        if (isModalInjected()) {
          rootPanel.removeChild(root.element);
          logIfConfigTrue('debuggingLogModalInjection', 'log', 'modal root removed from panel');
        } else logIfConfigTrue('debuggingLogModalInjection', 'log', 'modal root already removed');
        break;
      }

      case 'patch': {
        if (!isModalInjected()) {
          const instance = util.getOwnerInstance(panel);

          if (!instance) {
            logIfConfigTrue(
              'debuggingLogModalInjection',
              'error',
              "managing modal root failed: cannot get user panel container's owner instance",
            );
            return;
          }

          injector.after(Object.getPrototypeOf(instance), 'render', (_, res) => {
            if (!isModalInjected()) manageRoot(manageRoot.mode.add);
            return res;
          });

          instance.forceUpdate();
          logIfConfigTrue('debuggingLogModalInjection', 'log', 'panel render function patched');
        } else
          logIfConfigTrue(
            'debuggingLogModalInjection',
            'log',
            'panel render function already patched',
          );
        break;
      }

      default:
        logIfConfigTrue('debuggingLogModalInjection', 'warn', 'unknown manage modal mode', mode);
    }
  },
  {
    mode: ManageRootModes,
  },
);
