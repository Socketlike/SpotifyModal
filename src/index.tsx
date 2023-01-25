import { Injector, common } from 'replugged';
import { Modal, componentEventTarget } from './components/index';
import { SpotifyDevice, SpotifySocket, SpotifyStore, SpotifyWebSocketState } from './types';
import { addRootToPanel, getAllSpotifyAccounts, getStore, panelExists } from './utils';
import './style.css';

export let accounts: Record<string, SpotifySocket>;
export let store: SpotifyStore;
export let status = { state: undefined, devices: undefined } as {
  state: undefined | SpotifyWebSocketState;
  devices: undefined | SpotifyDevice[];
};
export let injectedAccounts = [] as string[];
export let modalInjected = false;
export let currentAccountId: string;
export let root: undefined | { element: HTMLDivElement; root: ReactDOM.Root };

const injector = new Injector();

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

export function injectModal(): void {
  if (!panelExists() || modalInjected) return;

  root = addRootToPanel();
  if (!root) return;

  root.root.render(<Modal />);
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

export const handleMessageInjection = (res: MessageEvent[], self: WebSocket): void => {
  const parsed = JSON.parse(res[0].data) as SpotifyWebSocketRawParsedMessage;

  if (parsed.type === 'pong' || !parsed?.payloads?.[0]) return;

  if (!currentAccountId) currentAccountId = getAccountIdFromWebSocketURL(self.url);
  if (currentAccountId !== getAccountIdFromWebSocketURL(self.url)) return;

  if (!modalInjected) injectModal();

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
};

export async function start(): Promise<void> {
  store = await getStore();
  accounts = await getAllSpotifyAccounts();

  if (Object.entries(accounts).length) {
    for (const account of Object.values(accounts)) {
      injector.before(account.socket, 'onmessage', handleMessageInjection);
      injectedAccounts.push(account.accountId);
    }
  }
  injector.after(store.__getLocalVars().logger, 'info', handleLoggerInjection);
}

export function stop(): void {
  injector.uninjectAll();
}
