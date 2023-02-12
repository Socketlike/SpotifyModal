/* eslint-disable no-use-before-define, @typescript-eslint/naming-convention */
import { Injector, common } from 'replugged';
import { Root } from 'react-dom/client';
import { Modal, Settings, config, componentEventTarget } from './components/index';
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

declare const DiscordNative: {
  clipboard: {
    copy: (content: string) => void;
  };
};

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
let persist = false;
let store: SpotifyStore;
const injector = new Injector();

const getAccessTokenFromAccountId = (accountId: string): string => {
  if (typeof accountId !== 'string') return '';
  for (const account of Object.values(accounts))
    if (account.accountId === accountId) return account.accessToken;
  return '';
};

const componentListenerErrorHandler = async (res: Response, track?: string): Promise<Response> => {
  persist = !res.ok;

  if (config.get('automaticReauthentication', false)) {
    let action = '';
    let data: unknown;

    if (res.url.match(/player\/play/g)) {
      action = 'setPlaybackState';
      data = true;
    } else if (res.url.match(/player\/pause/g)) {
      action = 'setPlaybackState';
      data = false;
    } else if (res.url.match(/me\/tracks/g)) {
      action = 'saveTracks';
      data = track;
    } else if (res.url.match(/player\/repeat/g)) {
      action = 'setRepeatState';
      data = res.url.split('state=')[1] || 'off';
    } else if (res.url.match(/player\/shuffle/g)) {
      action = 'setShuffleState';
      data = res.url.split('state=')[1] === 'true';
    } else if (res.url.match(/player\/seek/g)) {
      action = 'seekToPosition';
      data = Number(res.url.split('position_ms=')[1]) || 0;
    } else if (res.url.match(/player\/volume/g)) {
      action = 'setPlaybackVolume';
      data = Number(res.url.split('volume_percent=')[1]) || 100;
    } else if (res.url.match(/player\/next/g)) {
      action = 'skipNextOrPrevious';
      data = true;
    } else if (res.url.match(/player\/previous/g)) {
      action = 'skipNextOrPrevious';
      data = false;
    }

    if (action && res.status === 401) {
      const fetched = await spotifyAPI.fetchToken(currentAccountId);
      if (fetched.ok) {
        accounts[currentAccountId].accessToken = fetched.body.access_token;
        spotifyAPI[action](fetched.body.access_token, data);
      }
    }
  } else if (res.status === 401) {
    common.toast.toast(
      '[SpotifyModal]: To continue using controls, please update your state manually in the Spotify app',
      2,
    );
  }

  return res;
};

const componentListeners = {
  playPauseClick: (ev: CustomEvent<{ event: React.MouseEvent; currentState: boolean }>) => {
    if (currentAccountId)
      (
        spotifyAPI.setPlaybackState(
          getAccessTokenFromAccountId(currentAccountId),
          !ev.detail.currentState,
        ) as Promise<Response>
      ).then(componentListenerErrorHandler);
    else common.toast.toast('[SpotifyModal]: Current account ID is empty', 2);
  },
  repeatClick: (
    ev: CustomEvent<{ event: React.MouseEvent; currentState: 'off' | 'context' | 'track' }>,
  ): void => {
    const nextStates = { off: 'context', context: 'track', track: 'off' };
    if (currentAccountId)
      (
        spotifyAPI.setRepeatState(
          getAccessTokenFromAccountId(currentAccountId),
          nextStates[ev.detail.currentState] as 'off' | 'context' | 'track',
        ) as Promise<Response>
      ).then(componentListenerErrorHandler);
    else common.toast.toast('[SpotifyModal] Current account ID is empty', 2);
  },
  shuffleClick: (ev: CustomEvent<{ event: React.MouseEvent; currentState: boolean }>): void => {
    if (currentAccountId)
      (
        spotifyAPI.setShuffleState(
          getAccessTokenFromAccountId(currentAccountId),
          !ev.detail.currentState,
        ) as Promise<Response>
      ).then(componentListenerErrorHandler);
    else common.toast.toast('[SpotifyModal] Current account ID is empty', 2);
  },
  skipNextClick: (): void => {
    if (currentAccountId)
      (
        spotifyAPI.skipNextOrPrevious(
          getAccessTokenFromAccountId(currentAccountId),
          true,
        ) as Promise<Response>
      ).then(componentListenerErrorHandler);
    else common.toast.toast('[SpotifyModal] Current account ID is empty', 2);
  },
  skipPrevClick: (
    ev: CustomEvent<{ event: React.MouseEvent; currentProgress: number; duration: number }>,
  ): void => {
    if (currentAccountId) {
      if (
        config.get('skipPreviousShouldResetProgress', true) &&
        ev.detail.currentProgress >=
          Math.round(ev.detail.duration * config.get('skipPreviousProgressResetThreshold', 0.15))
      )
        (
          spotifyAPI.seekToPosition(
            getAccessTokenFromAccountId(currentAccountId),
            0,
          ) as Promise<Response>
        ).then(componentListenerErrorHandler);
      else
        (
          spotifyAPI.skipNextOrPrevious(
            getAccessTokenFromAccountId(currentAccountId),
            false,
          ) as Promise<Response>
        ).then(componentListenerErrorHandler);
    } else common.toast.toast('[SpotifyModal] Current account ID is empty', 2);
  },
  artistRightClick: (ev: CustomEvent<{ name: string; id?: string }>): void => {
    if (typeof ev.detail.id === 'string' && config.get('copyingArtistURLEnabled', true)) {
      DiscordNative.clipboard.copy(`https://open.spotify.com/artist/${ev.detail.id}`);
      common.toast.toast(`Copied artist (${ev.detail.name})'s URL`);
    }
  },
  coverArtRightClick: (ev: CustomEvent<{ name: string; id?: string }>): void => {
    if (typeof ev.detail.id === 'string' && config.get('copyingAlbumURLEnabled', true)) {
      DiscordNative.clipboard.copy(`https://open.spotify.com/album/${ev.detail.id}`);
      common.toast.toast(`Copied album (${ev.detail.name})'s URL`);
    }
  },
  titleRightClick: (ev: CustomEvent<{ name: string; id?: string }>): void => {
    if (typeof ev.detail.id === 'string' && config.get('copyingTrackURLEnabled', true)) {
      DiscordNative.clipboard.copy(`https://open.spotify.com/track/${ev.detail.id}`);
      common.toast.toast(`Copied track (${ev.detail.name})'s URL`);
    }
  },
  seeked: (ev: CustomEvent<number>): void => {
    if (currentAccountId && config.get('seekbarEnabled', true)) {
      (
        spotifyAPI.seekToPosition(
          getAccessTokenFromAccountId(currentAccountId),
          ev.detail,
        ) as Promise<Response>
      ).then(componentListenerErrorHandler);
    } else if (!currentAccountId)
      common.toast.toast('[SpotifyModal] Current account ID is empty', 2);
  },
};

