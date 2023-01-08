/* eslint-disable
  @typescript-eslint/naming-convention,
  @typescript-eslint/no-inferrable-types,
  @typescript-eslint/no-floating-promises,
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/require-await,
  @typescript-eslint/no-dynamic-delete,
  new-cap
*/
import { Logger, common, types, webpack } from "replugged";
import {
  FluxDispatcher,
  SpotifyDevice,
  SpotifySocket,
  SpotifySocketModule,
  SpotifyTrack,
  SpotifyWebSocketDevices,
  SpotifyWebSocketRawMessage,
  SpotifyWebSocketRawParsedMessage,
  SpotifyWebSocketState,
} from "./types";
import { components, icons } from "./components";
export { ElementBuilders } from "./components";

declare const DiscordNative: {
  clipboard: {
    copy: (value: string) => void;
  };
};

const logger = Logger.plugin("SpotifyModal");
let store: void | SpotifySocketModule;

(async () => {
  store = (await webpack.waitForModule(
    webpack.filters.byProps("getActiveSocketAndDevice"),
  )) as unknown as SpotifySocketModule;
})();

export async function getSpotifyAccount(accountId?: string): Promise<void | SpotifySocket> {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps("getActiveSocketAndDevice"),
    )) as unknown as SpotifySocketModule;

  if (!store) {
    logger.error("[Utils @ getSpotifyAccount]: Cannot find SpotifyStore");
    return;
  }

  if (!accountId) {
    if (Object.keys(store.__getLocalVars().accounts).length)
      return Object.values(store.__getLocalVars().accounts)[0];
    else {
      logger.warn("[Utils @ getSpotifyAccount] SpotifyStore contains no accounts");
    }
  } else if (accountId in store.__getLocalVars().accounts) {
    return store.__getLocalVars().accounts[accountId];
  } else {
    logger.error(
      "[Utils @ getSpotifyAccount] No such account ID exists in SpotifyStore:",
      accountId,
    );
  }
}

export async function getSpotifySocket(accountId?: string): Promise<void | WebSocket> {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps("getActiveSocketAndDevice"),
    )) as unknown as SpotifySocketModule;

  if (!store) {
    logger.error("[Utils @ getSpotifySocket]: Cannot find SpotifyStore");
    return;
  }

  // Method I: Get from .getActiveSocketAndDevice
  let activeSocketAndDevice = store.getActiveSocketAndDevice();
  if (activeSocketAndDevice && activeSocketAndDevice.socket.accountId === accountId)
    return activeSocketAndDevice.socket.socket;

  // Method II: Get from .__getLocalVars().accounts[accountId]
  const accounts = store.__getLocalVars().accounts;
  if (accountId in accounts) return accounts[accountId].socket;

  // Method III: Get without accountId through both getActiveSocketAndDevice & accounts
  // (bruteforcing --- may cause inaccuracy with accountId if accountId is provided)
  activeSocketAndDevice = store.getActiveSocketAndDevice();
  if (activeSocketAndDevice) return activeSocketAndDevice.socket.socket;
  return Object.values(accounts).length ? Object.values(accounts)[0].socket : undefined;

  logger.error("[Utils @ getSpotifySocket]: Cannot find socket");
}

export async function getAllSpotifySockets(): Promise<void | Record<string, WebSocket>> {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps("getActiveSocketAndDevice"),
    )) as unknown as SpotifySocketModule;

  if (!store) {
    logger.error("[Utils @ getAllSpotifySockets]: Cannot find SpotifyStore");
    return;
  }

  const accounts = store.__getLocalVars().accounts;
  if (!Object.keys(accounts).length) {
    logger.warn("[Utils @ getAllSpotifySockets]: SpotifyStore contains no accounts");
  } else {
    const sockets: Record<string, WebSocket> = {};
    Object.entries(accounts).forEach(([accountId, socket]: [string, SpotifySocket]): void => {
      sockets[accountId] = socket.socket;
    });
    return sockets;
  }
}

