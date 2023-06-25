/* eslint-disable
  @typescript-eslint/naming-convention
*/

import { common, types } from 'replugged';
import { config } from '@utils/config';
import { logWithTag, logger } from '@utils/misc';
import { getAllSpotifyAccounts } from '@utils/modules';

const { fluxDispatcher, api } = common;

const baseURL = 'https://api.spotify.com/v1/me/';

export const accounts = {} as Record<string, SpotifyStore.Socket>;
export const allAccounts = await getAllSpotifyAccounts();
export const currentAccount = { id: '' };

const logControls = logWithTag('(debuggingLogControls)');
const logAutomaticAuthentication = logWithTag('(automaticAuthentication)');

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
        if (config.get('automaticReauthentication'))
          logAutomaticAuthentication(
            logger.warn,
            'failed to fetch new token, status',
            newToken.status,
            newToken,
          );
      } else {
        fluxDispatcher.dispatch({
          type: 'SPOTIFY_ACCOUNT_ACCESS_TOKEN',
          accountId,
          accessToken: newToken.body.access_token,
        });
      }

      return { ok: newToken.ok, accessToken: newToken?.body?.access_token };
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
    if (config.get('debuggingLogControls'))
      logger.log('(debuggingLogControls)', 'set playback state:', state);
    return spotifyAPI.sendGenericRequest(
      accessToken,
      `player/${state ? 'play' : 'pause'}`,
      'PUT',
    ) as Promise<Response>;
  },
  setRepeatState: (accessToken: string, state: 'off' | 'context' | 'track'): Promise<Response> => {
    if (config.get('debuggingLogControls')) logControls(logger.log, 'set repeat state:', state);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/repeat', 'PUT', {
      state,
    }) as Promise<Response>;
  },
  setShuffleState: (accessToken: string, state: boolean): Promise<Response> => {
    if (config.get('debuggingLogControls')) logControls(logger.log, 'set shuffle state:', state);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/shuffle', 'PUT', {
      state,
    }) as Promise<Response>;
  },
  seekToPosition: (accessToken: string, position: number): Promise<Response> => {
    if (config.get('debuggingLogControls')) logControls(logger.log, 'seek to position:', position);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/seek', 'PUT', {
      position_ms: position,
    }) as Promise<Response>;
  },
  setPlaybackVolume: (accessToken: string, volume: number): Promise<Response> => {
    if (config.get('debuggingLogControls')) logControls(logger.log, 'set playback volume:', volume);
    return spotifyAPI.sendGenericRequest(accessToken, 'player/volume', 'PUT', {
      volume_percent: volume,
    }) as Promise<Response>;
  },
  skipNextOrPrevious: (accessToken: string, next = true): Promise<Response> => {
    if (config.get('debuggingLogControls'))
      logControls(logger.log, 'skipping to:', next ? 'next' : 'previous', 'track');
    return spotifyAPI.sendGenericRequest(
      accessToken,
      `player/${next ? 'next' : 'previous'}`,
      'POST',
    ) as Promise<Response>;
  },
};

export const getAccessTokenFromAccountId = (accountId?: string): string => {
  if (!accountId) return accounts?.[currentAccount.id]?.accessToken || '';

  return accounts?.[accountId]?.accessToken || '';
};

export const getAccountFromAccountId = (accountId?: string): SpotifyStore.Socket => {
  if (!accountId) return accounts?.[currentAccount.id];

  return accounts?.[accountId];
};
