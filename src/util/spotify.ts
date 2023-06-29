/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/naming-convention */
import {
  AllControlInteractions,
  SpotifyAccount,
  SpotifySocketPayloadDeviceStateEvent,
  SpotifySocketPayloadPlayerStateEvent,
  SpotifyStore,
} from '@typings';
import { common, types, webpack } from 'replugged';
import { events, logger } from '@util';
import { config } from '@config';

const { api, fluxDispatcher, toast } = common;

const baseURL = 'https://api.spotify.com/v1/me/';

const persist = { value: false };

export const store = await webpack.waitForModule<SpotifyStore>(
  webpack.filters.byProps('getActiveSocketAndDevice'),
);

export const spotifyAccounts = store.__getLocalVars().accounts;

export const currentSpotifyAccount = { id: '' };

export const spotifyAPI = {
  get actionFromResponseMatches() {
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

      if (newToken.ok)
        fluxDispatcher.dispatch({
          type: 'SPOTIFY_ACCOUNT_ACCESS_TOKEN',
          accountId,
          accessToken: newToken.body.access_token,
        });

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
    for (const { match, action } of spotifyAPI.actionFromResponseMatches)
      if (match.test(res.url)) return action;
  },
  getPlayerState: (accessToken: string): Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player', 'GET') as Promise<Response>,
  getDevices: (accessToken: string): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/devices', 'GET') as Promise<Response>,
  setPlaybackState: (accessToken: string, state: boolean): Promise<Response> =>
    spotifyAPI.sendGenericRequest(
      accessToken,
      `player/${state ? 'play' : 'pause'}`,
      'PUT',
    ) as Promise<Response>,
  setRepeatState: (accessToken: string, state: 'off' | 'context' | 'track'): Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/repeat', 'PUT', {
      state,
    }) as Promise<Response>,
  setShuffleState: (accessToken: string, state: boolean): Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/shuffle', 'PUT', {
      state,
    }) as Promise<Response>,
  seekToPosition: (accessToken: string, position: number): Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/seek', 'PUT', {
      position_ms: position,
    }) as Promise<Response>,
  setPlaybackVolume: (accessToken: string, volume: number): Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'player/volume', 'PUT', {
      volume_percent: volume,
    }) as Promise<Response>,
  skipNextOrPrevious: (accessToken: string, next = true): Promise<Response> =>
    spotifyAPI.sendGenericRequest(
      accessToken,
      `player/${next ? 'next' : 'previous'}`,
      'POST',
    ) as Promise<Response>,
};

export const getAccessTokenFromAccountId = (accountId?: string): string => {
  if (!accountId) return spotifyAccounts[currentSpotifyAccount.id]?.accessToken || '';

  return spotifyAccounts[accountId]?.accessToken || '';
};

export const getAccountFromAccountId = (accountId?: string): SpotifyAccount => {
  if (!accountId) return spotifyAccounts[currentSpotifyAccount.id];

  return spotifyAccounts[accountId];
};

const controlInteractionErrorHandler = async (
  res: Response,
  ...data: unknown[]
): Promise<Response> => {
  if (config.get('automaticReauthentication') && res.status === 401) {
    logger.log('access token deauthorized. attempting reauthentication');

    const newToken = await spotifyAPI.refreshSpotifyAccessToken(currentSpotifyAccount.id, true);

    if (!newToken.ok)
      toast.toast(
        'An error occurred whilst reauthenticating. Check console for details.',
        toast.Kind.FAILURE,
      );
    else {
      logger.log('retrying action');

      const actionRes = (await spotifyAPI.getActionFromResponse(res)(
        getAccessTokenFromAccountId(),
        ...data,
      )) as Response;

      if (!actionRes.ok) {
        logger.error('action failed, status', actionRes.status, actionRes);
        toast.toast('Action failed. Check console for details.', toast.Kind.FAILURE);
      }
    }
  } else if (res.status === 401)
    toast.toast('Access token deauthenticated. Please manually update your state.');
  else if (res.status === 403) {
    const { error } = (await res.clone().json()) as { error: { message: string; reason: string } };

    toast.toast(
      error?.message
        ? `${error.message} (${error.reason})`
        : 'Player command failed: unknown reason. check console for more details.',
      toast.Kind.FAILURE,
    );

    logger.log('player command action response:', res.clone(), error);
  }

  persist.value = false;
  return res;
};