async function sendSpotifyAPI(
  endpoint: string,
  accountId?: string,
  method: string = "PUT",
  query?: Record<string, string>,
  body?: string,
): Promise<void | Response> {
  const account = await getSpotifyAccount(accountId);

  if (!account) {
    logger.error("[Utils @ sendSpotifyAPI] Spotify account not found");
    return;
  }

  let uri = `https://api.spotify.com/v1/${endpoint}`;

  if (typeof query === "object" && !Array.isArray(query)) {
    Object.entries(query).forEach(([key, value]: [string, string]): void => {
      uri += uri.match(/\?/)
        ? `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        : `?${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    });
  }

  return fetch(uri, {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${account?.accessToken}`,
    },
    method,
    body,
  });
}

export const spotifyControls = {
  sendSpotifyAPI,
  async getPlayerState(accountId?: string): Promise<void | Response> {
    const res = await sendSpotifyAPI("me/player", accountId, "GET");
    // @ts-expect-error - .json() exists
    return res.json();
  },
  async setPlaybackState(state: boolean, accountId?: string): Promise<void | Response> {
    return sendSpotifyAPI(`me/player/${state ? "play" : "pause"}`, accountId);
  },
  async setRepeatMode(mode: string, accountId?: string): Promise<void | Response> {
    const modes = ["off", "context", "track"];
    if (!modes.includes(mode)) return;
    return sendSpotifyAPI(`me/player/repeat`, accountId, undefined, { state: mode });
  },
  async setShuffleState(state: boolean, accountId?: string): Promise<void | Response> {
    return sendSpotifyAPI("me/player/shuffle", accountId, undefined, {
      state: `${state ? "true" : "false"}`,
    });
  },
  async seekToPosition(position: number, accountId?: string): Promise<void | Response> {
    if (typeof position !== "number") return;
    return sendSpotifyAPI("me/player/seek", accountId, undefined, {
      position_ms: position.toString(),
    });
  },
  async setPlaybackVolume(percent: number, accountId?: string): Promise<void | Response> {
    if (typeof percent !== "number") return;
    return sendSpotifyAPI("me/player/volume", accountId, undefined, {
      volume_percent: percent.toString(),
    });
  },
  async skipTrack(forward: boolean = true, accountId?: string): Promise<void | Response> {
    return sendSpotifyAPI(`me/player/${forward ? "next" : "previous"}`, accountId, "POST");
  },
};

export class EventEmitter {
  public _events: Record<string, Set<(...args: any) => any>>;
  public silent: boolean;

  public constructor(silent?: boolean) {
    this._events = {};
    this.silent = Boolean(silent);
  }

  #fixEventsList(): void {
    Object.entries(this._events).forEach(
      ([name, set]: [string, Set<(...args: any) => any>]): void => {
        if (!set?.size) delete this._events[name];
      },
    );
  }

  public on(name: string, callback: (...args: any) => any): void {
    if (typeof name !== "string" || typeof callback !== "function") return;
    if (!this._events[name]) this._events[name] = new Set();
    this._events[name].add(callback);
  }

  public once(name: string, callback: (...args: any) => any): void {
    if (typeof name !== "string" || typeof callback !== "function") return;
    const replacedFunction = (...args: any): void => {
      callback(...args);
      this._events[name].delete(replacedFunction);
      this.#fixEventsList();
    };
    if (!this._events[name]) this._events[name] = new Set();
    this._events[name].add(replacedFunction);
  }

  public removeAllListeners(name?: string): void {
    if (typeof name === "string" && name in this._events) delete this._events[name];
    else this._events = {};
  }

  public emit(name: string, ...data: any): void {
    if (name in this._events) {
      const listeners = this._events[name];
      for (const listener of listeners) listener(...data);
    } else if (!this.silent) logger.warn("[EventEmitter @ emit] No event listeners for", name);
  }
}

export class SpotifyWatcher extends EventEmitter {
  #accountId: string;
  public dispatcher: FluxDispatcher | undefined;
  #devices: undefined | SpotifyDevice[];
  #modalAnimations: {
    titleElement: undefined | Animation;
    artistsElement: undefined | Animation;
  };
  public silent: boolean;
  #state: undefined | SpotifyWebSocketState;
  #sockets: undefined | Record<string, WebSocket>;
  #socketsPongHandlers: Record<string, (message: SpotifyWebSocketRawMessage) => void>;
  #socket: {
    accountId: string;
    ws: undefined | void | WebSocket;
  };
  public handlers: {
    REGISTER_PONG_EVENT: () => void;
    PONG_UPDATE: (accountId: string) => void;
    SPOTIFY_UPDATE: (data: { accountId: string }) => void;
    SPOTIFY_WEBSOCKET_MESSAGE: (message: SpotifyWebSocketRawMessage) => void;
  };
  #registered: boolean;
  #pongListenerRegistered: boolean;

  public constructor(silent?: boolean) {
    super(Boolean(silent));
    this.#accountId = "";
    this.dispatcher = undefined;
    this.#devices = undefined;
    this.#modalAnimations = {
      titleElement: undefined,
      artistsElement: undefined,
    };
    this.silent = Boolean(silent);
    this.#state = undefined;
    this.#sockets = undefined;
    this.#socketsPongHandlers = {};
    this.#socket = {
      accountId: "",
      ws: undefined,
    };
    this.handlers = {
      REGISTER_PONG_EVENT: (): void => {
        this.addPongEvent();
        this.dispatcher.unsubscribe("GAMES_DATABASE_UPDATE", this.handlers.REGISTER_PONG_EVENT);
        if (!this.silent)
          logger.log(
            "[SpotifyWatcher @ handlers#REGISTER_PONG_EVENT] Pong event registered at GAMES_DATABASE_UPDATE",
          );
      },
      PONG_UPDATE: (accountId: string): void => {
        this.handlers.SPOTIFY_UPDATE({ accountId });
        if (!this.silent)
          logger.log("[SpotifyWatcher @ handlers#PONG_UPDATE] Pong update dispatched");
      },
      SPOTIFY_UPDATE: (data: { accountId: string }): void => {
        if (!this.#accountId) this.#accountId = data.accountId;
        if (this.#accountId !== data.accountId) {
          logger.warn(
            "[SpotifyWatcher @ handlers#SPOTIFY_UPDATE]",
            "New account ID",
            `(${data.accountId})`,
            "differs from registered account ID",
            `(${this.#accountId}),`,
            "so change is ignored.",
          );
          return;
        }

        this.emit("update", data.accountId, this.#accountId);
        if (!this.silent)
          logger.log("[SpotifyWatcher @ handlers#SPOTIFY_UPDATE] Update event dispatched");
        this.#afterSpotifyUpdate();
      },
      SPOTIFY_WEBSOCKET_MESSAGE: (message: SpotifyWebSocketRawMessage): void => {
        if (!this.silent)
          logger.log(
            "[SpotifyWatcher @ handlers#SPOTIFY_WEBSOCKET_MESSAGE] Recieved WebSocket message",
            message,
          );
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
          if (!this.silent)
            logger.log(
              "[SpotifyWatcher @ handlers#SPOTIFY_WEBSOCKET_MESSAGE] Dispatched",
              data.payloads[0].events[0].type,
              "event",
            );
        }
      },
    };
    this.#registered = false;
    this.#pongListenerRegistered = false;
  }

  public get registered(): boolean {
    return this.#registered;
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
      if (!this.silent) logger.log("[SpotifyWatcher @ accountId (set)] Account ID unset");
    }
  }

  public get socket(): { accountId: string; ws: void | undefined | WebSocket } {
    return {
      accountId: this.#socket.accountId,
      ws: this.#socket.ws,
    };
  }

  async #afterSpotifyUpdate(): Promise<void> {
    if (this.#socket.ws && this.#socket.accountId !== this.#accountId) this.removeSocketEvent();
    else if (this.#socket.ws && this.#socket.accountId === this.#accountId) {
      if (!this.silent)
        logger.warn(
          "[SpotifyWatcher @ #afterSpotifyUpdate] Ignored change due to WebSocket not changing",
        );
      return;
    }

    this.#socket.accountId = this.#accountId;
    this.#socket.ws = await getSpotifySocket(this.#accountId);
    if (this.#socket.ws) {
      this.#socket.ws.addEventListener("message", this.handlers.SPOTIFY_WEBSOCKET_MESSAGE);
      this.emit("websocket", this.#socket.ws);
    } else this.emit("error", "websocket");
  }

  public removeSocketEvent(): void {
    if (!this.#socket.ws) {
      if (!this.silent)
        logger.error("[SpotifyWatcher @ removeSocketEvent] Current WebSocket is nullish");
      return;
    }
    this.#socket.ws.removeEventListener("message", this.handlers.SPOTIFY_WEBSOCKET_MESSAGE);
    if (!this.silent)
      logger.log("[SpotifyWatcher @ removeSocketEvent] Removed socket event handler");
  }

  public async addPongEvent(): Promise<void> {
    // @ts-expect-error - We already have a catch for when this.#sockets is undefined
    this.#sockets = await getAllSpotifySockets();
    if (this.#sockets) {
      Object.entries(this.#sockets).forEach(([accountId, socket]: [string, WebSocket]): void => {
        if (this.#socketsPongHandlers[accountId] === undefined) {
          this.#socketsPongHandlers[accountId] = (message: SpotifyWebSocketRawMessage): void => {
            const data = JSON.parse(message.data) as unknown as { type: string };

            if (data?.type && data?.type === "pong") this.emit("pong", accountId);
          };
          socket.addEventListener("message", this.#socketsPongHandlers[accountId]);
        }
      });
    } else if (!this.#pongListenerRegistered) {
      this.dispatcher.subscribe("SPOTIFY_PROFILE_UPDATE", this.handlers.REGISTER_PONG_EVENT);
      this.#pongListenerRegistered = true;
    }
  }

  public removePongEvent(): void {
    if (!this.#sockets) return;
    Object.entries(this.#sockets).forEach(([accountId, socket]: [string, WebSocket]): void => {
      if (this.#socketsPongHandlers[accountId] !== undefined) {
        socket.removeEventListener("message", this.#socketsPongHandlers[accountId]);
        delete this.#socketsPongHandlers[accountId];
      }
    });
  }

  public async registerFlux(): Promise<void> {
    if (common?.fluxDispatcher)
      this.dispatcher = common.fluxDispatcher as unknown as FluxDispatcher;
    else
      this.dispatcher = (await webpack.waitForModule(
        webpack.filters.byProps("_subscriptions", "subscribe", "unsubscribe"),
      )) as unknown as FluxDispatcher;

    if (!this.dispatcher) {
      logger.error("[SpotifyWatcher @ registerFlux] FluxDispatcher not found");
      return;
    }

    if (this.registered) {
      logger.warn("[SpotifyWatcher @ registerFlux] Already registered");
      return;
    }

    this.dispatcher.subscribe("SPOTIFY_PROFILE_UPDATE", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_SET_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_ACCOUNT_ACCESS_TOKEN", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_SET_ACTIVE_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_PLAYER_STATE", this.handlers.SPOTIFY_UPDATE);
    this.#registered = true;
    this.emit("registered");
    if (!this.silent) logger.log("[SpotifyWatcher @ registerFlux] Registered");
  }

  public removeFlux(): void {
    if (!this.dispatcher || !this.registered) {
      logger.error("[SpotifyWatcher @ removeFlux] Already removed");
      return;
    }

    this.dispatcher.unsubscribe("SPOTIFY_PROFILE_UPDATE", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_SET_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_ACCOUNT_ACCESS_TOKEN", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_SET_ACTIVE_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_PLAYER_STATE", this.handlers.SPOTIFY_UPDATE);
    this.#registered = false;
    this.emit("unregistered");
    if (!this.silent) logger.log("[SpotifyWatcher @ removeFlux] Removed");
  }

  public async load(): Promise<void> {
    await this.registerFlux();
    await this.addPongEvent();
    if (!this._events?.pong || !this._events.pong.has(this.handlers.PONG_UPDATE))
      this.on("pong", this.handlers.PONG_UPDATE);
  }

  public unload(): void {
    this.removeFlux();
    this.removePongEvent();
    this.removeAllListeners("pong");
    this.removeSocketEvent();
  }
}

