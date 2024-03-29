/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/naming-convention */
import {
  ControlInteractions,
  HTTPResponse,
  SpotifyAccount,
  SpotifySocketPayloadEvents,
  SpotifyStore,
} from '@typings';
import { common, webpack } from 'replugged';
import { events, filterObject, logger } from '@util';
import { config } from '@config';

const { api, fluxDispatcher, toast, lodash: _ } = common;

let persist = false;

export const store = await webpack.waitForModule<SpotifyStore>(
  webpack.filters.byProps('getActiveSocketAndDevice'),
);

export const spotifyAccounts = store.spotifyModalAccounts || ({} as Record<string, SpotifyAccount>);

export const currentSpotifyAccount = { id: '' };

export const getAccessTokenFromAccountId = (accountId?: string): string => {
  if (!accountId) return spotifyAccounts[currentSpotifyAccount.id]?.accessToken || '';

  return spotifyAccounts[accountId]?.accessToken || '';
};

export const getAccountFromAccountId = (accountId?: string): SpotifyAccount => {
  if (!accountId) return spotifyAccounts[currentSpotifyAccount.id];

  return spotifyAccounts.get[accountId];
};

export const refreshSpotifyToken = async (
  accountId: string,
  oauth?: boolean,
): Promise<{
  ok: boolean;
  accessToken?: string;
  res: HTTPResponse<{ access_token: string }>;
}> => {
  if (oauth) {
    // implementation
  } else {
    const newToken = await api.get<{ access_token: string }>({
      url: `/users/@me/connections/spotify/${accountId}/access-token`,
    });

    if (newToken.ok)
      fluxDispatcher.dispatch({
        type: 'SPOTIFY_ACCOUNT_ACCESS_TOKEN',
        accountId,
        accessToken: newToken.body.access_token,
      });

    return { ok: newToken.ok, accessToken: newToken?.body?.access_token, res: newToken };
  }
};

