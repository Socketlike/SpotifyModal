/* eslint-disable
  @typescript-eslint/no-floating-promises,
  @typescript-eslint/require-await
*/

import { Logger, common, webpack } from 'replugged';
import { EventEmitter, SpotifyAPI, SpotifySocketFunctions } from './common';
import {
  FluxDispatcher,
  SpotifyDevice,
  SpotifySocket,
  SpotifyWebSocketDevices,
  SpotifyWebSocketRawMessage,
  SpotifyWebSocketRawParsedMessage,
  SpotifyWebSocketState,
} from './types';
import { components } from './components';

declare const DiscordNative: {
  clipboard: {
    copy: (content: string) => void;
  };
};

export class SpotifyWatcher extends EventEmitter {
  public readonly name = this.constructor.name;
  public readonly handlers = {
    pong: (accountId: string): void => {
      this.handlers.spotifyUpdate({ accountId });
    },
    spotifyAccessTokenRevoked: (): void => {
      this.accountId = '';
    },
    spotifyUpdate: async (data: {
      accountId: string;
      devices?: SpotifyDevice[];
    }): Promise<void> => {
      if (data?.devices && !data.devices?.length) {
        this.accountId = '';
        return;
      }
      if (this._accountId !== data?.accountId || !this._websocket)
        await this._getAccountAndSocket(data?.accountId);
      if (this._accountId && this._shouldFallback) {
        this._shouldFallback = false;
        await this._tryGetStateAndDevices();
      }
    },
    websocketListener: async (message: SpotifyWebSocketRawMessage): Promise<void> => {
      if (!message?.data) return;
      const parsed = JSON.parse(message.data) as unknown as SpotifyWebSocketRawParsedMessage;

      if (parsed?.type && parsed.type !== 'pong') {
        if (!parsed?.payloads) return;

        if (parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED')
          this._state = parsed.payloads[0].events[0].event.state;
        else if (parsed.payloads[0].events[0].type === 'DEVICE_STATE_CHANGED')
          this._devices = parsed.payloads[0].events[0].event.devices;

        this.emit(
          parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED' ? 'player' : 'devices',
          { state: this._state, devices: this._devices },
        );
      }
    },
  };

  private _account: undefined | SpotifySocket = undefined;
  private _accountId = '';
  private _api: undefined | SpotifyAPI = undefined;
  private _devices: undefined | SpotifyDevice[] = undefined;
  private _dispatcher: undefined | FluxDispatcher = undefined;
  private _dispatcherStatus = false;
  private _loaded = false;
  private _state: undefined | SpotifyWebSocketState = undefined;
  private _socketFunctions = new SpotifySocketFunctions();
  private _shouldFallback = true;
  private _websocket: undefined | WebSocket = undefined;

  public constructor() {
    super();
    this.getFluxDispatcher();
  }

  public get account(): undefined | SpotifySocket {
    return this._account;
  }

  public get accountId(): string {
    return this._accountId;
  }

  public set accountId(accountId: string) {
    if (typeof accountId !== 'string') return;
    if (!accountId) {
      this._removeSocketListener();
      this._websocket = undefined;
      this._account = undefined;
      this._api = undefined;
      this._accountId = undefined;
      this._shouldFallback = true;
      this._logger.log('[(set) accountId]', 'Removed current account');
    } else if (!this._socketFunctions.accountList) {
      this._socketFunctions
        .getAccounts()
        .then(async (accounts: void | Record<string, SpotifySocket>): Promise<void> => {
          if (!accounts) return;
          if (accountId in accounts) {
            await this._getAccountAndSocket(accountId);
            this._logger.log('[(set) accountId]', 'Registered new account:', this._accountId);
          }
        });
    } else if (accountId in this._socketFunctions.accountList) {
      this._getAccountAndSocket(accountId).then((): void | Promise<void> => {
        this._logger.log('[(set) accountId]', 'Registered new account:', this._accountId);
      });
    }
  }

  public get api(): undefined | SpotifyAPI {
    return this._api;
  }

  public get dispatcher(): undefined | FluxDispatcher {
    return this._dispatcher;
  }

  public get loaded(): boolean {
    return this._loaded;
  }

  public get websocket(): undefined | WebSocket {
    return this._websocket;
  }

  public async getFluxDispatcher(): Promise<void> {
    if (common.fluxDispatcher)
      this._dispatcher = common.fluxDispatcher as unknown as FluxDispatcher;
    else {
      const dispatcher = await webpack.waitForModule(
        webpack.filters.byProps('_subscriptions', 'subscribe', 'unsubscribe'),
      );

      if (dispatcher) this._dispatcher = dispatcher as unknown as FluxDispatcher;
    }
  }

  private async _setupDispatcherHooks(): Promise<void> {
    if (!this._dispatcher) await this.getFluxDispatcher();
    if (this._dispatcherStatus) return;

    this._dispatcher.subscribe('SPOTIFY_PROFILE_UPDATE', this.handlers.spotifyUpdate);
    this._dispatcher.subscribe('SPOTIFY_SET_DEVICES', this.handlers.spotifyUpdate);
    this._dispatcher.subscribe(
      'SPOTIFY_ACCOUNT_ACCESS_TOKEN_REVOKE',
      this.handlers.spotifyAccessTokenRevoked,
    );
    this._dispatcher.subscribe('SPOTIFY_SET_ACTIVE_DEVICES', this.handlers.spotifyUpdate);
    this._dispatcher.subscribe('SPOTIFY_PLAYER_STATE', this.handlers.spotifyUpdate);

    this._dispatcherStatus = true;
    this._logger.log('Dispatcher hooks setup');
  }

  private _removeDispatcherHooks(): void {
    if (!this._dispatcher || !this._dispatcherStatus) return;

    this._dispatcher.unsubscribe('SPOTIFY_PROFILE_UPDATE', this.handlers.spotifyUpdate);
    this._dispatcher.unsubscribe('SPOTIFY_SET_DEVICES', this.handlers.spotifyUpdate);
    this._dispatcher.unsubscribe(
      'SPOTIFY_ACCOUNT_ACCESS_TOKEN_REVOKE',
      this.handlers.spotifyAccessTokenRevoked,
    );
    this._dispatcher.unsubscribe('SPOTIFY_SET_ACTIVE_DEVICES', this.handlers.spotifyUpdate);
    this._dispatcher.unsubscribe('SPOTIFY_PLAYER_STATE', this.handlers.spotifyUpdate);

    this._dispatcherStatus = false;
    this._logger.log('Dispatcher hooks removed');
  }

  private _removeSocketListener(): void {
    if (this._websocket) {
      this._websocket.removeEventListener('message', this.handlers.websocketListener);
      this._logger.log('Socket listener removed for account:', this._accountId);
    }
  }

  private async _getAccountAndSocket(accountId?: string): Promise<void> {
    if (this._accountId && this._accountId !== accountId) {
      this._logger.warn(
        '[_getAccountAndSocket]',
        'Attempted registration of new account',
        accountId,
        'but denied since current account is still in use',
      );
      return;
    }

    this._account = (await this._socketFunctions.getAccount(accountId)) as SpotifySocket;
    this._websocket = (await this._socketFunctions.getWebSocket(accountId)) as WebSocket;
    this._api = (await this._socketFunctions.getAPI(accountId)) as SpotifyAPI;

    if (typeof accountId === 'string' && this._account) this._accountId = accountId;
    else if (this._account) this._accountId = this._account.accountId;

    if (!this._accountId) {
      this._logger.warn(
        '[_getAccountAndSocket]',
        'Cannot get account (has SpotifyStore loaded yet?)',
      );
      return;
    }

    if (this._websocket instanceof WebSocket)
      this._websocket.addEventListener('message', this.handlers.websocketListener);

    this._logger.log('Got account:', this._accountId);
  }

  private async _tryGetStateAndDevices(): Promise<void> {
    if (!this._accountId) await this._getAccountAndSocket();
    if (!this._socketFunctions.userHasSpotifyAccounts) return;
    const req = [this._api.getPlayerState(), this._api.getDevices()];

    const res = await Promise.all(req);
    const state = res[0];
    const devices = res[1];
    if (state) {
      const data = await state.text();
      if (data) {
        const parsedData = JSON.parse(data);
        if (typeof parsedData?.error?.status === 'number' && parsedData.error.status > 400)
          this._logger.error(
            '[_tryGetStateAndDevices]',
            'An error occurred trying to get state:',
            parsedData?.error?.message,
          );
        else {
          this._state = parsedData as SpotifyWebSocketState;
          this.emit('player', { state: this._state, devices: this._devices });
        }
      }
    }

    if (devices) {
      const data = await devices.text();
      if (data) {
        const parsedDevices = JSON.parse(data) as {
          devices?: SpotifyWebSocketDevices;
          error?: { message: string };
        };
        if (Array.isArray(parsedDevices?.devices)) {
          this._devices = parsedDevices?.devices;
          this.emit('devices', { state: this._state, devices: this._devices });
        } else
          this._logger.error(
            '[_tryGetStateAndDevices]',
            'An error occurred trying to get devices:',
            parsedDevices?.error?.message,
          );
      }
    }
  }

  public async load(): Promise<void> {
    if (!this._loaded) {
      await this._setupDispatcherHooks();
      await this._tryGetStateAndDevices();
      this._logger.log('[@load]', 'Loaded');
      this._loaded = true;
    } else this._logger.warn('[@load]', 'Already loaded');
  }

  public unload(): void {
    if (this._loaded) {
      this._removeDispatcherHooks();
      this._removeSocketListener();
      this._logger.log('[@unload]', 'Unloaded');
      this._loaded = false;
    } else this._logger.warn('[@unload]', 'Already unloaded');
  }
}

export class SpotifyModalManager {
  public watcher = new SpotifyWatcher();
  public modal = new components.ModalContainer();
  public panels: HTMLElement | undefined = undefined;
  public readonly devicesListener = ({ devices }: { devices: SpotifyDevice[] }): void => {
    if (!devices?.length) {
      this.modal.fade.fadeout();
      this.modal.reset();
    } else this.modal.fade.fadein();
  };
  public playerListener = ({ state }: { state: SpotifyWebSocketState }): void => {
    if (!this._injected) this.injectModal();
    this.modal.dock.dockIcons.playPause.state = state.is_playing;

    this.modal.dock.dockIcons.shuffle.state = state.shuffle_state;
    this.modal.dock.dockIcons.shuffle.titleText = `Shuffle ${state.shuffle_state ? 'on' : 'off'}`;
    this.modal.dock.dockIcons.repeat.state = state.repeat_state !== 'off';
    this.modal.dock.dockIcons.repeat.mode = state.repeat_state;
    this.modal.dock.dockIcons.repeat.titleText = `Repeat ${
      state.repeat_state !== 'off' ? { context: 'all', track: 'track' }[state.repeat_state] : 'off'
    }`;

    this._trackTime.current = typeof state?.progress_ms === 'number' ? state.progress_ms : 0;
    this._trackTime.duration =
      typeof state?.item?.duration_ms === 'number' ? state.item.duration_ms : 0;
    this.modal.dock.progressBar.inner.update(this._trackTime.current, this._trackTime.duration);
    this.modal.dock.playbackTimeDisplay.update(this._trackTime.current, this._trackTime.duration);

    const track = state.item;
    if (track?.album?.images?.[0]?.url)
      this.modal.header.coverArt.update(
        track.album.images[0].url,
        track.album.name,
        track.album.id,
      );
    this.modal.header.metadata.title.setInnerText(track?.name, track?.id);
    this.modal.header.metadata.artists.setInnerText(
      track?.artists,
      `${this._classes.anchor} ${this._classes.anchorUnderlineOnHover} ${this._classes.bodyLink} ${this._classes.ellipsis}`,
      true,
      (mouseEvent: MouseEvent): void => {
        if ((mouseEvent.target as HTMLAnchorElement)?.href) {
          DiscordNative.clipboard.copy((mouseEvent.target as HTMLAnchorElement).href);
          common.toast.toast("Copied artist's Spotify URL", 1);
        }
      },
    );

    if (state.is_playing) {
      if (!this._intervalId)
        this._intervalId = setInterval(
          this.intervalCallback as unknown as () => void,
          this._updateInterval,
        ) as unknown as number;
      this.modal.fade.fadein();
    } else if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
  };
  public readonly intervalCallback = (): void => {
    this._trackTime.current += 500;
    this.modal.dock.progressBar.inner.update(this._trackTime.current, this._trackTime.duration);
    this.modal.dock.playbackTimeDisplay.update(this._trackTime.current, this._trackTime.duration);
  };
  public readonly progressBarListener = (percent: number): void => {
    if (this._trackTime.duration)
      this.watcher.api.seekToPos(Math.round(this._trackTime.duration * percent));
  };