const injectIntoSocket = (account: SpotifySocket): void => {
  // @ts-expect-error - self is WebSocket
  injector.before(account.socket, 'onmessage', handleMessageInjection);
  Object.defineProperty(account.socket, 'accountId', {
    value: account.accountId,
    configurable: true,
  });
  injectedAccounts.push(account.accountId);
};

const handleLoggerInjection = (_args: unknown[]): void => {
  if (
    _args[0] === 'WS Connected' ||
    (typeof _args[0] === 'string' && _args[0].match(/^Added account: .*/))
  )
    for (const account of Object.values(accounts))
      if (
        !injectedAccounts.includes(account.accountId) &&
        typeof account?.socket?.onmessage === 'function'
      )
        injectIntoSocket(account);
};

const injectModal = (state?: SpotifyWebSocketState): void => {
  if (!panelExists() || modalInjected) return;

  root = addRootToPanel() as { element: HTMLDivElement; root: Root };
  if (!root) return;

  root.root.render(<Modal state={state} />);
  modalInjected = true;
};

const uninjectModal = (): void => {
  if (!root || !modalInjected) return;
  removeRootFromPanelAndUnmount(root);
  root = undefined;
  modalInjected = false;
};

const handleMessageInjection = (res: MessageEvent[], self: SpotifyWebSocket): Promise<void> => {
  const parsed = JSON.parse(res[0].data) as SpotifyWebSocketRawParsedMessage;

  if (parsed.type === 'pong' || !parsed?.payloads?.[0]?.events?.[0]) return;

  if (!currentAccountId) currentAccountId = self.accountId;
  if (currentAccountId !== self.accountId) return;

  if (parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED') {
    status.state = parsed.payloads[0].events[0].event.state;
    if (!modalInjected) injectModal(status.state);
    componentEventTarget.dispatchEvent(new CustomEvent('stateUpdate', { detail: status.state }));
  } else if (parsed.payloads[0].events[0].type === 'DEVICE_STATE_CHANGED') {
    status.devices = parsed.payloads[0].events[0].event.devices;
    if (!persist) {
      if (!status.devices.length) currentAccountId = '';
      componentEventTarget.dispatchEvent(
        new CustomEvent('shouldShowUpdate', { detail: Boolean(status.devices.length) }),
      );
    } else persist = false;
  }
};

const functions = {
  componentListenerErrorHandler,
  componentListeners,
  getAccessTokenFromAccountId,
  handleMessageInjection,
  injectIntoSocket,
  injectModal,
  uninjectModal,
};

async function start(): Promise<void> {
  store = await getStore();
  accounts = await getAllSpotifyAccounts();

  for (const [name, callback] of Object.entries(componentListeners)) {
    // @ts-expect-error - Callback is a valid listener damn you
    componentEventTarget.addEventListener(name, callback);
  }

  if (Object.entries(accounts).length) {
    for (const account of Object.values(accounts)) injectIntoSocket(account);
    injectModal();
  }
  injector.after(store.__getLocalVars().logger, 'info', handleLoggerInjection);
}

function stop(): void {
  for (const [name, callback] of Object.entries(componentListeners)) {
    // @ts-expect-error - Callback is a valid listener damn you
    componentEventTarget.removeEventListener(name, callback);
  }
  uninjectModal();
  for (const account of Object.values(accounts))
    delete (account.socket as SpotifyWebSocket).accountId;
  injector.uninjectAll();
}

export {
  Settings,
  accounts,
  config,
  currentAccountId,
  injectedAccounts,
  modalInjected,
  root,
  status,
  store,
  functions,
  start,
  stop,
};
