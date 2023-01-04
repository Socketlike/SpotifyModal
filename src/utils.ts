import { webpack, common, logger } from "replugged";

const packageName = "SpotifyModal";

export const log = {
  log: (name: string, ...data: unknown): void => logger.log(name, packageName, undefined, ...data),
  warn: (name: string, ...data: unknown): void => logger.warn(name, packageName, undefined, ...data),
  error: (name: string, ...data: unknown): void => logger.error(name, packageName, undefined, ...data),
}

export async function getSpotifySocket(accountId?: string): void | WebSocket {
  const store = await webpack.waitForModule(webpack.filters.byProps("getActiveSocketAndDevice"));

  // Method I: Get from .getActiveSocketAndDevice
  let activeSocketAndDevice = store.getActiveSocketAndDevice();
  if (activeSocketAndDevice && activeSocketAndDevice.socket.accountId === accountId)
    return activeSocketAndDevice.socket.socket;

  // Method II: Get from .__getLocalVars().accounts[accountId]
  const accounts = store.__getLocalVars().accounts;
  if (accountId in accounts)
    return accounts[accountId].socket;

  // Method III: Get without accountId through both getActiveSocketAndDevice & accounts
  // (bruteforcing --- may cause inaccuracy with accountId if accountId is provided)
  activeSocketAndDevice = store.getActiveSocketAndDevice();
  if (activeSocketAndDevice)
    return activeSocketAndDevice.socket.socket;
  return Object.values(accounts).length ? Object.values(accounts)[0].socket : undefined;
}

export class EventEmitter {
  public _events: Record<string, ((...args: unknown) => unknown) | Set<((...args: unknown) => unknown)>>;

  constructor() {
    this._events = {};
  }

  #fixSets(): void {
    Object.entries(this._events).forEach(([key, value]: [string, unknown]): void => {
      if (value?.constructor?.name === "Set" && value?.length === 1)
        this._events[key] = [...value.values()][0];
      if (value?.constructor?.name === "Set" && !value?.length)
        delete this._events[key];
    });
  }

  on(name: string, callback: (...args: unknown) => unknown): void {
    if (typeof name !== "string" || typeof callback !== "function")
      return;
    if (typeof this._events[name] === "function") {
      this._events[name] = new Set([this._events[name]]);
      this._events[name].add(callback);
    } else
      this._events[name] = callback;
  }

  once(name: string, callback: (...args: unknown) => unknown): void {
    if (typeof name !== "string" || typeof callback !== "function")
      return;
    const replacedFunction = (...args: unknown): void => {
      callback(...args);
      if (this._events[name]?.constructor?.name === "Set") {
        this._events[name].delete(replacedFunction);
        this.#fixSets();
      } else
        delete this._events[name];
    }
    if (typeof this._events[name] === "function") {
      this._events[name] = new Set([this._events[name]]);
      this._events[name].add(replacedFunction);
    } else
      this._events[name] = replacedFunction;
  }

  removeAllListeners(name?: string): void {
    if (typeof name === "string" && name in this._events)
      delete this._events[name];
    else this._events = {};
  }

  emit(name: string, ...data?: unknown) {
    if (name in this._events) {
      const eventListeners = this._events[name];
      if (typeof eventListeners === "function")
        eventListeners(...data);
      else {
        eventListeners.forEach((func: (...args: unknown) => unknown): void => {
          func(...data);
        });
      }
    }
  }
}

export class SpotifyWatcher extends EventEmitter {
  public accountId: string;
  public dispatcher: unknown;
  #devices: unknown;
  #state: unknown;
  public socket: {
    accountId: string;
    ws: undefined | WebSocket;
  };
  public handlers: {
    SPOTIFY_UPDATE: (data: { accountId: string }) => void;
    SPOTIFY_WEBSOCKET_MESSAGE: (data: unknown) => void;
  };
  #registered: boolean;

