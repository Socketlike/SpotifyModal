/* eslint-disable @typescript-eslint/no-floating-promises */
import { common } from 'replugged';
import { Settings, config, dispatchEvent, listenToEvent, logger } from './components/index';
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
  manageRoot,
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
  accounts: Record<string, Spotify.Account>;
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
      logger.log('access token deauthorized. attempting reauthentication');

      const newToken = await spotifyAPI.refreshSpotifyAccessToken(env.currentAccountId, true);

      if (!newToken.ok)
        common.toast.toast(
          'An error occurred whilst reauthenticating. Check console for details.',
          common.toast.Kind.FAILURE,
        );
      else {
        logger.log('retrying action');

        const actionRes = (await spotifyAPI.getActionFromResponse(res)(
          getAccessTokenFromAccountId(env.currentAccountId),
          ...data,
        )) as Response;

        if (!actionRes.ok) {
          logger.error('action failed, status', actionRes.status, actionRes);
          common.toast.toast(
            'Action failed. Check console for details.',
            common.toast.Kind.FAILURE,
          );
        }
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
    common.toast.toast('Spotify is inactive', common.toast.Kind.FAILURE);
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
    default: {
      env.persist = false;
      break;
    }
  }
});

const handleMessageInjection = (res: MessageEvent[], self: Spotify.PluginWS): Promise<void> => {
  const parsed = JSON.parse(res[0].data) as Spotify.WSRawParsed;

  if (parsed.type === 'pong' || !parsed?.payloads?.[0]?.events?.[0]) return;

  if (!env.currentAccountId) {
    env.currentAccountId = self.account.accountId;
    logIfConfigTrue(
      'debuggingLogActiveAccountId',
      'log',
      'new active account ID:',
      env.currentAccountId,
    );
  }

  if (env.currentAccountId !== self.account.accountId) return;

  if (parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED') {
    if (!isModalInjected()) manageRoot(manageRoot.mode.patch);
    dispatchEvent('stateUpdate', parsed.payloads[0].events[0].event.state);
    logIfConfigTrue(
      'debuggingLogState',
      'log',
      `state update for ${env.currentAccountId}:`,
      Object.assign({}, parsed.payloads[0].events[0].event.state),
    );
  } else if (parsed.payloads[0].events[0].type === 'DEVICE_STATE_CHANGED') {
    if (!env.persist) {
      if (!parsed.payloads[0].events[0].event.devices.length) {
        logIfConfigTrue(
          'debuggingLogActiveAccountId',
          'log',
          'cleared active account ID. was previously',
          env.currentAccountId,
        );
        env.currentAccountId = '';
      }
      dispatchEvent('shouldShowUpdate', Boolean(parsed.payloads[0].events[0].event.devices.length));
    } else env.persist = false;
  }
};

function injectIntoSocket(account: Spotify.Account): void {
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
      'injected into ws message listener',
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
    manageRoot(manageRoot.mode.patch);
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
        logIfConfigTrue('debuggingLogNoSpotifyPause', 'log', 'auto Spotify pause stopped');
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
  manageRoot(manageRoot.mode.remove);

  for (const account of Object.values(env.accounts)) {
    delete account.socket.account;
    logIfConfigTrue(
      'debuggingLogAccountInjection',
      'log',
      'uninjected from ws message listener',
      account.accountId,
      account,
    );
  }

  injector.uninjectAll();
}

export { Settings, config, root };
