/* eslint-disable no-use-before-define */
import { Injector, common } from 'replugged';
import { Root } from 'react-dom/client';
import {
  Modal,
  Settings,
  componentEventTarget,
  config,
  defaultConfig,
  logger,
} from './components/index';
import {
  SpotifyDevice,
  SpotifySocket,
  SpotifyStore,
  SpotifyWebSocket,
  SpotifyWebSocketRawParsedMessage,
  SpotifyWebSocketState,
} from './types';
import {
  addRootToPanel,
  getAllSpotifyAccounts,
  getStore,
  panelExists,
  removeRootFromPanelAndUnmount,
  spotifyAPI,
} from './utils';
import './style.css';

export * as utils from './utils';
export * as components from './components/index';

let accounts: Record<string, SpotifySocket>;
let currentAccountId: string;
let injectedAccounts = [] as string[];
let modalInjected = false;
let root: undefined | { element: HTMLDivElement; root: Root };
let status = { state: undefined, devices: undefined } as {
  state: undefined | SpotifyWebSocketState;
  devices: undefined | SpotifyDevice[];
};
let persist = { value: false };
let store: SpotifyStore;

const injector = new Injector();

const getAccessTokenFromAccountId = (accountId: string): string => {
  if (typeof accountId !== 'string') return '';
  for (const account of Object.values(accounts))
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

      const newAccessToken = await spotifyAPI.fetchToken(currentAccountId);

      if (!newAccessToken.ok) {
        common.toast.toast(
          'An error occurred whilst reauthenticating. Check console for details.',
          common.toast.Kind.FAILURE,
        );
        logger.error('An error occurred whilst reauthenticating. Response:', newAccessToken);
      } else {
        accounts[currentAccountId].accessToken = newAccessToken.body.access_token;
        common.fluxDispatcher.dispatch({
          type: 'SPOTIFY_ACCOUNT_ACCESS_TOKEN',
          accountId: currentAccountId,
          accessToken: newAccessToken.body.access_token,
        });

        logger.log('Reauthentication successful. Retrying action.');

        (
          spotifyAPI.getActionFromResponse(res)(
            getAccessTokenFromAccountId(currentAccountId),
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

  persist.value = false;
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
  if (!currentAccountId) {
    common.toast.toast('[SpotifyModal] Spotify is inactive', common.toast.Kind.FAILURE);
    return;
  }

  persist.value = true;

  switch (ev.detail.type) {
    case 'shuffle': {
      spotifyAPI
        .setShuffleState(getAccessTokenFromAccountId(currentAccountId), !ev.detail.currentState)
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
          .seekToPosition(getAccessTokenFromAccountId(currentAccountId), 0)
          .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res, 0));
      else
        spotifyAPI
          .skipNextOrPrevious(getAccessTokenFromAccountId(currentAccountId), false)
          .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res, false));
      break;
    }
    case 'playPause': {
      spotifyAPI
        .setPlaybackState(getAccessTokenFromAccountId(currentAccountId), !ev.detail.currentState)
        .then(
          (res: Response): Promise<Response> =>
            controlInteractionErrorHandler(res, !ev.detail.currentState),
        );
      break;
    }
    case 'skipNext': {
      spotifyAPI
        .skipNextOrPrevious(getAccessTokenFromAccountId(currentAccountId))
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
          .setRepeatState(getAccessTokenFromAccountId(currentAccountId), nextState)
          .then(
            (res: Response): Promise<Response> => controlInteractionErrorHandler(res, nextState),
          );

      break;
    }
    case 'seek': {
      spotifyAPI
        .seekToPosition(getAccessTokenFromAccountId(currentAccountId), ev.detail.newProgress)
        .then(
          (res: Response): Promise<Response> =>
            controlInteractionErrorHandler(res, ev.detail.newProgress),
        );

      break;
    }
    case 'favorite': {
      spotifyAPI
        .saveOrRemoveTracks(
          getAccessTokenFromAccountId(currentAccountId),
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
      persist.value = false;
      break;
    }
  }
};

