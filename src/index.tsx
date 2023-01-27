/* eslint-disable no-use-before-define */
import { Injector, common } from 'replugged';
import { Root } from 'react-dom/client';
import { Modal, componentEventTarget } from './components/index';
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

export let accounts: Record<string, SpotifySocket>;
export let currentAccountId: string;
export let injectedAccounts = [] as string[];
export let modalInjected = false;
export let root: undefined | { element: HTMLDivElement; root: Root };
export let status = { state: undefined, devices: undefined } as {
  state: undefined | SpotifyWebSocketState;
  devices: undefined | SpotifyDevice[];
};
export let store: SpotifyStore;
const injector = new Injector();

const getAccessTokenFromAccountId = (accountId: string): string => {
  if (typeof accountId !== 'string') return '';
  for (const account of Object.values(accounts))
    if (account.accountId === accountId) return account.accessToken;
  return '';
};

const componentListenerErrorHandler = (res: Response): Promise<Response> => {
  const opening = '[SpotifyModal] An error occurred whilst';
  let action = 'handling an unknown API action';
  if (res.url.match(/player\/(play|pause)/g)) action = 'toggling playback state';
  else if (res.url.match(/me\/tracks/g)) action = 'liking a track';
  else if (res.url.match(/player\/repeat/g)) action = 'setting repeat state';
  else if (res.url.match(/player\/shuffle/g)) action = 'setting shuffle state';
  else if (res.url.match(/player\/seek/g)) action = 'setting playback position';
  else if (res.url.match(/player\/volume/g)) action = 'setting volume';
  else if (res.url.match(/player\(next|previous/g))
    action = `skipping to ${res.url.match(/player\/next/g) ? 'next' : 'previous'} track`;
  if (!res.ok && res.status !== 404)
    common.toast.toast(`${opening} ${action}. Status: ${res.status.toString()}`, 2);
  else if (res.status === 404)
    common.toast.toast(`[SpotifyModal] Got a 404 whilst ${action}. This can be safely ignored.`, 1);
  return res as unknown as Promise<Response>;
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
  skipPrevClick: (ev: CustomEvent<{ event: React.MouseEvent; currentProgress: number }>): void => {
    if (currentAccountId) {
      if (ev.detail.currentProgress >= 6000)
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
    if (typeof ev.detail.id === 'string') {
      DiscordNative.clipboard.copy(`https://open.spotify.com/artist/${ev.detail.id}`);
      common.toast.toast(`Copied artist (${ev.detail.name})'s URL`);
    }
  },
  coverArtRightClick: (ev: CustomEvent<{ name: string; id?: string }>): void => {
    if (typeof ev.detail.id === 'string') {
      DiscordNative.clipboard.copy(`https://open.spotify.com/album/${ev.detail.id}`);
      common.toast.toast(`Copied album (${ev.detail.name})'s URL`);
    }
  },
  titleRightClick: (ev: CustomEvent<{ name: string; id?: string }>): void => {
    if (typeof ev.detail.id === 'string') {
      DiscordNative.clipboard.copy(`https://open.spotify.com/track/${ev.detail.id}`);
      common.toast.toast(`Copied track (${ev.detail.name})'s URL`);
    }
  },
  progressUpdate: (ev: CustomEvent<number>): void => {
    if (currentAccountId)
      (
        spotifyAPI.seekToPosition(
          getAccessTokenFromAccountId(currentAccountId),
          ev.detail,
        ) as Promise<Response>
      ).then(componentListenerErrorHandler);
    else common.toast.toast('[SpotifyModal] Current account ID is empty', 2);
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

  if (!currentAccountId) currentAccountId = self.accountId;
  if (currentAccountId !== self.accountId) return;

  if (parsed.type === 'pong' || !parsed?.payloads?.[0]) return;

  if (parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED') {
    status.state = parsed.payloads[0].events[0].event.state;
    componentEventTarget.dispatchEvent(new CustomEvent('stateUpdate', { detail: status.state }));
  } else if (parsed.payloads[0].events[0].type === 'DEVICE_STATE_CHANGED') {
    status.devices = parsed.payloads[0].events[0].event.devices;
    if (!status.devices.length) currentAccountId = '';
    componentEventTarget.dispatchEvent(
      new CustomEvent('shouldShowUpdate', { detail: Boolean(status.devices.length) }),
    );
  }

  if (!modalInjected) injectModal(status.state);
};

export const functions = {
  componentListenerErrorHandler,
  componentListeners,
  getAccessTokenFromAccountId,
  handleMessageInjection,
  injectIntoSocket,
  injectModal,
  uninjectModal,
};

export async function start(): Promise<void> {
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

export function stop(): void {
  for (const [name, callback] of Object.entries(componentListeners)) {
    // @ts-expect-error - Callback is a valid listener damn you
    componentEventTarget.removeEventListener(name, callback);
  }
  uninjectModal();
  for (const account of Object.values(accounts))
    delete (account.socket as SpotifyWebSocket).accountId;
  injector.uninjectAll();
}