  private _classes: {
    activityName: string;
    anchor: string;
    anchorUnderlineOnHover: string;
    bodyLink: string;
    container: string;
    defaultColor: string;
    ellipsis: string;
    nameNormal: string;
    panels: string;
    'text-sm/semibold': string;
  } = {
    activityName: '',
    anchor: '',
    anchorUnderlineOnHover: '',
    bodyLink: '',
    container: '',
    defaultColor: '',
    ellipsis: '',
    nameNormal: '',
    panels: '',
    'text-sm/semibold': '',
  };

  private _updateInterval = 500;
  private _intervalId: number | undefined;
  private _trackTime = {
    current: 0,
    duration: 0,
  };
  private _injected = false;

  // @ts-expect-error - Please let me have my own logger type name
  private _logger = new Logger('SpotifyModal', 'SpotifyModalManager');

  public constructor(progressBarUpdateInterval = 500) {
    this._updateInterval =
      typeof progressBarUpdateInterval === 'number'
        ? progressBarUpdateInterval
        : this._updateInterval;

    // @ts-expect-error - what more could you possibly want
    this.watcher.on('player', this.playerListener);
    // @ts-expect-error - what more could you possibly want
    this.watcher.on('devices', this.devicesListener);
    // @ts-expect-error - what more could you possibly want
    this.modal.dock.progressBar.events.on('scrub', this.progressBarListener);
    this.modal.dock.dockIcons.shuffle.on('click', (): void => {
      this.watcher.api.setShuffleState(!this.modal.dock.dockIcons.shuffle.state);
    });
    this.modal.dock.dockIcons.skipPrevious.on('click', (): void => {
      if (this._trackTime.current >= 6000) this.watcher.api.seekToPos(0);
      else this.watcher.api.skipPrevious();
    });
    this.modal.dock.dockIcons.playPause.on('click', (): void => {
      this.modal.dock.dockIcons.playPause.flipState();
      this.watcher.api.setPlaybackState(this.modal.dock.dockIcons.playPause.state);
    });
    this.modal.dock.dockIcons.skipNext.on('click', (): void => {
      this.watcher.api.skipNext();
    });
    this.modal.dock.dockIcons.repeat.on('click', (): void => {
      const nextMode = { off: 'context', context: 'track', track: 'off' };
      this.watcher.api.setRepeatState(nextMode[this.modal.dock.dockIcons.repeat.realMode]);
    });
  }

