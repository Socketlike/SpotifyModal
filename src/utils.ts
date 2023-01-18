/* eslint-disable
  @typescript-eslint/naming-convention,
  @typescript-eslint/no-inferrable-types,
  @typescript-eslint/no-floating-promises,
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/require-await,
  new-cap
*/
import { Logger, common, webpack } from 'replugged';
import { EventEmitter, SpotifyAPI, SpotifySocketFunctions, elementUtilities } from './common';
import {
  FadeAnimations,
  FluxDispatcher,
  SpotifyDevice,
  SpotifySocket,
  SpotifySocketModule,
  SpotifyTrack,
  SpotifyWebSocketDevices,
  SpotifyWebSocketRawMessage,
  SpotifyWebSocketRawParsedMessage,
  SpotifyWebSocketState,
} from './types';
import { animations, components, icons } from '../unstaged/components';

export class SpotifyWatcher extends EventEmitter {
  public readonly name = this.constructor.name;
  public readonly handlers = {
    pong: (accountId: string): void => {
      this.handlers.spotifyUpdate({ accountId });
    },
    spotifyAccessTokenRevoked: (accountId: string): void => {
      this.accountId = '';
    },
    spotifyUpdate: async (data: { accountId: string }): Promise<void> => {
      if (this.#accountId === data?.accountId) return;

      await this.#getAccountAndSocket(data?.accountId);
    },
    websocketListener: async (message: SpotifyWebSocketRawMessage): Promise<void> => {
      if (!message?.data) return;
      const parsed = JSON.parse(message.data) as unknown as SpotifyWebSocketRawParsedMessage;

      if (parsed?.type && parsed.type !== 'pong') {
        if (!parsed?.payloads) return;

        if (parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED')
          this.#state = parsed.payloads[0].events[0].event.state;
        else if (parsed.payloads[0].events[0].type === 'DEVICE_STATE_CHANGED')
          this.#devices = parsed.payloads[0].events[0].event.devices;

        this.emit(
          parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED' ? 'player' : 'devices',
          { state: this.#state, devices: this.#devices },
        );
      }
    },
  };

  #account: undefined | SpotifySocket = undefined;
  #accountId = '';
  #api: undefined | SpotifyAPI = undefined;
  #devices: undefined | SpotifyDevices[] = undefined;
  #dispatcher: undefined | FluxDispatcher = undefined;
  #dispatcherStatus = false;
  #logger = new Logger('SpotifyModal', this.name);
  #state: undefined | SpotifyWebSocketState = undefined;
  #socketFunctions = new SpotifySocketFunctions();
  #websocket: undefined | WebSocket = undefined;

  public constructor(): void {
    super();
    this.getFluxDispatcher();
  }

  public get account(): undefined | SpotifySocket {
    return this.#account;
  }

  public get accountId(): string {
    return this.#accountId;
  }

  public set accountId(accountId: string) {
    if (typeof accountId !== 'string') return;
    if (!accountId) {
      this.#removeSocketListener();
      this.#websocket = undefined;
      this.#account = undefined;
      this.#api = undefined;
      this.#accountId = undefined;
      this.#logger.log('Removed current account');
    } else if (!this.#socketFunctions.accountList) {
      this.#socketFunctions.getAccounts().then((accounts: Record<string, SpotifySocket>): void => {
        if (accountId in accounts) {
          this.#accountId = accountId;
          this.#getAccountAndSocket(this.#accountId);
          this.#logger.log('Registered new account:', this.#accountId);
        }
      });
    } else if (accountId in this.#socketFunctions.accountList) {
      this.#accountId = accountId;
      this.#getAccountAndSocket(this.#accountId);
      this.#logger.log('Registered new account:', this.#accountId);
    }
  }

  public get api(): undefined | SpotifyAPI {
    return this.#api;
  }

  public get dispatcher(): undefined | FluxDispatcher {
    return this.#dispatcher;
  }

  public get websocket(): undefined | WebSocket {
    return this.#websocket;
  }

  public async getFluxDispatcher(): Promise<void> {
    if (common.fluxDispatcher)
      this.#dispatcher = common.fluxDispatcher as unknown as FluxDispatcher;
    else {
      const dispatcher = await webpack.waitForModule(
        webpack.filters.byProps('_subscriptions', 'subscribe', 'unsubscribe'),
      );

      if (dispatcher) this.#dispatcher = dispatcher as unknown as FluxDispatcher;
    }
  }

  async #setupDispatcherHooks(): Promise<void> {
    if (!this.#dispatcher) await this.getFluxDispatcher();
    if (this.#dispatcherStatus) return;

    this.#dispatcher.subscribe('SPOTIFY_PROFILE_UPDATE', this.handlers.spotifyUpdate);
    this.#dispatcher.subscribe('SPOTIFY_SET_DEVICES', this.handlers.spotifyUpdate);
    this.#dispatcher.subscribe(
      'SPOTIFY_ACCOUNT_ACCESS_TOKEN_REVOKE',
      this.handlers.spotifyAccessTokenRevoked,
    );
    this.#dispatcher.subscribe('SPOTIFY_SET_ACTIVE_DEVICES', this.handlers.spotifyUpdate);
    this.#dispatcher.subscribe('SPOTIFY_PLAYER_STATE', this.handlers.spotifyUpdate);

    this.#dispatcherStatus = true;
    this.#logger.log('Dispatcher hooks setup');
  }

  #removeDispatcherHooks(): void {
    if (!this.#dispatcher || !this.#dispatcherStatus) return;

    this.#dispatcher.unsubscribe('SPOTIFY_PROFILE_UPDATE', this.handlers.spotifyUpdate);
    this.#dispatcher.unsubscribe('SPOTIFY_SET_DEVICES', this.handlers.spotifyUpdate);
    this.#dispatcher.unsubscribe(
      'SPOTIFY_ACCOUNT_ACCESS_TOKEN_REVOKE',
      this.handlers.spotifyAccessTokenRevoked,
    );
    this.#dispatcher.unsubscribe('SPOTIFY_SET_ACTIVE_DEVICES', this.handlers.spotifyUpdate);
    this.#dispatcher.unsubscribe('SPOTIFY_PLAYER_STATE', this.handlers.spotifyUpdate);

    this.#dispatcherStatus = false;
    this.#logger.log('Dispatcher hooks removed');
  }

