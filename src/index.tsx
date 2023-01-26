import { Injector, common } from 'replugged';
import { Modal, componentEventTarget } from './components/index';
import { SpotifyDevice, SpotifySocket, SpotifyStore, SpotifyWebSocketState } from './types';
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
export let componentListeners = {
  playPauseClick: (ev: CustomEvent<{ event: React.MouseEvent; currentState: boolean }>) => {
    if (currentAccountId)
      spotifyAPI
        .setPlaybackState(getAccessTokenFromAccountId(currentAccountId), !ev.detail.currentState)
        .then((res: Response): Promise<void> => {
          if (!res.ok)
            common.toast.toast(
              `[SpotifyModal] An error occurred whilst setting playback state. Status: ${res.status.toString()}`,
              2,
            );
        });
    else common.toast.toast('[SpotifyModal]: Current account ID is empty', 2);
  },
  repeatClick: (
    ev: CustomEvent<{ event: React.MouseEvent; currentState: 'off' | 'context' | 'track' }>,
  ): void => {
    const nextStates = { off: 'context', context: 'track', track: 'off' };
    if (currentAccountId)
      spotifyAPI
        .setRepeatState(
          getAccessTokenFromAccountId(currentAccountId),
          nextStates[ev.detail.currentState],
        )
        .then((res: Response): Promise<void> => {
          if (!res.ok)
            common.toast.toast(
              `[SpotifyModal] An error occurred whilst setting repeat state. Status: ${res.status.toString()}`,
              2,
            );
        });
    else common.toast.toast('[SpotifyModal] Current account ID is empty', 2);
  },
  shuffleClick: (ev: CustomEvent<{ event: React.MouseEvent; currentState: boolean }>): void => {
    if (currentAccountId)
      spotifyAPI
        .setShuffleState(getAccessTokenFromAccountId(currentAccountId), !ev.detail.currentState)
        .then((res: Response): Promise<void> => {
          if (!res.ok)
            common.toast.toast(
              `[SpotifyModal] An error occurred whilst setting shuffle state. Status: ${res.status.toString()}`,
              2,
            );
        });
    else common.toast.toast('[SpotifyModal] Current account ID is empty', 2);
  },
  skipNextClick: (): void => {
    if (currentAccountId)
      spotifyAPI
        .skipNextOrPrevious(getAccessTokenFromAccountId(currentAccountId), true)
        .then((res: Response): Promise<void> => {
          if (!res.ok)
            common.toast.toast(
              `[SpotifyModal] An error occurred whilst skipping to next track. Status: ${res.status.toString()}`,
              2,
            );
        });
    else common.toast.toast('[SpotifyModal] Current account ID is empty', 2);
  },
  skipPrevClick: (): void => {
    if (currentAccountId)
      spotifyAPI
        .skipNextOrPrevious(getAccessTokenFromAccountId(currentAccountId), false)
        .then((res: Response): Promise<void> => {
          if (!res.ok)
            common.toast.toast(
              `[SpotifyModal] An error has occurred whilst skipping to previous track. Status: ${res.status.toString()}`,
              2,
            );
        });
    else common.toast.toast('[SpotifyModal] Current account ID is empty', 2);
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
      spotifyAPI
        .seekToPosition(getAccessTokenFromAccountId(currentAccountId), ev.detail)
        .then((res: Response): Promise<void> => {
          if (!res.ok)
            common.toast.toast(
              `[SpotifyModal] An error has occurred whilst seeking to new playback position. Status: ${res.status.toString()}`,
              2,
            );
        });
    else common.toast.toast('[SpotifyModal] Current account ID is empty', 2);
  },
};
export let currentAccountId: string;
export let currentDeviceId: undefined | string;
const injector = new Injector();
export let injectedAccounts = [] as string[];
export let modalInjected = false;
export let root: undefined | { element: HTMLDivElement; root: ReactDOM.Root };
export let status = { state: undefined, devices: undefined } as {
  state: undefined | SpotifyWebSocketState;
  devices: undefined | SpotifyDevice[];
};
export let store: SpotifyStore;

export const handleLoggerInjection = (
  _args: unknown[],
  _res: unknown,
  self: SpotifyStore,
): void => {
  if (
    _args[0] === 'WS Connected' ||
    (typeof _args[0] === 'string' && _args[0].match(/^Added account: .*/))
  )
    for (const account of Object.values(accounts))
      if (
        !injectedAccounts.includes(account.accountId) &&
        typeof account?.socket?.onmessage === 'function'
      ) {
        injector.before(account.socket, 'onmessage', handleMessageInjection);
        injectedAccounts.push(account.accountId);
      }
};

export function injectModal(state?: SpotifyWebSocketState): void {
  if (!panelExists() || modalInjected) return;

  root = addRootToPanel();
  if (!root) return;

  root.root.render(<Modal state={state} />);
  modalInjected = true;
}

export function uninjectModal(): void {
  if (!root || !modalInjected) return;
  removeRootFromPanelAndUnmount(root);
  root = undefined;
  modalInjected = false;
}

export const getAccountIdFromWebSocketURL = (url: string): string => {
  if (typeof url !== 'string') return '';
  for (const account of Object.values(accounts))
    if (url.match(account.accessToken)) return account.accountId;
  return '';
};

export const getAccessTokenFromAccountId = (accountId: string): string => {
  if (typeof accountId !== 'string') return '';
  for (const account of Object.values(accounts))
    if (account.accountId === accountId) return account.accessToken;
  return '';
};

export const handleMessageInjection = (res: MessageEvent[], self: WebSocket): void => {
  const parsed = JSON.parse(res[0].data) as SpotifyWebSocketRawParsedMessage;

  if (parsed.type === 'pong' || !parsed?.payloads?.[0]) return;

  if (!currentAccountId) currentAccountId = getAccountIdFromWebSocketURL(self.url);
  if (currentAccountId !== getAccountIdFromWebSocketURL(self.url)) return;

  if (parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED') {
    status.state = parsed.payloads[0].events[0].event.state;
    componentEventTarget.dispatchEvent(new CustomEvent('stateUpdate', { detail: status.state }));
    currentDeviceId =
      typeof status.state?.device?.id === 'string' ? status.state.device.id : undefined;
  } else if (parsed.payloads[0].events[0].type === 'DEVICE_STATE_CHANGED') {
    status.devices = parsed.payloads[0].events[0].event.devices;
    if (!status.devices.length) {
      currentAccountId = '';
      currentDeviceId = undefined;
    }
    componentEventTarget.dispatchEvent(
      new CustomEvent('shouldShowUpdate', { detail: Boolean(status.devices.length) }),
    );
  }

  if (!modalInjected) injectModal(status.state);
};

export async function start(): Promise<void> {
  store = await getStore();
  accounts = await getAllSpotifyAccounts();

  for (const [name, callback] of Object.entries(componentListeners))
    componentEventTarget.addEventListener(name, callback);

  if (Object.entries(accounts).length) {
    for (const account of Object.values(accounts)) {
      injector.before(account.socket, 'onmessage', handleMessageInjection);
      injectedAccounts.push(account.accountId);
    }
    injectModal();
  }
  injector.after(store.__getLocalVars().logger, 'info', handleLoggerInjection);
}

export function stop(): void {
  for (const [name, callback] of Object.entries(componentListeners))
    componentEventTarget.removeEventListener(name, callback);
  uninjectModal();
  injector.uninjectAll();
}
