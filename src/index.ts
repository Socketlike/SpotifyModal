/* eslint-disable no-use-before-define, no-floating-promises */
import { Injector, common } from 'replugged';
import { Settings, componentEventTarget, config, defaultConfig, logger } from './components/index';
import { SpotifySocket, SpotifyWebSocket, SpotifyWebSocketRawParsedMessage } from './types';
import {
  addRootInPanel,
  autoPauseModule,
  discordAnalytics,
  getAllSpotifyAccounts,
  getAutoPauseModule,
  getDiscordAnalytics,
  getStore,
  isModalInjected,
  removeRootFromPanel,
  root,
  spotifyAPI,
  store,
} from './utils';
import './style.css';

export * as utils from './utils';
export * as components from './components/index';

export const env = {
  injectedAccounts: [] as string[],
  persist: { value: false },
} as {
  accounts: Record<string, SpotifySocket>;
  currentAccountId: string;
  injectedAccounts: string[];
  persist: { value: boolean };
};

const injector = new Injector();

const getAccessTokenFromAccountId = (accountId: string): string => {
  if (typeof accountId !== 'string') return '';
  for (const account of Object.values(env.accounts))
    if (account.accountId === accountId) return account.accessToken;
  return '';
};

const controlInteractionErrorHandler = async (
  res: Response,
  ...data: unknown[]
): Promise<Response> => {
  if (config.get('automaticReauthentication', defaultConfig.automaticReauthentication)) {
    // Deauthorized
    if (res.status === 401) {
      logger.warn('Access token deauthorized. Attempting reauthentication');

      const newAccessToken = await spotifyAPI.fetchToken(env.currentAccountId);

      if (!newAccessToken.ok) {
        common.toast.toast(
          'An error occurred whilst reauthenticating. Check console for details.',
          common.toast.Kind.FAILURE,
        );
        logger.error('An error occurred whilst reauthenticating. Response:', newAccessToken);
      } else {
        common.fluxDispatcher.dispatch({
          type: 'SPOTIFY_ACCOUNT_ACCESS_TOKEN_REVOKE',
          accountId: env.currentAccountId,
        });
        env.accounts[env.currentAccountId].accessToken = newAccessToken.body.access_token;
        common.fluxDispatcher.dispatch({
          type: 'SPOTIFY_ACCOUNT_ACCESS_TOKEN',
          accountId: env.currentAccountId,
          accessToken: newAccessToken.body.access_token,
        });

        logger.log('Reauthentication successful. Retrying action.');

        (
          spotifyAPI.getActionFromResponse(res)(
            getAccessTokenFromAccountId(env.currentAccountId),
            ...data,
          ) as Promise<Response>
        ).then((res: Response): Promise<Response> => {
          if (!res.ok) {
            logger.error('Action retry failed.', res);
            common.toast.toast('Control action retry failed.', common.toast.Kind.FAILURE);
          }

          return Promise.resolve(res);
        });
      }
    }
  } else if (res.status === 401)
    common.toast.toast('Access token deauthenticated. Please manually update your state.');

  env.persist.value = false;
  return res;
};

