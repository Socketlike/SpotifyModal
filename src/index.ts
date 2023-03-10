/* eslint-disable @typescript-eslint/no-floating-promises */
import { common } from 'replugged';
import { Settings, config, dispatchEvent, listenToEvent, logger } from './components/index';
import { SpotifySocket, SpotifyWebSocket, SpotifyWebSocketRawParsedMessage } from './types';
import {
  autoPauseModule,
  discordAnalytics,
  getAllSpotifyAccounts,
  getAutoPauseModule,
  getDiscordAnalytics,
  getStore,
  injector,
  isModalInjected,
  logIfConfigTrue,
  patchPanel,
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
  persist: false,
} as {
  accounts: Record<string, SpotifySocket>;
  currentAccountId: string;
  injectedAccounts: string[];
  persist: boolean;
};

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
  if (config.get('automaticReauthentication')) {
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

  env.persist = false;
  return res;
};

const removeControlInteractionListener = listenToEvent<{
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
}>('controlInteraction', (ev): void => {
  if (!env.currentAccountId) {
    common.toast.toast('[SpotifyModal] Spotify is inactive', common.toast.Kind.FAILURE);
    return;
  }

  env.persist = true;

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
        ev.detail.currentDuration * config.get('skipPreviousProgressResetThreshold')
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
      env.persist = false;
      break;
    }
  }
});

const handleMessageInjection = (res: MessageEvent[], self: SpotifyWebSocket): Promise<void> => {
  const parsed = JSON.parse(res[0].data) as SpotifyWebSocketRawParsedMessage;

  if (parsed.type === 'pong' || !parsed?.payloads?.[0]?.events?.[0]) return;

  if (!env.currentAccountId) {
    env.currentAccountId = self.account.accountId;
    logIfConfigTrue(
      'debuggingLogActiveAccountId',
      'log',
      'New active account ID:',
      env.currentAccountId,
    );
  }

  if (env.currentAccountId !== self.account.accountId) return;

  if (parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED') {
    if (!isModalInjected()) patchPanel();
    dispatchEvent('stateUpdate', parsed.payloads[0].events[0].event.state);
    logIfConfigTrue(
      'debuggingLogState',
      'log',
      `State update for ${env.currentAccountId}:`,
      parsed.payloads[0].events[0].event.state,
    );
  } else if (parsed.payloads[0].events[0].type === 'DEVICE_STATE_CHANGED') {
    if (!env.persist) {
      if (!parsed.payloads[0].events[0].event.devices.length) {
        logIfConfigTrue(
          'debuggingLogActiveAccountId',
          'log',
          'Cleared active account ID. Was previously',
          env.currentAccountId,
        );
        env.currentAccountId = '';
      }
      dispatchEvent('shouldShowUpdate', Boolean(parsed.payloads[0].events[0].event.devices.length));
    } else env.persist = false;
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

    logIfConfigTrue(
      'debuggingLogAccountInjection',
      'log',
      'Injected into account',
      account.accountId,
      account,
    );
  }
}

export const functions = {
  controlInteractionErrorHandler,
  getAccessTokenFromAccountId,
  injectIntoSocket,
};

export async function start(): Promise<void> {
  await getStore();
  await getDiscordAnalytics();
  await getAutoPauseModule();
  env.accounts = await getAllSpotifyAccounts();

  if (Object.entries(env.accounts).length) {
    for (const account of Object.values(env.accounts)) injectIntoSocket(account);
    patchPanel();
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
        config.get('noSpotifyPause')
      ) {
        logIfConfigTrue('debuggingLogNoSpotifyPause', 'log', 'Auto Spotify pause stopped');
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
        config.get('noSpotifyPause')
      )
        return;

      return orig(...args);
    },
  );

  injector.instead(autoPauseModule.raw, autoPauseModule.key, (args, orig) => {
    if (config.get('noSpotifyPause')) return Promise.resolve(null);

    return orig(...args);
  });

  injector.instead(store, 'wasAutoPaused', (args, orig) => {
    if (config.get('noSpotifyPause')) return false;

    return orig(...args);
  });
}

export function stop(): void {
  removeControlInteractionListener();
  removeRootFromPanel();

  for (const account of Object.values(env.accounts)) {
    delete account.socket.account;
    logIfConfigTrue(
      'debuggingLogAccountInjection',
      'log',
      'Uninjected from account',
      account.accountId,
      account,
    );
  }

  injector.uninjectAll();
}

export { Settings, config, root };