const getPersistRefListener = (): void => {
  componentEventTarget.dispatchEvent(new CustomEvent('persistRef', { detail: persist }));
};

const handleMessageInjection = (res: MessageEvent[], self: SpotifyWebSocket): Promise<void> => {
  const parsed = JSON.parse(res[0].data) as SpotifyWebSocketRawParsedMessage;

  if (parsed.type === 'pong' || !parsed?.payloads?.[0]?.events?.[0]) return;

  if (!currentAccountId) {
    currentAccountId = self.account.accountId;
    if (config.get('debuggingLogActiveAccountId', false))
      logger.log('New active account ID:', currentAccountId);
  }

  if (currentAccountId !== self.account.accountId) return;

  if (parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED') {
    status.state = parsed.payloads[0].events[0].event.state;
    if (!modalInjected) injectModal(status.state);
    componentEventTarget.dispatchEvent(new CustomEvent('stateUpdate', { detail: status.state }));
    if (config.get('debuggingLogState', false))
      logger.log(`State update for ${currentAccountId}:`, status.state);
  } else if (parsed.payloads[0].events[0].type === 'DEVICE_STATE_CHANGED') {
    if (!persist.value) {
      status.devices = parsed.payloads[0].events[0].event.devices;
      if (!status.devices.length) {
        if (config.get('debuggingLogActiveAccountId', false))
          logger.log('Cleared active account ID. Was previously', currentAccountId);
        currentAccountId = '';
      }
      componentEventTarget.dispatchEvent(
        new CustomEvent('shouldShowUpdate', { detail: Boolean(status.devices.length) }),
      );
    } else persist.value = false;
  }
};

function injectIntoSocket(account: SpotifySocket): void {
  if (
    !injectedAccounts.includes(account.accountId) &&
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

const handleLoggerInjection = (args: unknown[]): void => {
  if (
    args[0] === 'WS Connected' ||
    (typeof args[0] === 'string' && args[0].match(/^Added account: .*/))
  )
    for (const account of Object.values(accounts)) injectIntoSocket(account);
};

const injectModal = (state?: SpotifyWebSocketState): void => {
  if (!panelExists() || modalInjected) return;

  root = addRootToPanel() as { element: HTMLDivElement; root: Root };
  if (!root) return;

  root.root.render(<Modal state={state} />);
  modalInjected = true;
  if (config.get('debuggingLogModalInjection', false)) logger.log('Modal mounted on modal root');
};

const uninjectModal = (): void => {
  if (!root || !modalInjected) return;
  removeRootFromPanelAndUnmount(root);
  root = undefined;
  modalInjected = false;
};

const functions = {
  controlInteractionErrorHandler,
  controlInteractionListener,
  getAccessTokenFromAccountId,
  getPersistRefListener,
  handleMessageInjection,
  injectIntoSocket,
  injectModal,
  uninjectModal,
};

async function start(): Promise<void> {
  store = await getStore();
  accounts = await getAllSpotifyAccounts();

  componentEventTarget.addEventListener(
    'controlInteraction',
    controlInteractionListener as EventListenerOrEventListenerObject,
  );
  componentEventTarget.addEventListener(
    'getPersistRef',
    getPersistRefListener as EventListenerOrEventListenerObject,
  );

  if (Object.entries(accounts).length) {
    for (const account of Object.values(accounts)) injectIntoSocket(account);
    injectModal();
  }

  injector.after(store.__getLocalVars().logger, 'info', handleLoggerInjection);
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

  uninjectModal();

  for (const account of Object.values(accounts)) {
    delete account.socket.account;
    if (config.get('debuggingLogAccountInjection', false))
      logger.log('Uninjected from account', account.accountId, account);
  }

  injector.uninjectAll();
}

export {
  Settings,
  accounts,
  config,
  currentAccountId,
  injectedAccounts,
  modalInjected,
  persist,
  root,
  status,
  store,
  functions,
  start,
  stop,
};
