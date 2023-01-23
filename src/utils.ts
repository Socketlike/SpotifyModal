/* eslint-disable
  @typescript-eslint/naming-convention
*/
import { Logger, common, webpack } from 'replugged';
import {
  SpotifyDevice,
  SpotifyStore,
  SpotifySocket,
  SpotifyWebSocketRawParsedMessage,
  SpotifyWebSocketState,
} from './types';

const { React, ReactDOM } = common;
const baseURL = 'https://api.spotify.com/v1/me/player/';
let store = (await webpack.waitForModule(
  webpack.filters.byProps('getActiveSocketAndDevice'),
)) as unknown as SpotifyStore;
let accountList: Record<string, SpotifySocket>;

export const logger = Logger.plugin('SpotifyModal');

export const spotifyAPI = {
  sendGenericRequest(
    accessToken: string,
    endpoint: string,
    method?: string,
    query?: Record<string, string | number | boolean>,
    body?: BodyInit,
  ): void | Promise<Response> {
    if (
      typeof accessToken !== 'string' ||
      typeof endpoint !== 'string' ||
      (method && !['GET', 'POST', 'PUT'].includes(method))
    )
      return;
    const url = new URL(endpoint, baseURL);

    if (typeof query === 'object' && !Array.isArray(query))
      Object.entries(query).forEach(([key, val]): void => {
        if (typeof key !== 'string' || !['string', 'number', 'boolean'].includes(typeof val))
          return;
        url.searchParams.append(key, val);
      });

    return fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      ...(body ? { body } : {}),
      mode: 'cors',
    }) as Promise<Response>;
  },
  getPlayerState: (accessToken: string): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, '', 'GET'),
  getDevices: (accessToken: string): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'devices', 'GET'),
  setPlaybackState: (accessToken: string, state: boolean): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, `${state ? 'play' : 'pause'}`, 'PUT'),
  setRepeatState: (
    accessToken: string,
    state: 'off' | 'context' | 'track',
  ): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'repeat', 'PUT', { state }),
  setShuffleState: (accessToken: string, state: boolean): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'shuffle', 'PUT', { state }),
  seekToPosition: (accessToken: string, position: number): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'seek', 'PUT', { position_ms: position }),
  setPlaybackVolume: (accessToken: string, volume: number): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, 'volume', 'PUT', { volume_percent: volume }),
  skipNextOrPrevious: (accessToken: string, next = true): void | Promise<Response> =>
    spotifyAPI.sendGenericRequest(accessToken, `${next ? 'next' : 'previous'}`, 'POST'),
};

export const getSpotifyAccount = async (accountId?: string): Promise<void | SpotifySocket> => {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps('getActiveSocketAndDevice'),
    )) as unknown as SpotifyStore;
  if (!accountList) accountList = store.__getLocalVars().accounts;

  if (accountId && accountId in accountList) return accountList[accountId];
  else if (!accountId) return Object.values(accountList)[0];
};

export function addRootToPanel(): void | { element: HTMLDivElement; root: ReactDOM.Root } {
  const element = document.createElement('div') as HTMLDivElement;
  element.classList.add('spotify-modal');

  const panels = document.body.querySelectorAll('[class^="panels-"]');
  let panel: HTMLDivElement;
  if (panels.length) panel = panels[0] as HTMLDivElement;
  else return;

  panel.insertAdjacentElement('afterbegin', element);
  const root = ReactDOM.createRoot(element);

  return { element, root };
}

export function removeRootFromPanelAndUnmount(root: {
  element: HTMLDivElement;
  root: ReactDOM.Root;
}): void {
  if (!(root?.element instanceof HTMLDivElement) || (root?.root && !('_internalRoot' in root.root)))
    return;

  const panels = document.body.querySelectorAll('[class^="panels-"]');
  let panel: HTMLDivElement;
  if (panels.length) panel = panels[0] as HTMLDivElement;
  else return;

  panel.removeChild(root.element);
  root.root.unmount();
}

export class SpotifyWatcher extends EventTarget {
  public componentEventTarget: EventTarget;
  public spotifyUpdateSubscriptions = [
    'SPOTIFY_PROFILE_UPDATE',
    'SPOTIFY_SET_DEVICES',
    'SPOTIFY_PLAYER_STATE',
  ];

  public account: void | SpotifySocket;
  private _websocket = false;
  private _state = {} as SpotifyWebSocketState;
  private _devices = [] as SpotifyDevice[];