export class SpotifyModal {
  public components: {
    _dockIcons: HTMLDivElement;
    title: HTMLAnchorElement;
    artists: HTMLDivElement;
    _metadata: HTMLDivElement;
    playbackTimeCurrent: HTMLSpanElement;
    playbackTimeDuration: HTMLSpanElement;
    _playbackTimeDisplay: HTMLDivElement;
    progressBarInner: HTMLDivElement;
    _progressBar: HTMLDivElement;
    coverArt: HTMLImageElement;
    dock: HTMLDivElement;
    dockAnimations: {
      animations: {
        fadein: Animation;
        fadeout: Animation;
      };
      fadein: () => void;
      fadeout: () => void;
    };
    modal: HTMLDivElement;
    modalAnimations: {
      animations: {
        fadein: Animation;
        fadeout: Animation;
      };
      fadein: () => void;
      fadeout: () => void;
    };
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
  public silent: boolean;
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
  #fluxDispatcherFallback: boolean;
  #panel: undefined | Element;
  #modalAnimations: {
    title: undefined | Animation;
    artists: undefined | Animation;
  };
  #modalUpdateSetIntervalID: undefined | number;
  #modalUpdateRate: number;

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

  public static getTextScrollingAnimation(element: HTMLElement): Animation {
    const animations = element.getAnimations();
    if (animations.length)
      animations.forEach((animation: Animation): void => {
        animation.cancel();
      });
    return element.animate(
      [
        { transform: "translateX(0)" },
        { transform: `translateX(-${element.scrollWidth - element.offsetWidth}px)` },
      ],
      {
        iterations: Infinity,
        duration: (element.scrollWidth - element.offsetWidth) * 50,
        direction: "alternate-reverse",
        easing: "linear",
      },
    );
  }