  constructor() {
    super();
    this.accountId = "";
    this.dispatcher = undefined;
    this.#devices = undefined;
    this.#state = undefined;
    this.socket = {
      accountId: "",
      ws: undefined,
    };
    this.handlers = {
      SPOTIFY_UPDATE: (data: { accountId: string }): void => {
        const functionName = "SPOTIFY_UPDATE";

        if (!this.accountId)
          this.accountId = data.accountId;
        if (this.accountId !== data.accountId) {
          log.error(`${this.constructor.name}@${functionName}`, "New account ID", `(${data.accountId})`, "differs from registered account ID", `(${this.accountId}),`, "change ignored");
          return;
        }

        this.emit("update", data.accountId, this.accountId);
        this.#afterSpotifyUpdate();
      },
      SPOTIFY_WEBSOCKET_MESSAGE: (message: { data: string }): void => {
        const data = JSON.parse(message.data);
        console.log(data);
        if (data?.type && data?.payloads && data.type !== "pong") {
          if (data.payloads[0].events[0].type === "PLAYER_STATE_CHANGED")
            this.#state = data.payloads[0].events[0].event.state;
          else if (data.payloads[0].events[0].type === "DEVICE_STATE_CHANGED")
            this.#devices = data.payloads[0].events.event.devices;
          this.emit("message", data.payloads[0].events[0].type, data.payloads[0].events[0].type === "PLAYER_STATE_CHANGED" ? this.#state : this.#devices);
        }
      },
    }
    this.#registered = false;
  }

  get registered(): boolean {
    return this.#registered;
  }

  get state(): unknown {
    return this.#state;
  }

  get devices(): unknown {
    return this.#devices;
  }

  async #afterSpotifyUpdate(): Promise<void> {
    this.store = await webpack.waitForModule(webpack.filters.byProps("getActiveSocketAndDevice"));

    if (this.socket.ws && this.socket.accountId !== this.accountId)
      this.socket.ws.removeEventListener("message", this.handlers.SPOTIFY_WEBSOCKET_MESSAGE);
    else if (this.socket.ws && this.socket.accountId === this.accountId)
      return;

    this.socket.accountId = this.accountId;
    this.socket.ws = await getSpotifySocket(this.accountId);
    if (this?.socket?.ws) {
      this.socket.ws.addEventListener("message", this.handlers.SPOTIFY_WEBSOCKET_MESSAGE);
      this.emit("websocket", this.socket.ws);
    } else this.emit("error", "websocket");
  }

  removeSocketEvent(): void {
    if (!this.socket.ws)
      return;
    this.socket.ws.removeEventListener("message", this.handlers.SPOTIFY_WEBSOCKET_MESSAGE);
  }

  async registerFlux(): Promise<void> {
    const functionName = "registerFlux";
    if (common?.fluxDispatcher)
      this.dispatcher = common.fluxDispatcher;
    else
      this.dispatcher = await webpack.waitForModule(webpack.filters.byProps("_subscriptions", "subscribe", "unsubscribe"));

    if (!this.dispatcher) {
      log.error(`${this.constructor.name}@${functionName}`, "FluxDispatcher not found");
      return;
    }

    if (this.registered) {
      log.warn(`${this.constructor.name}@${functionName}`, "Already registered");
      return;
    }

    this.dispatcher.subscribe("SPOTIFY_PROFILE_UPDATE", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_SET_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_ACCOUNT_ACCESS_TOKEN", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_SET_ACTIVE_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.subscribe("SPOTIFY_PLAYER_STATE", this.handlers.SPOTIFY_UPDATE);
    this.#registered = true;
    this.emit("registered");
  }

  removeFlux(): void {
    const functionName = "removeFlux";
    if (!this.dispatcher || !this.registered) {
      log.error(`${this.constructor.name}@${functionName}`, "Already removed");
      return;
    }

    this.dispatcher.unsubscribe("SPOTIFY_PROFILE_UPDATE", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_SET_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_ACCOUNT_ACCESS_TOKEN", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_SET_ACTIVE_DEVICES", this.handlers.SPOTIFY_UPDATE);
    this.dispatcher.unsubscribe("SPOTIFY_PLAYER_STATE", this.handlers.SPOTIFY_UPDATE);
    this.#registered = false;
    this.emit("unregistered");
  }
}