  public spotifyUpdateHandler = async (data: {
    accountId: string;
    devices?: SpotifyDevice[];
  }): Promise<void> => {
    if (Array.isArray(data.devices)) {
      this.devices = data.devices;
      return;
    }

    // Catching retry
    if (this.account && !this._websocket) {
      if (this.account.socket) {
        this.account.socket.addEventListener('message', this.websocketMessageHandler);
        this._websocket = true;
        await this.tryGetStateAndDevices();
      }
      return;
    }

    if (this.accountId && (this.accountId !== data.accountId || this.accountId === data.accountId))
      return;

    this.account = await getSpotifyAccount(data.accountId);
    // Retrying - socket is not initialized
    if (!this.account || !this.account.socket) {
      await this.spotifyUpdateHandler(data);
      return;
    }

    this._websocket = true;
    this.account.socket.addEventListener('message', this.websocketMessageHandler);
    await this.tryGetStateAndDevices();
  };

  public websocketMessageHandler = async (message: { data: string }): void => {
    if (!message?.data) return;

    const parsed = JSON.parse(message.data) as SpotifyWebSocketRawParsedMessage;

    if (parsed?.type !== 'pong' && Array.isArray(parsed?.payloads)) {
      let stopDispatch = false;
      if (parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED') {
        this.state = parsed.payloads[0].events[0].event.state;
        if (!this.devices.length) {
          await this.tryGetStateAndDevices();
          stopDispatch = true;
        }
      } else if (parsed.payloads[0].events[0].type === 'DEVICE_STATE_CHANGED')
        this.devices = parsed.payloads[0].events[0].event.devices;

      if (!stopDispatch)
        this.dispatchEvent(
          new CustomEvent('update', { detail: { state: this._state, devices: this._devices } }),
        );
    }
  };

  public constructor() {
    super();

    for (const eventName of this.spotifyUpdateSubscriptions)
      common.fluxDispatcher.subscribe(eventName, this.spotifyUpdateHandler);
  }

  public get accountId(): void | string {
    if (this.account) return this.account.accountId;
  }

  public get state(): SpotifyWebSocketState {
    return this._state;
  }

  public set state(state: SpotifyWebSocketState) {
    if (typeof state !== 'object' || Array.isArray(state)) return;
    this._state = state;
  }

  public get devices(): SpotifyDevice[] {
    return this._devices;
  }

  public set devices(devices: SpotifyDevice[]) {
    if (!Array.isArray(devices)) return;
    this._devices = devices;

    if (!devices.length) {
      if (this.account)
        this.account.socket.removeEventListener('message', this.websocketMessageHandler);
      this.account = undefined;
      this.dispatchEvent(new CustomEvent('update', { detail: { devices } }));
    }
  }

  public async tryGetStateAndDevices(): void {
    try {
      const requests = [
        spotifyAPI.getPlayerState(this.account?.accessToken),
        spotifyAPI.getDevices(this.account?.accessToken),
      ];

      const responses = await Promise.all(
        requests.filter((response: void | Promise<Response>) => response instanceof Promise),
      );

      const [state, devices] = responses;

      if (state) {
        const text = await state.text();
        if (text) {
          const parsed = JSON.parse(text) as
            | { error: { message: string; status: number } }
            | SpotifyWebSocketRawParsedMessage;
          if ('error' in parsed)
            logger.error(
              '[SpotifyWatcher @spotifyUpdateHandler]',
              'An error occurred fetching state',
              parsedJSON.error,
            );
          else this.state = parsed as SpotifyWebSocketState;
        }
      }

      if (devices) {
        const text = await devices.text();
        if (text) {
          const parsed = JSON.parse(text) as {
            devices: SpotifyDevice[];
            error: { message: string; status: number };
          };
          if ('error' in parsed)
            logger.error(
              '[SpotifyWatcher @spotifyUpdateHandler]',
              'An error occurred fetching devices',
              parsedJSON.error,
            );
          else if (Array.isArray(parsed?.devices)) this.devices = parsed.devices;
        }
      }
    } catch (e) {
      logger.error('[SpotifyWatcher @spotifyUpdateHandler]', 'An error occurred', e);
    }

    this.dispatchEvent(
      new CustomEvent('update', { detail: { state: this.state, devices: this.devices } }),
    );
  }

  public destroy(): void {
    if (this.account)
      this.account.socket.removeEventListener('message', this.websocketMessageHandler);
    for (const eventName of this.spotifyUpdateSubscriptions)
      common.fluxDispatcher.unsubscribe(eventName, this.spotifyUpdateHandler);
  }
}