  public constructor(modalUpdateRate?: number, silent?: boolean) {
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
    this.silent = Boolean(silent);
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
          if (!this.silent)
            logger.log("[SpotifyModal @ handlers#MODAL_UPDATE] Spotify is not active");
          clearInterval(this.#modalUpdateSetIntervalID);
          this.#modalUpdateSetIntervalID = undefined;
          if (this.components.modal.style.display !== "none")
            this.components.modalAnimations.fadeout();
          if (this.components.dock.style.display !== "none")
            this.components.dockAnimations.fadeout();
          if (this.#modalAnimations.title) {
            this.#modalAnimations.title.cancel();
            this.#modalAnimations.title = undefined;
            if (!this.silent)
              logger.log(
                "[SpotifyModal @ handlers#MODAL_UPDATE] Title element animation cancelled",
              );
          }
          if (this.#modalAnimations.artists) {
            this.#modalAnimations.artists.cancel();
            this.#modalAnimations.artists = undefined;
            if (!this.silent)
              logger.log(
                "[SpotifyModal @ handlers#MODAL_UPDATE] Artists element animation cancelled",
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
          if (!this.silent) logger.log("[SpotifyModal @ handlers#MODAL_UPDATE] Updated timebar");
        }
      },
      // Fallback for when SpotifyWatcher is not active
      FLUX_DISPATCHER_PLAYER_STATE_FALLBACK: async (): Promise<void> => {
        if (!this.#fluxDispatcherFallback) return;
        if (!this.silent)
          logger.log(
            "[SpotifyModal @ handlers#FLUX_DISPATCHER_PLAYER_STATE_FALLBACK] Fallback triggered",
          );
        const playerData = (await spotifyControls.getPlayerState(
          this.watcher.accountId,
        )) as unknown as SpotifyWebSocketState;
        this.handlers.PLAYER_STATE_CHANGED(playerData);
        this.#fluxDispatcherFallback = false;
        this.watcher.dispatcher.unsubscribe(
          "SPOTIFY_PLAYER_STATE",
          this.handlers.FLUX_DISPATCHER_PLAYER_STATE_FALLBACK,
        );
      },
      PLAYER_STATE_CHANGED: async (data: SpotifyWebSocketState): Promise<void> => {
        if (!this.silent)
          logger.log("[SpotifyModal @ handlers#PLAYER_STATE_CHANGED] State update", data);
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
        if (!this.silent)
          logger.log("[SpotifyModal @ handlers#DEVICE_STATE_CHANGED] Devices list update", data);
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
    this.#panel = undefined;
    this.#modalAnimations = {
      title: undefined,
      artists: undefined,
    };
    this.#modalUpdateSetIntervalID = undefined;
    this.#modalUpdateRate = typeof modalUpdateRate === "number" ? modalUpdateRate : 500;
    this.watcher.on(
      "message",
      (type: string, message: SpotifyWebSocketState | SpotifyWebSocketDevices) => {
        if (["PLAYER_STATE_CHANGED", "DEVICE_STATE_CHANGED"].includes(type))
          this.handlers[type](message);
        else
          logger.warn(
            "[SpotifyModal @ watcher#message",
            "Unknown event type recieved:",
            type,
            message,
          );
      },
    );
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

    if (!this.silent) logger.log("[SpotifyModal @ getClasses] Succeeded");
  }

  public async getPanel(): Promise<void> {
    if (!this.#classes?.panels) await this.getClasses();
    this.#panel = document.body.getElementsByClassName(this.#classes.panels)[0];
    if (!this.#panel) logger.error("[SpotifyModal @ getPanel] Panel not found");
  }

  public async initializeComponents(): Promise<void> {
    if (this.#componentsReady) {
      logger.warn("[SpotifyModal @ initializeComponents] Components already initialized");
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
    this.icons.repeat.onmouseenter = (): void => {
      this.icons.repeat.style.color = "var(--brand-experiment-400)";
    };
    this.icons.repeat.onmouseleave = (): void => {
      this.icons.repeat.style.color =
        this.#status.repeat === "off" ? "var(--text-normal)" : "var(--brand-experiment-500)";
    };
    this.icons.shuffle.onmouseenter = (): void => {
      this.icons.shuffle.style.color = "var(--brand-experiment-400)";
    };
    this.icons.shuffle.onmouseleave = (): void => {
      this.icons.shuffle.style.color = this.#status.shuffle
        ? "var(--brand-experiment-500)"
        : "var(--text-normal)";
    };

    this.#componentsReady = true;
    if (!this.silent) logger.log("[SpotifyModal @ initializeComponents] Succeeded");
  }

  public async injectModal(): Promise<void> {
    if (this.#injected) {
      logger.warn("[SpotifyModal @ injectModal] Already injected");
      return;
    }
    if (!this.#panel) await this.getPanel();
    if (!this.#panel) {
      logger.error("[SpotifyModal @ injectModal] Panel not found");
      return;
    }
    if (!this.#componentsReady) await this.initializeComponents();
    this.components.modal.style.display = "none";
    this.components.dock.style.display = "none";
    this.#panel.insertAdjacentElement("afterbegin", this.components.modal);
    this.components.modal.insertAdjacentElement("afterend", this.components.dock);
    this.#injected = true;
    logger.log("[SpotifyModal @ injectModal] Succeeded");
  }

  public uninjectModal(): void {
    if (!this.#panel) {
      logger.warn("[SpotifyModal @ uninjectModal] Panel not found");
      return;
    }
    if (!this.#injected) {
      logger.warn("[SpotifyModal @ uninjectModal] Already uninjected");
      return;
    }

    if (this.#modalUpdateSetIntervalID) {
      clearInterval(this.#modalUpdateSetIntervalID);
      this.#modalUpdateSetIntervalID = undefined;
    }

    this.#panel.removeChild(this.components.modal);
    this.#panel.removeChild(this.components.dock);
    this.#injected = false;
    logger.log("[SpotifyModal @ uninjectModal] Succeeded");
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

      if (this.components.modal.style.display === "none") this.components.modalAnimations.fadein();
      if (this.components.dock.style.display === "none") this.components.dockAnimations.fadein();

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
        this.#modalAnimations.title = SpotifyModal.getTextScrollingAnimation(this.components.title);
      } else {
        if (this.#modalAnimations.title) {
          this.#modalAnimations.title.cancel();
          this.#modalAnimations.title = undefined;
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
        this.#modalAnimations.artists = SpotifyModal.getTextScrollingAnimation(
          this.components.artists,
        );
      } else {
        if (this.#modalAnimations.artists) {
          this.#modalAnimations.artists.cancel();
          this.#modalAnimations.artists = undefined;
        }
        if (!this.components.artists.className.includes(this.#classes.ellipsis))
          this.components.artists.classList.add(this.#classes.ellipsis);
      }
    }
  }

  public async load(): Promise<void> {
    await this.watcher.load();
    this.watcher.dispatcher.subscribe(
      "SPOTIFY_PLAYER_STATE",
      this.handlers.FLUX_DISPATCHER_PLAYER_STATE_FALLBACK,
    );
    await this.getClasses();
    await this.injectModal();
  }

  public unload(): void {
    this.watcher.unload();
    this.watcher.dispatcher.unsubscribe(
      "SPOTIFY_PLAYER_STATE",
      this.handlers.FLUX_DISPATCHER_PLAYER_STATE_FALLBACK,
    );
    this.uninjectModal();
  }
}