  #removeSocketListener(): void {
    if (this.#websocket) {
      this.#websocket.removeEventListener('message', this.handlers.websocketListener);
      this.#logger.log('Socket listener removed for account:', this.#accountId);
    }
  }

  async #getAccountAndSocket(accountId?: string): Promise<void> {
    if (this.#accountId && this.#accountId !== accountId) this.#removeSocketListener();

    this.#account = await this.#socketFunctions.getAccount(accountId);
    this.#websocket = await this.#socketFunctions.getWebSocket(accountId);
    this.#api = await this.#socketFunctions.getAPI(accountId);

    if (typeof accountId === 'string' && this.#account) this.#accountId = accountId;
    else if (this.#account) this.#accountId = this.#account.accountId;

    if (this.#websocket instanceof WebSocket)
      this.#websocket.addEventListener('message', this.handlers.websocketListener);

    this.#logger.log('Got account:', this.#accountId);
  }

  async #tryGetStateAndDevices(): Promise<void> {
    if (!this.#accountId) await this.#getAccountAndSocket();
    if (!this.#socketFunctions.userHasSpotifyAccounts) return;
    const req = [this.#api.getPlayerState(), this.#api.getDevices()];

    const res = await Promise.all(req);
    const state = res[0];
    const devices = res[1];
    if (state) {
      const data = await state.text();
      if (data) {
        this.#state = JSON.parse(data) as SpotifyWebSocketState;
        this.emit('player', { state: this.#state, devices: this.#devices });
      }
    }

    if (devices) {
      const data = await devices.text();
      if (data) {
        const parsedDevices = JSON.parse(data) as SpotifyWebSocketDevices;
        if (Array.isArray(parsedDevices?.devices)) {
          this.#devices = parsedDevices?.devices;
          this.emit('devices', { state: this.#state, devices: this.#devices });
        }
      }
    }
  }

  public async load(): Promise<void> {
    await this.#setupDispatcherHooks();
    await this.#tryGetStateAndDevices();
    this.#logger.log('Loaded');
  }

  public unload(): void {
    this.#removeDispatcherHooks();
    this.#removeSocketListener();
    this.#logger.log('Unloaded');
  }
}

/*
export class SpotifyWatcher extends EventEmitter {
  #accountId: string;
  #data: {
    devices: undefined | SpotifyDevice[];
    state: undefined | SpotifyWebSocketState;
  };
  public dispatcher: FluxDispatcher | undefined;
  #silent: boolean;
  #sockets: Map<string, Array<WebSocket, (message: SpotifyWebSocketRawMessage) => void>>;
  #socket: {
    accountId: string;
    ws: undefined | WebSocket;
  };
  public handlers: {
    REGISTER_PONG_EVENT: () => void;
    PONG_UPDATE: (accountId: string) => void;
    SPOTIFY_UPDATE: (data: { accountId: string }) => void;
    SPOTIFY_WEBSOCKET_MESSAGE: (message: SpotifyWebSocketRawMessage) => void;
  };
  #statuses: {
    registered: boolean;
    pongFluxListener: boolean;
    loaded: boolean;
  };

  #logger(level: "log" | "warn" | "error", ...data: unknown): void {
    if (typeof level !== "string" || this.#silent)
      return;

    logger[level](...data);
  }

  public constructor(silent?: boolean) {
    super(Boolean(silent));
    this.#accountId = "";
    this.#data = {
      devices: undefined,
      state: undefined,
    };
    this.dispatcher = undefined;
    this.#silent = Boolean(silent);
    this.#sockets = new Map;
    this.#socket = {
      accountId: "",
      ws: undefined,
    };

    this.handlers = {
      REGISTER_PONG_EVENT: (): void => {
        this.addPongEvent();
        this.dispatcher.unsubscribe("GAMES_DATABASE_UPDATE", this.handlers.REGISTER_PONG_EVENT);
        this.#logger(
          "log",
          `[${this.#name} @ handlers#REGISTER_PONG_EVENT] Pong event registered at GAMES_DATABASE_UPDATE`,
        );
      },
      PONG_UPDATE: (accountId: string): void => {
        this.handlers.SPOTIFY_UPDATE({ accountId });
        this.#logger("log", `[${this.#name} @ handlers#PONG_UPDATE] Pong update dispatched`);
      },
      SPOTIFY_UPDATE: (data: { accountId: string }): void => {
        if (!this.#accountId) this.#accountId = data.accountId;

        if (this.#accountId !== data.accountId) {
          logger.warn(
            `[${this.#name} @ handlers#SPOTIFY_UPDATE]"`
            "New account ID",
            `(${data.accountId})`,
            "differs from registered account ID",
            `(${this.#accountId}),`,
            "so change is ignored.",
          );
          return;
        }

        this.emit("update", data.accountId, this.#accountId);
        this.#logger("log", `[${this.#name} @ handlers#SPOTIFY_UPDATE] Update event dispatched`);
        this.#afterSpotifyUpdate();
      },
      SPOTIFY_WEBSOCKET_MESSAGE: (message: SpotifyWebSocketRawMessage): void => {
        this.#logger(
          "log",
          `[${this.#name} @ handlers#SPOTIFY_WEBSOCKET_MESSAGE] Recieved WebSocket message`,
          message,
        );

        if (!message.data) {
          this.#logger(
            "warn",
            `[${this.#name} @ handlers#SPOTIFY_WEBSOCKET_MESSAGE] WebSocket message is empty`,
          );
          return;
        }

        const data = JSON.parse(message.data) as SpotifyWebSocketRawParsedMessage;

        if (data?.type && data?.payloads && data.type !== "pong") {
          if (data.payloads[0].events[0].type === "PLAYER_STATE_CHANGED")
            this.#state = data.payloads[0].events[0].event.state;
          else if (data.payloads[0].events[0].type === "DEVICE_STATE_CHANGED")
            this.#devices = data.payloads[0].events[0].event.devices;

          this.emit(
            "message",
            data.payloads[0].events[0].type,
            data.payloads[0].events[0].type === "PLAYER_STATE_CHANGED"
              ? this.#state
              : this.#devices,
          );

          this.#logger(
            "log",
            `[${this.#name} @ handlers#SPOTIFY_WEBSOCKET_MESSAGE] Dispatched`,
            data.payloads[0].events[0].type,
            "event",
          );
        }
      },
    };

    this.#statuses = {
      registered: false,
      pongFluxListener: false,
      loaded: false,
    };
  }

  get #name(): string {
    return this.constructor.name;
  }

  public get registered(): boolean {
    return this.#registered;
  }

  public get silent(): boolean {
    return this.#silent;
  }

  public set silent(state: boolean) {
    if (typeof state !== "boolean")
      return;
    this.#silent = state;
  }

  public get state(): unknown {
    return this.#state ?? {};
  }

  public get devices(): unknown {
    return this.#devices ?? [];
  }

  public get accountId(): string {
    return this.#accountId;
  }

  public set accountId(id: string) {
    if (typeof id !== "string" || this.#accountId === id) return;
    if (id in this.#sockets) {
      this.#accountId = id;
      this.handlers.SPOTIFY_UPDATE({ accountId: id });
    } else if (!id) {
      this.#accountId = "";
      this.removeSocketEvent();
      this.#socket.ws = undefined;
      this.#logger("log", `[${this.#name} @ accountId (set)] Account ID unset`);
    }
  }

  public get socket(): { accountId: string; ws: undefined | WebSocket } {
    return {
      accountId: this.#socket.accountId,
      ws: this.#socket.ws,
    };
  }

  async #afterSpotifyUpdate(): Promise<void> {
    if (this.#socket.ws && this.#socket.accountId !== this.#accountId) this.removeSocketEvent();
    else if (this.#socket.ws && this.#socket.accountId === this.#accountId) {
      this.#logger(
        "log",
        `[${this.#name} @ #afterSpotifyUpdate] Ignored change due to WebSocket not changing`,
      );
      return;
    }

    this.#socket.accountId = this.#accountId;
    this.#socket.ws = await getSpotifySocket(this.#accountId);

    if (this.#socket.ws)
      this.#socket.ws.addEventListener("message", this.handlers.SPOTIFY_WEBSOCKET_MESSAGE);
    else
      this.#logger("error", `[${this.#name} @ #afterSpotifyUpdate] Cannot get WebSocket`);
  }

  public removeSocketEventListener(): void {
    if (!this.#socket.ws) {
      this.#logger("error", `[${this.#name} @ removeSocketEvent] There is no WebSocket in use`);
      return;
    }

    this.#socket.ws.removeEventListener("message", this.handlers.SPOTIFY_WEBSOCKET_MESSAGE);
    this.#logger("log", `[${this.#name} @ removeSocketEvent] WebSocket event listener removed`);
  }

  public async addPongEventListeners(): Promise<void> {
    // @ts-expect-error - We already have a catch for when this.#sockets is undefined
    const sockets = await getAllSpotifySockets();

    if (sockets && Object.keys(sockets).length) {
      for (const [accountId, socket] of Object.entries(sockets)) {
        if (!this.#sockets.has(accountId))
          this.#sockets.set(accountId, [socket, (message: SpotifyWebSocketRawMessage): void => {
            if (!message.data) {
              this.#logger("warn", `[${this.#name} @ ${accountId} (listener)] Message empty`);
              return;
            }

            const data = JSON.parse(message.data) as unknown as { type: string };
            if (data?.type && data.type === "pong") this.emit("pong", accountId);
          }]);
      }
    } else if (!this.#statuses.pongFluxListener) {
      this.dispatcher.subscribe("SPOTIFY_PROFILE_UPDATE", this.handlers.REGISTER_PONG_EVENT);
      this.#statuses.pongFluxListener = true;
    }
  }

  public removePongEventListeners(): void {
    if (!this.#sockets || !Object.keys(this.#sockets).length) {
      this.#logger("error", `[${this.#name} @ removePongEvent] Sockets list empty`);
      return;
    }

    for (const [accountId, [socket, listener]] of this.#socket) {
      socket.removeEventListener(listener);
      this.#socket.delete(accountId);
    }
  }

  public async registerFluxListener(): Promise<void> {
    if (this.#statuses.registered) {
      logger.warn(`[${this.#name} @ registerFluxListener] Already registered`);
      return;
    }

    if (common?.fluxDispatcher)
      this.dispatcher = common.fluxDispatcher as unknown as FluxDispatcher;
    else
      this.dispatcher = (await webpack.waitForModule(
        webpack.filters.byProps("_subscriptions", "subscribe", "unsubscribe"),
      )) as unknown as FluxDispatcher;

    if (!this.dispatcher) {
      logger.error(`[${this.#name} @ registerFluxListener] FluxDispatcher not found`);
      return;
    }

    this.dispatcher.subscribe("SPOTIFY_PROFILE_UPDATE", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_SET_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_ACCOUNT_ACCESS_TOKEN", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_SET_ACTIVE_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_PLAYER_STATE", this.handlers.SPOTIFY_UPDATE);
    this.#statuses.registered = true;
    this.#logger("log", `[${this.#name} @ registerFluxListener] Registered`);
  }

  public removeFluxListener(): void {
    if (!this.dispatcher || !this.registered) {
      logger.error(`[${this.#name} @ removeFluxListener] Already removed`);
      return;
    }

    this.dispatcher.unsubscribe("SPOTIFY_PROFILE_UPDATE", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_SET_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_ACCOUNT_ACCESS_TOKEN", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_SET_ACTIVE_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_PLAYER_STATE", this.handlers.SPOTIFY_UPDATE);
    this.#statuses.registered = false;
    this.#logger("log", `[${this.#name} @ removeFluxListener] Removed`);
  }

  public async load(): Promise<void> {
    if (this.#statuses.loaded) return;
    await this.registerFlux();
    await this.addPongEvent();
    this.on("pong", this.handlers.PONG_UPDATE);
    this.#statuses.loaded = true;
  }

  public unload(): void {
    if (!this.#statuses.loaded) return;
    this.removeFlux();
    this.removePongEvent();
    this.removeAllListeners("pong");
    this.removeSocketEvent();
    this.#statuses.loaded = false;
  }
}

export class SpotifyModal {
  public animations: {
    artists: undefined | Animation;
    dock: ElementUtilitiesFadeAnimations;
    dockIcons: ElementUtilitiesFadeAnimations;
    metadata: ElementUtilitiesFadeAnimations;
    modal: ElementUtilitiesFadeAnimations;
    modalContainer: ElementUtilitiesFadeAnimations;
    playbackTimeDisplay: ElementUtilitiesFadeAnimations;
    progressBar: ElementUtilitiesFadeAnimations;
    title: undefined | Animation;
  };
  public components: {
    artists: HTMLDivElement;
    coverArt: HTMLImageElement;
    dock: HTMLDivElement;
    dockIcons: HTMLDivElement;
    metadata: HTMLDivElement;
    modal: HTMLDivElement;
    modalContainer: HTMLDivElement;
    playbackTimeCurrent: HTMLSpanElement;
    playbackTimeDuration: HTMLSpanElement;
    playbackTimeDisplay: HTMLDivElement;
    progressBarInner: HTMLDivElement;
    progressBar: HTMLDivElement;
    title: HTMLAnchorElement;
    dockIcons: HTMLDivElement;
  };
  public icons: {
    play: SVGPathElement;
    pause: SVGPathElement;
    playPause: SVGSVGElement;
    repeatTitle: SVGTitleElement;
    repeatAll: SVGPathElement;
    repeatOne: SVGPathElement;
    repeat: SVGSVGElement;
    shuffleTitle: SVGTitleElement;
    shuffle: SVGSVGElement;
    skipPrevious: SVGSVGElement;
    skipNext: SVGSVGElement;
  };
  public watcher: SpotifyWatcher;
  public handlers: {
    MODAL_UPDATE: () => Promise<void>;
    PLAYER_STATE_CHANGED: (data: SpotifyWebSocketState) => Promise<void>;
    DEVICE_STATE_CHANGED: (data: SpotifyWebSocketDevices) => Promise<void>;
    FLUX_DISPATCHER_PLAYER_STATE_FALLBACK: () => Promise<void>;
  };
  #classes: {
    activityName: string;
    anchor: string;
    anchorUnderlineOnHover: string;
    bodyLink: string;
    container: string;
    defaultColor: string;
    ellipsis: string;
    nameNormal: string;
    panels: string;
    "text-sm/semibold": string;
  };
  #silent: boolean;
  #status: {
    active: boolean;
    album: string;
    playing: boolean;
    progress: {
      passed: number;
      duration: number;
    };
    repeat: string;
    shuffle: boolean;
    devices: undefined | SpotifyWebSocketDevices;
    state: unknown;
  };
  #componentsReady: boolean;
  #injected: boolean;
  #loaded: boolean;
  #fluxDispatcherFallback: boolean;
  #panel: undefined | Element;
  #modalUpdateSetIntervalID: undefined | number;
  #modalUpdateRate: number;

  #logger(level: string, ...data: unknown[]): void {
    if (typeof level !== "string" || this.#silent)
      return;

    logger[level](...data);
  }

  public static parseArtists(
    track: SpotifyTrack,
    additionalLinkElementClasses: string | undefined,
    enableTooltip?: boolean,
    onRightClick?: (mouseEvent: MouseEvent) => any,
  ): Array<Text | HTMLAnchorElement> {
    const res: Array<Text | HTMLAnchorElement> = [];
    if (track?.artists?.length) {
      track.artists.forEach(({ name, id }: { name: string; id: string }, index: number) => {
        const element =
          typeof id === "string" ? document.createElement("a") : document.createTextNode("");
        if (typeof id === "string") {
          // @ts-expect-error - In this case .target does exist on element
          element.target = "_blank";
          // @ts-expect-error - In this case .href does exist on element
          element.href = `https://open.spotify.com/artist/${id}`;
          // @ts-expect-error - In this case .style does exist on element
          element.style.color = "var(--header-secondary)";
          // @ts-expect-error - In this case .classList does exist on element
          element.classList.add(
            ...(typeof additionalLinkElementClasses === "string"
              ? additionalLinkElementClasses.split(" ")
              : []),
          );
          // @ts-expect-error - In this case .title does exist on element
          if (enableTooltip) element.title = name;
          if (typeof onRightClick === "function")
            // @ts-expect-error - In this case .oncontextmenu is a valid property for element
            element.oncontextmenu = onRightClick;
          element.appendChild(document.createTextNode(name));
        } else {
          element.nodeValue = name;
        }
        if (track.artists.length - 1 !== index) {
          res.push(element);
          res.push(document.createTextNode(", "));
        } else res.push(element);
      });
    }
    if (!res.length) res.push(document.createTextNode("Unknown"));
    return res;
  }

  public static parseTime(ms: number): string {
    if (typeof ms !== "number") return "";
    const dateObject = new Date(ms);
    const raw = {
      month: dateObject.getUTCMonth(),
      day: dateObject.getUTCDate(),
      hours: dateObject.getUTCHours(),
      minutes: dateObject.getUTCMinutes(),
      seconds: dateObject.getUTCSeconds(),
    };
    const parsedHours = raw.hours + (raw.day - 1) * 24 + raw.month * 30 * 24;

    return `${parsedHours > 0 ? `${parsedHours}:` : ""}${
      raw.minutes < 10 && parsedHours > 0 ? `0${raw.minutes}` : raw.minutes
    }:${raw.seconds < 10 ? `0${raw.seconds}` : raw.seconds}`;
  }

  public constructor(modalUpdateRate?: number, silent?: boolean) {
    this.animations = {
      artists: undefined,
      ...animations,
      title: undefined,
    };
    this.components = components;
    this.icons = icons;
    this.#classes = {
      activityName: "",
      anchor: "",
      anchorUnderlineOnHover: "",
      bodyLink: "",
      container: "",
      defaultColor: "",
      ellipsis: "",
      nameNormal: "",
      panels: "",
      "text-sm/semibold": "",
    };
    this.#silent = Boolean(silent);
    this.#status = {
      active: false,
      album: "",
      playing: false,
      progress: {
        passed: 0,
        duration: 0,
      },
      repeat: "off",
      shuffle: false,
      devices: undefined,
      state: undefined,
    };

    this.handlers = {
      MODAL_UPDATE: async (): Promise<void> => {
        if (!this.#status.active) {
          this.#logger("log", `[${this.#name} @ handlers#MODAL_UPDATE] Spotify is not active`);
          clearInterval(this.#modalUpdateSetIntervalID);
          this.#modalUpdateSetIntervalID = undefined;
          this.animations.modalContainer.fadeout();
          if (this.animations.title) {
            this.animations.title.cancel();
            this.animations.title = undefined;
            this.#logger(
              "log",
              `[${this.#name} @ handlers#MODAL_UPDATE] Title element animation cancelled`,
            );
          }
          if (this.animations.artists) {
            this.animations.artists.cancel();
            this.animations.artists = undefined;
            if (!this.silent)
              logger.log(
                "log",
                `[${this.#name} @ handlers#MODAL_UPDATE] Artists element animation cancelled`,
              );
          }
          this.components.progressBarInner.style.width = "0%";
          this.components.playbackTimeCurrent.innerText = "0:00";
          this.components.playbackTimeDuration.innerText = "0:00";
          this.watcher.accountId = "";
          this.#status.playing = false;
        }
        if (this.#status.playing) {
          this.#status.progress.passed += this.#modalUpdateRate;
          this.components.playbackTimeCurrent.innerText = SpotifyModal.parseTime(
            this.#status.progress.passed,
          );
          if (
            this.components.playbackTimeDuration.innerText !==
            SpotifyModal.parseTime(this.#status.progress.duration)
          )
            this.components.playbackTimeDuration.innerText = SpotifyModal.parseTime(
              this.#status.progress.duration,
            );
          this.components.progressBarInner.style.width = `${(
            (this.#status.progress.passed / this.#status.progress.duration) *
            100
          ).toFixed(4)}%`;
          this.#logger("log", `[${this.#name} @ handlers#MODAL_UPDATE] Updated timebar`);
        }
      },
      // Fallback for when SpotifyWatcher is not active
      FLUX_DISPATCHER_PLAYER_STATE_FALLBACK: async (): Promise<void> => {
        if (!this.#fluxDispatcherFallback) return;

        this.#logger(
          "log",
          `[${this.#name} @ handlers#FLUX_DISPATCHER_PLAYER_STATE_FALLBACK] Fallback triggered`,
        );
        const playerData = (await spotifyControls.getPlayerState(
          this.watcher.accountId,
        )) as unknown as SpotifyWebSocketState;

        if (!playerData) {
          this.#logger(
            "error",
            `[${this.#name} @ handlers#FLUX_DISPATCHER_PLAYER_STATE_FALLBACK] Message empty`,
          );
          return;
        }

        this.handlers.PLAYER_STATE_CHANGED(playerData);
        this.#fluxDispatcherFallback = false;
        this.watcher.dispatcher.unsubscribe(
          "SPOTIFY_PLAYER_STATE",
          this.handlers.FLUX_DISPATCHER_PLAYER_STATE_FALLBACK,
        );
      },
      PLAYER_STATE_CHANGED: async (data: SpotifyWebSocketState): Promise<void> => {
        this.#logger("log", `[${this.#name} @ handlers#PLAYER_STATE_CHANGED] State update`, data);
        this.#status.active = data?.device ? data.device.is_active : false;
        this.#status.state = data;
        this.#status.playing = data.is_playing;
        this.#status.progress.passed = typeof data?.progress_ms === "number" ? data.progress_ms : 0;
        this.#status.progress.duration =
          typeof data?.item?.duration_ms === "number" ? data.item.duration_ms : 0;
        this.#status.repeat = data.repeat_state;
        this.#status.shuffle = data.shuffle_state;
        this.#status.album =
          data?.item?.album && data.item.album?.id
            ? `https://open.spotify.com/album/${data.item.album.id}`
            : "";
        this.#updateModal(data);
      },
      DEVICE_STATE_CHANGED: async (data: SpotifyWebSocketDevices): Promise<void> => {
        this.#logger("log", `[${this.#name} @ handlers#DEVICE_STATE_CHANGED] Devices list update`, data);
        this.#status.devices = data;
        if (!data.length) this.#status.active = false;
        else this.#status.active = true;
        this.#updateModal();
      },
    };

    this.watcher = new SpotifyWatcher(this.silent);
    this.#fluxDispatcherFallback = true;
    this.#componentsReady = false;
    this.#injected = false;
    this.#loaded = false;
    this.#panel = undefined;
    this.#modalUpdateSetIntervalID = undefined;
    this.#modalUpdateRate = typeof modalUpdateRate === "number" ? modalUpdateRate : 500;
    this.watcher.on(
      "message",
      (type: string, message: SpotifyWebSocketState | SpotifyWebSocketDevices) => {
        if (["PLAYER_STATE_CHANGED", "DEVICE_STATE_CHANGED"].includes(type))
          this.handlers[type](message);
        else
          logger.warn(
            `[${this.#name} @ watcher#message`,
            "Unknown event type recieved:",
            type,
            message,
          );
      },
    );
  }

  get #name(): string {
    return this.constructor.name;
  }

  get silent(): boolean {
    return this.#silent;
  }

  set silent(state: boolean) {
    if (typeof silent !== "boolean") return;
    this.#silent = state;
    this.#watcher.silent = state;
  }

  public async getClasses(): Promise<void> {
    const activityClasses = await webpack.waitForModule<{
      activityName: string;
      bodyLink: string;
      ellipsis: string;
      nameNormal: string;
    }>(webpack.filters.byProps("activityName"));
    const anchorClasses = await webpack.waitForModule<{
      anchor: string;
      anchorUnderlineOnHover: string;
    }>(webpack.filters.byProps("anchorUnderlineOnHover"));
    const colorClasses = await webpack.waitForModule<{
      defaultColor: string;
      "text-sm/semibold": string;
    }>(webpack.filters.byProps("defaultColor"));
    const containerClasses = await webpack.waitForModule<{
      container: string;
    }>(webpack.filters.byProps("avatar", "customStatus"));
    const panelClasses = await webpack.waitForModule<{
      panels: string;
    }>(webpack.filters.byProps("panels"));

    this.#classes = {
      activityName: this.#classes?.activityName || activityClasses.activityName,
      anchor: this.#classes?.anchor || anchorClasses.anchor,
      anchorUnderlineOnHover:
        this.#classes?.anchorUnderlineOnHover || anchorClasses.anchorUnderlineOnHover,
      bodyLink: this.#classes?.bodyLink || activityClasses.bodyLink,
      container: this.#classes?.container || containerClasses.container,
      defaultColor: this.#classes?.defaultColor || colorClasses.defaultColor,
      ellipsis: this.#classes?.ellipsis || activityClasses.ellipsis,
      nameNormal: this.#classes?.nameNormal || activityClasses.nameNormal,
      panels: this.#classes?.panels || panelClasses.panels,
      "text-sm/semibold": this.#classes?.["text-sm/semibold"] || colorClasses["text-sm/semibold"],
    };

    this.#logger("log", `[${this.#name} @ getClasses] Succeeded`);
  }

  public async getPanel(): Promise<void> {
    if (!this.#classes?.panels) await this.getClasses();
    this.#panel = document.body.getElementsByClassName(this.#classes.panels)[0];
    if (!this.#panel) logger.error(`[${this.#name} @ getPanel] Panel not found`);
  }

  public async initializeComponents(): Promise<void> {
    if (this.#componentsReady) {
      logger.warn(`[${this.#name} @ initializeComponents] Components already initialized`);
      return;
    }
    if (
      !this.#classes?.container ||
      !this.#classes?.anchor ||
      !this.#classes?.defaultColor ||
      !this.#classes?.nameNormal
    )
      await this.getClasses();
    if (!this.components.modal.className.includes(this.#classes.container))
      this.components.modal.classList.add(this.#classes.container);
    if (!this.components.title.className.includes(this.#classes.anchor))
      this.components.title.classList.add(
        this.#classes.anchor,
        this.#classes.anchorUnderlineOnHover,
        this.#classes.defaultColor,
        this.#classes["text-sm/semibold"],
        ...this.#classes.nameNormal.split(" ").filter((classes) => !classes.match(/^ellipsis/)),
      );

    this.components.coverArt.onclick = (): void => {
      if (!this.#status.album) return;
      window.open(this.#status.album, "_blank");
    };
    this.components.coverArt.oncontextmenu = (): void => {
      if (!this.#status.album) return;
      DiscordNative.clipboard.copy(this.#status.album);
    };
    this.components.title.oncontextmenu = (mouseEvent: MouseEvent): void => {
      const element = mouseEvent?.target as unknown as HTMLAnchorElement;
      if (element && typeof element?.href === "string") DiscordNative.clipboard.copy(element.href);
    };

    // Buttons
    this.icons.playPause.onclick = (): void => {
      spotifyControls.setPlaybackState(!this.#status.playing, this.watcher.accountId);
    };
    this.icons.repeat.onclick = (): void => {
      const nextModes = { off: "context", context: "track", track: "off" };
      spotifyControls.setRepeatMode(nextModes[this.#status.repeat], this.watcher.accountId);
    };
    this.icons.shuffle.onclick = (): void => {
      spotifyControls.setShuffleState(!this.#status.shuffle, this.watcher.accountId);
    };
    this.icons.skipPrevious.onclick = (): void => {
      spotifyControls.skipTrack(false, this.watcher.accountId);
    };
    this.icons.skipNext.onclick = (): void => {
      spotifyControls.skipTrack(true, this.watcher.accountId);
    };
    elementUtilities.createHoverEffect(
      this.icons.repeat,
      (): void => {
        this.icons.repeat.style.color = "var(--brand-experiment-400)";
      },
      (): void => {
        this.icons.repeat.style.color =
          this.#status.repeat === "off" ? "var(--text-normal)" : "var(--brand-experiment-500)";
      },
      400,
    );
    elementUtilities.createHoverEffect(
      this.icons.shuffle,
      (): void => {
        this.icons.shuffle.style.color = "var(--brand-experiment-400)";
      },
      (): void => {
        this.icons.shuffle.style.color = this.#status.shuffle
          ? "var(--brand-experiment-500)"
          : "var(--text-normal)";
      },
      400,
    );

    this.#componentsReady = true;
    this.#logger("log", `[${this.#name} @ initializeComponents] Succeeded`);
  }

  public async injectModal(): Promise<void> {
    if (this.#injected) {
      logger.warn(`[${this.#name} @ injectModal] Already injected`);
      return;
    }
    if (!this.#panel) await this.getPanel();
    if (!this.#panel) {
      logger.error(`[${this.#name} @ injectModal] Panel not found`);
      return;
    }
    if (!this.#componentsReady) await this.initializeComponents();
    this.components.modalContainer.style.display = "none";
    this.#panel.insertAdjacentElement("afterbegin", this.components.modalContainer);
    this.#injected = true;
    logger.log(`[${this.#name} @ injectModal] Succeeded`);
  }

  public uninjectModal(): void {
    if (!this.#panel) {
      logger.warn(`[${this.#name} @ uninjectModal] Panel not found`);
      return;
    }
    if (!this.#injected) {
      logger.warn(`[${this.#name} @ uninjectModal] Already uninjected`);
      return;
    }

    if (this.#modalUpdateSetIntervalID) {
      clearInterval(this.#modalUpdateSetIntervalID);
      this.#modalUpdateSetIntervalID = undefined;
    }

    this.#panel.removeChild(this.components.modalContainer);
    this.#injected = false;
    logger.log(`[${this.#name} @ uninjectModal] Succeeded`);
  }

  async #updateModal(data?: SpotifyWebSocketState): Promise<void> {
    if (!Object.keys(this.#classes).length) await this.getClasses();
    if (!this.#injected) await this.injectModal();

    this.icons.playPause.replaceChildren(this.#status.playing ? this.icons.pause : this.icons.play);
    this.icons.shuffle.style.color = this.#status.shuffle
      ? "var(--brand-experiment-500)"
      : "var(--text-normal)";
    this.icons.shuffleTitle.replaceChildren(
      document.createTextNode(`Shuffle ${this.#status.shuffle ? "on" : "off"}`),
    );
    this.icons.repeat.style.color =
      this.#status.repeat === "off" ? "var(--text-normal)" : "var(--brand-experiment-500)";
    this.icons.repeat.replaceChildren(
      this.icons.repeatTitle,
      this.#status.repeat === "track" ? this.icons.repeatOne : this.icons.repeatAll,
    );
    this.icons.repeatTitle.replaceChildren(
      document.createTextNode(`Repeat ${this.#status.repeat}`),
    );

    if (data) {
      if (!this.#modalUpdateSetIntervalID)
        this.#modalUpdateSetIntervalID = setInterval(
          this.handlers.MODAL_UPDATE,
          this.#modalUpdateRate,
        ) as unknown as number;

      this.animations.modalContainer.fadein();

      if (data?.item?.is_local) {
        this.components.title.href = "";
        this.components.title.style.textDecoration = "none";
        this.components.title.style.cursor = "default";
        this.components.coverArt.src = "";
        this.components.coverArt.title = "";
        this.components.coverArt.style.cursor = "";
      } else {
        this.components.title.href = `https://open.spotify.com/track/${data.item.id}`;
        this.components.title.style.textDecoration = "";
        this.components.title.style.cursor = "";
        this.components.coverArt.src = data.item.album.images[0].url;
        this.components.coverArt.title = data.item.album.name;
        this.components.coverArt.style.cursor = "pointer";
      }

      this.components.playbackTimeCurrent.innerText = SpotifyModal.parseTime(
        this.#status.progress.passed,
      );
      if (
        this.components.playbackTimeDuration.innerText !==
        SpotifyModal.parseTime(this.#status.progress.duration)
      )
        this.components.playbackTimeDuration.innerText = SpotifyModal.parseTime(
          this.#status.progress.duration,
        );
      this.components.progressBarInner.style.width = `${(
        (this.#status.progress.passed / this.#status.progress.duration) *
        100
      ).toFixed(4)}%`;

      this.components.title.innerText =
        typeof data?.item?.name === "string" ? data.item.name : "Unknown";
      this.components.title.title =
        typeof data?.item?.name === "string" ? data.item.name : "Unknown";
      if (this.components.title.scrollWidth > (this.components.title.offsetWidth as number) + 10) {
        if (this.components.title.className.includes(this.#classes.ellipsis))
          this.components.title.classList.remove(this.#classes.ellipsis);
        this.animations.title = elementUtilities.createTextScrollingAnimation(
          this.components.title,
        );
      } else {
        if (this.animations.title) {
          this.animations.title.cancel();
          this.animations.title = undefined;
        }
        if (!this.components.title.className.includes(this.#classes.ellipsis))
          this.components.title.classList.add(this.#classes.ellipsis);
      }

      this.components.artists.replaceChildren(
        ...SpotifyModal.parseArtists(
          data.item,
          `${this.#classes.anchor} ` +
            `${this.#classes.anchorUnderlineOnHover} ` +
            `${this.#classes.bodyLink} ` +
            `${this.#classes.ellipsis}`,
          true,
          (mouseEvent: MouseEvent): void => {
            const element = mouseEvent?.target as unknown as HTMLAnchorElement;
            if (element && typeof element?.href === "string")
              DiscordNative.clipboard.copy(element.href);
          },
        ),
      );
      if (
        this.components.artists.scrollWidth >
        (this.components.artists.offsetWidth as number) + 10
      ) {
        if (this.components.artists.className.includes(this.#classes.ellipsis))
          this.components.artists.classList.remove(this.#classes.ellipsis);
        this.animations.artists = elementUtilities.createTextScrollingAnimation(
          this.components.artists,
        );
      } else {
        if (this.animations.artists) {
          this.animations.artists.cancel();
          this.animations.artists = undefined;
        }
        if (!this.components.artists.className.includes(this.#classes.ellipsis))
          this.components.artists.classList.add(this.#classes.ellipsis);
      }
    }
  }

  public async load(): Promise<void> {
    if (this.#loaded) return;
    await this.watcher.load();
    this.watcher.dispatcher.subscribe(
      "SPOTIFY_PLAYER_STATE",
      this.handlers.FLUX_DISPATCHER_PLAYER_STATE_FALLBACK,
    );
    await this.getClasses();
    await this.injectModal();
    this.#loaded = true;
  }

  public unload(): void {
    if (!this.#loaded) return;
    this.watcher.unload();
    this.watcher.dispatcher.unsubscribe(
      "SPOTIFY_PLAYER_STATE",
      this.handlers.FLUX_DISPATCHER_PLAYER_STATE_FALLBACK,
    );
    this.uninjectModal();
    this.#loaded = false;
  }
} */