const controlInteractionListener = (
  ev: CustomEvent<{
    event: React.MouseEvent;
    type: 'shuffle' | 'skipPrev' | 'playPause' | 'skipNext' | 'repeat' | 'seek' | 'favorite';
    favorite: {
      id: string;
      add: boolean;
    };
    currentState: boolean | 'off' | 'context' | 'track';
    currentProgress: number;
    currentDuration: number;
    newProgress: number;
  }>,
): void => {
  if (!env.currentAccountId) {
    common.toast.toast('[SpotifyModal] Spotify is inactive', common.toast.Kind.FAILURE);
    return;
  }

  env.persist.value = true;

  switch (ev.detail.type) {
    case 'shuffle': {
      spotifyAPI
        .setShuffleState(getAccessTokenFromAccountId(env.currentAccountId), !ev.detail.currentState)
        .then(
          (res: Response): Promise<Response> =>
            controlInteractionErrorHandler(res, !ev.detail.currentState),
        );
      break;
    }
    case 'skipPrev': {
      if (
        ev.detail.currentProgress >=
        ev.detail.currentDuration *
          config.get(
            'skipPreviousProgressResetThreshold',
            defaultConfig.skipPreviousProgressResetThreshold,
          )
      )
        spotifyAPI
          .seekToPosition(getAccessTokenFromAccountId(env.currentAccountId), 0)
          .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res, 0));
      else
        spotifyAPI
          .skipNextOrPrevious(getAccessTokenFromAccountId(env.currentAccountId), false)
          .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res, false));
      break;
    }
    case 'playPause': {
      spotifyAPI
        .setPlaybackState(
          getAccessTokenFromAccountId(env.currentAccountId),
          !ev.detail.currentState,
        )
        .then(
          (res: Response): Promise<Response> =>
            controlInteractionErrorHandler(res, !ev.detail.currentState),
        );
      break;
    }
    case 'skipNext': {
      spotifyAPI
        .skipNextOrPrevious(getAccessTokenFromAccountId(env.currentAccountId))
        .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res));
      break;
    }
    case 'repeat': {
      const nextState = ((): 'off' | 'context' | 'track' => {
        if (ev.detail.currentState === 'off') return 'context';
        else if (ev.detail.currentState === 'context') return 'track';

        return 'off';
      })();

      if (typeof ev.detail.currentState === 'string')
        spotifyAPI
          .setRepeatState(getAccessTokenFromAccountId(env.currentAccountId), nextState)
          .then(
            (res: Response): Promise<Response> => controlInteractionErrorHandler(res, nextState),
          );

      break;
    }
    case 'seek': {
      spotifyAPI
        .seekToPosition(getAccessTokenFromAccountId(env.currentAccountId), ev.detail.newProgress)
        .then(
          (res: Response): Promise<Response> =>
            controlInteractionErrorHandler(res, ev.detail.newProgress),
        );

      break;
    }
    case 'favorite': {
      spotifyAPI
        .saveOrRemoveTracks(
          getAccessTokenFromAccountId(env.currentAccountId),
          Boolean(ev.detail.favorite.add),
          ev.detail.favorite.id,
        )
        .then(
          (res: Response): Promise<Response> =>
            controlInteractionErrorHandler(
              res,
              Boolean(ev.detail.favorite.add),
              ev.detail.favorite.id,
            ),
        );

      break;
    }
    default: {
      env.persist.value = false;
      break;
    }
  }
};

const getPersistRefListener = (): void => {
  componentEventTarget.dispatchEvent(new CustomEvent('persistRef', { detail: env.persist }));
};

const handleMessageInjection = (res: MessageEvent[], self: SpotifyWebSocket): Promise<void> => {
  const parsed = JSON.parse(res[0].data) as SpotifyWebSocketRawParsedMessage;

  if (parsed.type === 'pong' || !parsed?.payloads?.[0]?.events?.[0]) return;

  if (!env.currentAccountId) {
    env.currentAccountId = self.account.accountId;
    if (config.get('debuggingLogActiveAccountId', false))
      logger.log('New active account ID:', env.currentAccountId);
  }

  if (env.currentAccountId !== self.account.accountId) return;

  if (parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED') {
    if (!isModalInjected()) addRootInPanel();
    componentEventTarget.dispatchEvent(
      new CustomEvent('stateUpdate', { detail: parsed.payloads[0].events[0].event.state }),
    );
    if (config.get('debuggingLogState', false))
      logger.log(
        `State update for ${env.currentAccountId}:`,
        parsed.payloads[0].events[0].event.state,
      );
  } else if (parsed.payloads[0].events[0].type === 'DEVICE_STATE_CHANGED') {
    if (!env.persist.value) {
      if (!parsed.payloads[0].events[0].event.devices.length) {
        if (config.get('debuggingLogActiveAccountId', false))
          logger.log('Cleared active account ID. Was previously', env.currentAccountId);
        env.currentAccountId = '';
      }
      componentEventTarget.dispatchEvent(
        new CustomEvent('shouldShowUpdate', {
          detail: Boolean(parsed.payloads[0].events[0].event.devices.length),
        }),
      );
    } else env.persist.value = false;
  }
};

