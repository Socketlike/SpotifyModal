/* eslint-disable no-use-before-define */
import { common } from 'replugged';
import { Modal } from '@?components';
import {
  addWebSocketListener,
  currentSpotifyAccount,
  events,
  getAccessTokenFromAccountId,
  logger,
  removeWebSocketListener,
  spotifyAPI,
  spotifyAccounts,
  store,
} from '@?util';
import {
  SpotifyAccount,
  SpotifySocketPayloadDeviceStateEvent,
  SpotifySocketPayloadPlayerStateEvent,
} from '@typings/store';
import './style.css';
import { AllControlInteractions } from '@typings';
import { config } from '@config';

const { React, toast } = common;
const persist = { value: false };

export const initialized: string[] = [];

export const renderModal = (): JSX.Element => (
  <div id='spotify-modal-root'>
    <Modal />
  </div>
);

export const spotifyProfileUpdateListener = (action: { [key: string]: unknown }): void => {
  if (!initialized.includes(action.accountId as string))
    init(action.accountId as string, spotifyAccounts[action.accountId as string], 0);
};

export const init = (
  accountId?: string,
  account?: SpotifyAccount,
  count?: number,
  last?: boolean,
): void => {
  if (!accountId && !account && !count) {
    events.emit('init');

    const accountEntries = Object.entries(spotifyAccounts);

    accountEntries.forEach(([accountId, account], index): void =>
      init(accountId, account, 0, accountEntries.length - 1 === index),
    );
  } else if (!account?.socket && 5 - count !== 0) {
    logger.warn(
      '(init)',
      `${accountId}'s socket is not initialized. waiting for ${10e3}ms. ${5 - count} ${
        5 - count === 1 ? 'retry' : 'retries'
      } remaining.`,
    );
    setTimeout((): void => init(accountId, account, count + 1));
  } else if (!account?.socket) {
    logger.warn('(init)', `${accountId}'s socket is still not initialized after 5 retries.`);

    if (last)
      common.fluxDispatcher.subscribe('SPOTIFY_PROFILE_UPDATE', spotifyProfileUpdateListener);
  } else if (account?.socket) {
    Object.defineProperty(account.socket, 'account', {
      value: account,
      enumerable: true,
      configurable: true,
    });

    addWebSocketListener(account);

    initialized.push(accountId);
    logger.log('(init)', `${accountId} initialized`);

    if (last) {
      common.fluxDispatcher.subscribe('SPOTIFY_PROFILE_UPDATE', spotifyProfileUpdateListener);
      events.emit('ready');
    }
  }
};

export const term = (accountId?: string, account?: SpotifyAccount): void => {
  if (!accountId && !account) {
    events.emit('term');

    Object.values(initialized).forEach((accountId): void =>
      term(accountId, spotifyAccounts?.[accountId]),
    );

    common.fluxDispatcher.unsubscribe('SPOTIFY_PROFILE_UPDATE', spotifyProfileUpdateListener);
  } else if (accountId && account) {
    removeWebSocketListener(account);
    delete account.socket.account;

    logger.log('(term)', `${accountId} cleaned up`);
  } else if (accountId && !account)
    logger.warn('(term)', `unable to get account object for`, accountId);
};

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
      const nextState = ((): 'off' | 'context' | 'track' => {
        if (event.detail.currentState === 'off') return 'context';
        else if (event.detail.currentState === 'context') return 'track';

        return 'off';
      })();

      if (typeof event.detail.currentState === 'string')
        spotifyAPI
          .setRepeatState(accessToken, nextState)
          .then(
            (res: Response): Promise<Response> => controlInteractionErrorHandler(res, nextState),
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

export const postConnectionListener = (): void => {
  init();
  common.fluxDispatcher.unsubscribe('POST_CONNECTION_OPEN', postConnectionListener);
};

export const start = (): void => {
  common.fluxDispatcher.subscribe('POST_CONNECTION_OPEN', postConnectionListener);
};

export const stop = (): void => {
  common.fluxDispatcher.unsubscribe('POST_CONNECTION_OPEN', postConnectionListener);
  term();
};

export * as util from '@?util';
export { config } from '@config';
export { Settings } from '@?components';