export const sendSpotifyRequest = async (
  accessToken: string,
  endpoint: string,
  method?: string,
  query?: Record<string, string | number | boolean>,
  body?: BodyInit,
  retrying?: boolean,
): Promise<Response> => {
  if (
    typeof accessToken !== 'string' ||
    typeof endpoint !== 'string' ||
    (method && !['GET', 'POST', 'PUT'].includes(method))
  )
    return;

  const url = new URL(endpoint.replace(/^\//, ''), 'https://api.spotify.com/v1/me/');

  if (typeof query === 'object' && !Array.isArray(query))
    for (const [key, val] of Object.entries(query)) {
      if (!(typeof key !== 'string' || !['string', 'number', 'boolean'].includes(typeof val)))
        // @ts-expect-error - String, number, boolean all work on this
        url.searchParams.append(key, val);
    }

  const res = await fetch(
    url,
    filterObject(
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body,
        mode: 'cors',
      } as const,
      (val) => Boolean(val),
    ),
  );

  if (!retrying) {
    switch (res.status) {
      case 401: {
        if (config.get('automaticReauthentication')) {
          events.debug('spotify', ['status 401: deauthed. reauthing', res.clone()]);

          const token = await refreshSpotifyToken(currentSpotifyAccount.id);

          if (token.ok) {
            events.debug('controls', [
              'retrying action',
              res.clone(),
              _.clone(url),
              method,
              _.clone(query),
              _.clone(body),
            ]);

            const retryRes = await sendSpotifyRequest(
              getAccessTokenFromAccountId(),
              endpoint,
              method,
              query,
              body,
              true,
            );

            if (!retryRes?.ok) {
              toast.toast(
                `An error occurred whilst retrying control action.${
                  config.get('debugging') ? ' Check console for more details.' : ''
                }`,
                toast.Kind.FAILURE,
              );

              events.debug('controls', ['retrying action failed', retryRes]);
            }

            return retryRes;
          }
        } else {
          events.debug('controls', ['status 401: deauthed. not reauthing', res.clone()]);

          toast.toast('Access token expired. Please manually update your state.');
        }

        break;
      }

      case 403: {
        const { error } = (await res.clone().json()) as {
          error: { message: string; reason: string };
        };

        toast.toast(
          `Got a 403 whilst handling control action: ${error?.reason || 'Unknown'}.${
            config.get('debugging') ? ' Check console for more details.' : ''
          }`,
          toast.Kind.FAILURE,
        );

        events.debug('controls', [
          'status 403: likely a player controls violation',
          res.clone(),
          error,
        ]);

        break;
      }
    }
  }

  persist = false;

  return res;
};

export const spotifyAPI = {
  getPlayerState: (accessToken: string): Promise<Response> =>
    sendSpotifyRequest(accessToken, 'player', 'GET'),

  getDevices: (accessToken: string): void | Promise<Response> =>
    sendSpotifyRequest(accessToken, 'player/devices', 'GET'),

  setPlaybackState: (accessToken: string, state: boolean): Promise<Response> =>
    sendSpotifyRequest(accessToken, `player/${state ? 'play' : 'pause'}`, 'PUT'),

  setRepeatState: (accessToken: string, state: 'off' | 'context' | 'track'): Promise<Response> =>
    sendSpotifyRequest(accessToken, 'player/repeat', 'PUT', {
      state,
    }),

  setShuffleState: (accessToken: string, state: boolean): Promise<Response> =>
    sendSpotifyRequest(accessToken, 'player/shuffle', 'PUT', {
      state,
    }),

  seekToPosition: (accessToken: string, position: number): Promise<Response> =>
    sendSpotifyRequest(accessToken, 'player/seek', 'PUT', {
      position_ms: position,
    }),

  setPlaybackVolume: (accessToken: string, volume: number): Promise<Response> =>
    sendSpotifyRequest(accessToken, 'player/volume', 'PUT', {
      volume_percent: volume,
    }),

  skipNextOrPrevious: (accessToken: string, next = true): Promise<Response> =>
    sendSpotifyRequest(accessToken, `player/${next ? 'next' : 'previous'}`, 'POST'),
};

events.on<ControlInteractions.Union>('controlInteraction', (event): void => {
  if (!currentSpotifyAccount.id) {
    events.debug('controls', 'prevented controls interaction because there is no active account');
    return;
  }

  persist = true;

  const accessToken = getAccessTokenFromAccountId();

  events.debug('controls', ['received controls interaction', _.clone(event.detail)]);

  switch (event.detail.type) {
    case 'shuffle': {
      const { state } = event.detail;

      spotifyAPI.setShuffleState(accessToken, !state);

      break;
    }

    case 'skipPrev': {
      const [progress, duration] = event.detail.state;

      if (progress >= duration * config.get('skipPreviousProgressResetThreshold'))
        spotifyAPI.seekToPosition(accessToken, 0);
      else spotifyAPI.skipNextOrPrevious(accessToken, false);

      break;
    }

    case 'playPause': {
      const { state } = event.detail;

      spotifyAPI.setPlaybackState(accessToken, !state);
      break;
    }

    case 'skipNext': {
      spotifyAPI.skipNextOrPrevious(accessToken);
      break;
    }

    case 'repeat': {
      const [currentState, newState] = event.detail.state;

      if (
        typeof newState === 'string' &&
        typeof currentState === 'string' &&
        newState !== currentState
      )
        spotifyAPI.setRepeatState(accessToken, newState);
      break;
    }

    case 'seek': {
      const { state: newProgress } = event.detail;

      spotifyAPI.seekToPosition(accessToken, newProgress);

      break;
    }

    case 'volume': {
      const { state: newVolume } = event.detail;

      spotifyAPI.setPlaybackVolume(accessToken, Math.round(newVolume));

      break;
    }

    default:
      persist = false;
  }
});

events.on<SpotifyApi.CurrentPlaybackResponse>('ready', async (): Promise<void> => {
  if (!store.spotifyModalAccounts) {
    toast.toast(
      "(SpotifyModal) .spotifyModalAccounts wasn't found on SpotifyStore. controls will not work. please report this on GitHub.",
      toast.Kind.FAILURE,
    );

    logger.error(
      "(spotify) critical: .spotifyModalAccounts wasn't found on SpotifyStore - the plaintext patch for it is likely broken.\nplease report this on GitHub.",
    );
  }

  if (store.shouldShowActivity()) {
    events.debug('start', ['fetching spotify state']);

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

// reset modal on account switch
events.on<void>('accountSwitch', (): void => {
  events.debug('accountSwitch', 'account switching detected - resetting modal');

  currentSpotifyAccount.id = '';

  events.emit('showUpdate', false);
});

events.on<{
  accountId: string;
  data: SpotifySocketPayloadEvents;
}>('message', (event): void => {
  const { accountId, data } = event.detail;

  if (!currentSpotifyAccount.id) {
    currentSpotifyAccount.id = accountId;

    events.debug('spotify', ['new active account:', currentSpotifyAccount.id]);
  }

  if (currentSpotifyAccount.id !== accountId) {
    events.debug('spotify', [
      'new state prevented due to mismatching account ids:',
      { active: currentSpotifyAccount.id, state: accountId },
    ]);

    return;
  }

  if (data.type === 'PLAYER_STATE_CHANGED') events.emit('stateUpdate', data.event.state);
  else if (data.type === 'DEVICE_STATE_CHANGED') {
    if (!persist) {
      if (!data.event.devices.length) currentSpotifyAccount.id = '';

      events.emit('showUpdate', Boolean(data.event.devices.length));
      events.debug('spotify', [
        'firing showUpdate (player device state)',
        Boolean(data.event.devices.length),
      ]);
    } else {
      persist = false;

      events.debug('spotify', 'not firing showUpdate (persisted. controls interaction failure?)');
    }
  }
});
