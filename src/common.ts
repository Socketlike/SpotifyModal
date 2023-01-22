/* eslint-disable
  @typescript-eslint/naming-convention
*/
import { common, webpack } from 'replugged';
import { SpotifyStore, SpotifySocket } from './types';

const baseURL = 'https://api.spotify.com/v1/me/player/';
let store = (await webpack.waitForModule(
  webpack.filters.byProps('getActiveSocketAndDevice'),
)) as unknown as SpotifyStore;
let accountList: Record<string, SpotifySocket>;

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

export const getSpotifyAccount = async (accountId?: string): Promise<void | SpotifySocket> => {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps('getActiveSocketAndDevice'),
    )) as unknown as SpotifyStore;
  if (!accountList) accountList = store.__getLocalVars().accounts;

  if (accountId && accountId in accountList) return accountList[accountId];
  else if (!accountId) return Object.values(accountList)[0];
};