  public async getClasses(): Promise<void> {
    const activityClasses = await webpack.waitForModule<{
      activityName: string;
      bodyLink: string;
      ellipsis: string;
      nameNormal: string;
    }>(webpack.filters.byProps('activityName'));
    const anchorClasses = await webpack.waitForModule<{
      anchor: string;
      anchorUnderlineOnHover: string;
    }>(webpack.filters.byProps('anchorUnderlineOnHover'));
    const colorClasses = await webpack.waitForModule<{
      defaultColor: string;
      'text-sm/semibold': string;
    }>(webpack.filters.byProps('defaultColor'));
    const containerClasses = await webpack.waitForModule<{
      container: string;
    }>(webpack.filters.byProps('avatar', 'customStatus'));
    const panelClasses = await webpack.waitForModule<{
      panels: string;
    }>(webpack.filters.byProps('panels'));

    this._classes = {
      activityName: this._classes?.activityName || activityClasses.activityName,
      anchor: this._classes?.anchor || anchorClasses.anchor,
      anchorUnderlineOnHover:
        this._classes?.anchorUnderlineOnHover || anchorClasses.anchorUnderlineOnHover,
      bodyLink: this._classes?.bodyLink || activityClasses.bodyLink,
      container: this._classes?.container || containerClasses.container,
      defaultColor: this._classes?.defaultColor || colorClasses.defaultColor,
      ellipsis: this._classes?.ellipsis || activityClasses.ellipsis,
      nameNormal: this._classes?.nameNormal || activityClasses.nameNormal,
      panels: this._classes?.panels || panelClasses.panels,
      'text-sm/semibold': this._classes?.['text-sm/semibold'] || colorClasses['text-sm/semibold'],
    };

    this.modal.header.addClasses(this._classes.container);
    this.modal.header.metadata.title.addClasses(
      this._classes.anchor,
      this._classes.anchorUnderlineOnHover,
      this._classes.defaultColor,
      this._classes['text-sm/semibold'],
      ...this._classes.nameNormal
        .split(' ')
        .filter((className): boolean => !className.match(/^ellipsis/)),
    );
    this.modal.header.metadata.title.textOverflowClass = this._classes.ellipsis;
    this.modal.header.metadata.artists.textOverflowClass = this._classes.ellipsis;

    this._logger.log('[@getClasses] Succeeded');
  }

  public injectModal(): void {
    if (!this.panels)
      this.panels = document.body.querySelectorAll('[class^="panels-"]')?.[0] as HTMLElement;
    if (!this.panels) this._logger.error('[@injectModal]', 'Cannot get panel');
    else if (!this._injected) {
      this.modal.insertIntoParent('afterbegin', this.panels);
      this._injected = true;
      this._logger.log('[@injectModal]', 'Succeeded');
    }
  }

  public uninjectModal(): void {
    if (!this.panels)
      this.panels = document.body.querySelectorAll('[class^="panels-"]')?.[0] as HTMLElement;
    if (!this.panels) this._logger.error('[@uninjectModal]', 'Cannot get panel');
    else if (this._injected) {
      this.modal.removeParents(this.panels);
      this._injected = false;
      this._logger.log('[@uninjectModal]', 'Succeeded');
    }
  }

  public async load(): Promise<void> {
    await this.getClasses();
    await this.watcher.load();
  }

  public unload(): void {
    this.watcher.unload();
    this.watcher.removeAllListeners();
    this.uninjectModal();
  }
}