function injectIntoSocket(account: SpotifySocket): void {
  if (
    !env.injectedAccounts.includes(account.accountId) &&
    typeof account?.socket?.onmessage === 'function'
  ) {
    Object.defineProperty(account.socket, 'account', {
      value: account,
      configurable: true,
    });

    // @ts-expect-error - Safe to ignore
    injector.before(account.socket, 'onmessage', handleMessageInjection);

    if (config.get('debuggingLogAccountInjection', false))
      logger.log('Injected into account', account.accountId, account);
  }
}

export const functions = {
  controlInteractionErrorHandler,
  controlInteractionListener,
  getAccessTokenFromAccountId,
  getPersistRefListener,
  injectIntoSocket,
};

async function start(): Promise<void> {
  await getStore();
  await getDiscordAnalytics();
  await getAutoPauseModule();
  env.accounts = await getAllSpotifyAccounts();

  componentEventTarget.addEventListener(
    'controlInteraction',
    controlInteractionListener as EventListenerOrEventListenerObject,
  );
  componentEventTarget.addEventListener(
    'getPersistRef',
    getPersistRefListener as EventListenerOrEventListenerObject,
  );

  if (Object.entries(env.accounts).length) {
    for (const account of Object.values(env.accounts)) injectIntoSocket(account);
    addRootInPanel();
  }

  injector.instead(
    store.__getLocalVars().logger,
    'info',
    (args: unknown[], orig: (...data: unknown[]) => void): void => {
      if (
        args[0] === 'WS Connected' ||
        (typeof args[0] === 'string' && args[0].match(/^Added account: .*/))
      )
        for (const account of Object.values(env.accounts)) injectIntoSocket(account);
      else if (
        typeof args[0] === 'string' &&
        args[0].match(/auto paused/i) &&
        config.get('noSpotifyPause', defaultConfig.noSpotifyPause)
      ) {
        if (config.get('debuggingLogNoSpotifyPause')) logger.log('Auto Spotify pause stopped');
        return;
      }

      return orig(...args);
    },
  );

  injector.instead(
    discordAnalytics.default,
    'track',
    (args: [string], orig: (name: string) => void): void => {
      if (
        typeof args[0] === 'string' &&
        args[0].match(/spotify_auto_paused/i) &&
        config.get('noSpotifyPause', defaultConfig.noSpotifyPause)
      )
        return;

      return orig(...args);
    },
  );

  injector.instead(autoPauseModule.raw, autoPauseModule.key, (_, orig) => {
    if (config.get('noSpotifyPause', defaultConfig.noSpotifyPause)) return Promise.resolve(null);

    return orig(..._);
  });

  injector.instead(store, 'wasAutoPaused', (_, orig) => {
    if (config.get('noSpotifyPause', defaultConfig.noSpotifyPause)) return false;

    return orig(..._);
  });
}

function stop(): void {
  componentEventTarget.removeEventListener(
    'controlInteraction',
    controlInteractionListener as EventListenerOrEventListenerObject,
  );
  componentEventTarget.removeEventListener(
    'getPersistRef',
    getPersistRefListener as EventListenerOrEventListenerObject,
  );

  removeRootFromPanel();

  for (const account of Object.values(env.accounts)) {
    delete account.socket.account;
    if (config.get('debuggingLogAccountInjection', false))
      logger.log('Uninjected from account', account.accountId, account);
  }

  injector.uninjectAll();
}

export { Settings, config, root, start, stop };