events.on<AllControlInteractions>('controlInteraction', (event): void => {
  if (!currentSpotifyAccount.id) return;

  persist.value = true;

  const accessToken = getAccessTokenFromAccountId();

  switch (event.detail.type) {
    case 'shuffle': {
      const { currentState } = event.detail;

      spotifyAPI
        .setShuffleState(accessToken, !currentState)
        .then(
          (res: Response): Promise<Response> => controlInteractionErrorHandler(res, !currentState),
        );

      break;
    }
    case 'skipPrev': {
      if (
        event.detail.currentProgress >=
        event.detail.currentDuration * config.get('skipPreviousProgressResetThreshold')
      )
        spotifyAPI
          .seekToPosition(accessToken, 0)
          .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res, 0));
      else
        spotifyAPI
          .skipNextOrPrevious(accessToken, false)
          .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res, false));
      break;
    }
    case 'playPause': {
      const { currentState } = event.detail;

      spotifyAPI
        .setPlaybackState(accessToken, !currentState)
        .then(
          (res: Response): Promise<Response> => controlInteractionErrorHandler(res, !currentState),
        );
      break;
    }
    case 'skipNext': {
      spotifyAPI
        .skipNextOrPrevious(accessToken)
        .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res));
      break;
    }
    case 'repeat': {
      const { newState, currentState } = event.detail;

      if (
        typeof newState === 'string' &&
        typeof currentState === 'string' &&
        newState !== currentState
      )
        spotifyAPI
          .setRepeatState(accessToken, newState)
          .then(
            (res: Response): Promise<Response> => controlInteractionErrorHandler(res, newState),
          );

      break;
    }
    case 'seek': {
      const { newProgress } = event.detail;

      spotifyAPI
        .seekToPosition(accessToken, newProgress)
        .then(
          (res: Response): Promise<Response> => controlInteractionErrorHandler(res, newProgress),
        );

      break;
    }
    case 'volume': {
      const { newVolume } = event.detail;

      spotifyAPI
        .setPlaybackVolume(accessToken, Math.round(newVolume))
        .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res, newVolume));

      break;
    }
    default: {
      persist.value = false;
      break;
    }
  }
});

events.on<SpotifyApi.CurrentPlaybackResponse>('ready', async (): Promise<void> => {
  if (store.shouldShowActivity()) {
    const accountIds = Object.keys(spotifyAccounts);
    let res: Response;
    let raw: string;

    for (const accountId of accountIds) {
      res = await spotifyAPI.getPlayerState(getAccessTokenFromAccountId(accountId));
      raw = await res.clone().text();

      if (raw && res.ok) {
        const state = JSON.parse(raw) as SpotifyApi.CurrentPlaybackResponse;
        currentSpotifyAccount.id = accountId;

        events.emit('stateUpdate', state);

        break;
      }
    }
  }
});

events.on<{
  accountId: string;
  data: SpotifySocketPayloadPlayerStateEvent | SpotifySocketPayloadDeviceStateEvent;
}>('message', (event): void => {
  const { accountId, data } = event.detail;

  if (!currentSpotifyAccount.id) currentSpotifyAccount.id = accountId;

  if (currentSpotifyAccount.id !== accountId) return;

  if (data.type === 'PLAYER_STATE_CHANGED') events.emit('stateUpdate', data.event.state);
  else if (data.type === 'DEVICE_STATE_CHANGED') {
    if (!persist.value) {
      if (!data.event.devices.length) currentSpotifyAccount.id = '';

      events.emit('showUpdate', Boolean(data.event.devices.length));
    } else persist.value = false;
  }
});
