/* eslint-disable
  @typescript-eslint/naming-convention,
  @typescript-eslint/no-inferrable-types,
  @typescript-eslint/no-floating-promises,
  @typescript-eslint/require-await
*/
import { Logger, webpack } from "replugged";
import { FadeAnimations, SpotifySocket, SpotifySocketModule } from "./types";

export class EventEmitter {
  public readonly name = this.constructor.name;
  public addEventListener = this.on;

  #events: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  #logger = new Logger("SpotifyModal", this.name);

  public static createOnceCallback(
    name: string,
    callback: (...args: unknown[]) => void,
  ): void | ((...args: unknown[]) => void) {
    if (typeof name === "string" && typeof callback === "function") {
      const func = (...args: unknown[]): void => {
        callback(...args);
        this.#events.get(name).delete(func);
      };

      return func;
    }
  }

  public get events(): Map<string, Set<(...args: unknown[]) => void>> {
    return this.#events;
  }

  public async emit(name: string, ...args: unknown[]): Promise<void> {
    if (this.#events.has(name)) {
      const listeners = this.#events.get(name);
      for (const listener of listeners) listener(...args);
    } else this.#logger.log("[@emit]", "No matching listeners for event", name);
  }

  public on(name: string, callback: (...args: unknown[]) => void): void {
    if (typeof name === "string" && typeof callback === "function") {
      if (!this.#events.has(name)) this.#events.set(name, new Set());
      this.#events.get(name).add(callback);
    } else this.#logger.log("[@on]", "Name / callback is of invalid type");
  }

  public once(name: string, callback: (...args: unknown[]) => void): void {
    if (typeof name === "string" && typeof callback === "function") {
      const callbackFn: (...args: unknown[]) => void = EventEmitter.createOnceCallback(
        name,
        callback,
      );
      this.on(name, callbackFn);
    } else this.#logger.log("[@once]", "Name / callback is of invalid type");
  }

  public removeAllListeners(name?: string): boolean {
    if (this.#events.has(name)) return this.#events.delete(name);
    else if (!name) {
      this.#events.clear();
      return true;
    } else return false;
  }
}

export class SpotifyAPI {
  public readonly name = this.constructor.name;

  #account: SpotifySocket;
  #ready: boolean = false;
  #logger = new Logger("SpotifyModal", this.name);

  public constructor(account: SpotifySocket): void {
    if (typeof account?.accountId !== "string" || typeof account?.accessToken !== "string")
      this.#logger.error("[@constructor]", "Invalid account");

    this.#account = account
    this.#ready = typeof this.#account?.accountId === "string" && typeof this.#account?.accessToken === "string";
  }

  public get accountId(): string {
    return this.#account.accountId;
  }

  public get accessToken(): string {
    return this.#account.accessToken;
  }

  public get ready(): boolean {
    return this.#ready;
  }

  public async sendGenericRequest(
    endpoint: string,
    method = "GET",
    query?: Record<string, unknown>,
    body?: string | Record<string, unknown>,
  ): Promise<void | Response> {
    if (!this.#ready) {
      this.#logger.error("[@sendGenericRequest]", "API not ready");
      return;
    }
    if (typeof endpoint !== "string" || !endpoint) {
      this.#logger.error(`[${this.accountId}]`, "Invalid endpoint");
      return;
    }

    let parsedEndpoint = endpoint.replace("/$", "");
    if (!parsedEndpoint.match("^/")) parsedEndpoint = `/${parsedEndpoint}`;
    if (typeof query === "object" && !Array.isArray(query))
      for (const [key, value] of Object.entries(query))
        parsedEndpoint += `${parsedEndpoint.match(/\?/) ? "&" : "?"}${encodeURIComponent(
          key,
        )}=${encodeURIComponent(value)}`;

    return fetch(`https://api.spotify.com/v1${parsedEndpoint}`, {
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      method,
      body,
    });
  }

  public getPlayerState(): Promise<void | Response> {
    return this.sendGenericRequest("/me/player");
  }

  public getDevices(): Promise<void | Response> {
    return this.sendGenericRequest("/me/player/devices");
  }

  public setPlaybackState(state: boolean): Promise<void | Response> {
    return this.sendGenericRequest(`/me/player/${state ? "play" : "pause"}`, "PUT");
  }

  public async setRepeatState(state: "off" | "context" | "track"): Promise<void | Response> {
    if (["off", "context", "track"].includes(state)) return;
    return this.sendGenericRequest("/me/player/repeat", "PUT", { state });
  }

  public setShuffleState(state: boolean): Promise<void | Response> {
    return this.sendGenericRequest("/me/player/shuffle", "PUT", { state });
  }

  public async seekToPos(position_ms: number): Promise<void | Response> {
    if (typeof position_ms === "number")
      return this.sendGenericRequest("/me/player/seek", "PUT", { position_ms });
  }

  public async setPlaybackVolume(volume_percent: number): Promise<void | Response> {
    if (typeof volume_percent === "number" && volume_percent >= 0 && volume_percent <= 100)
      return this.sendGenericRequest("/me/player/volume", "PUT", { volume_percent });
  }

  public skipNext(): Promise<void | Response> {
    return this.sendGenericRequest("/me/player/next", "POST");
  }

  public skipPrevious(): Promise<void | Response> {
    return this.sendGenericRequest("/me/player/previous", "POST");
  }
}

export class SpotifySocketFunctions extends EventEmitter {
  public readonly name = this.constructor.name;

  #account: undefined | SpotifySocket = undefined;
  #accountList: Record<string, SpotifySocket> = {};
  #logger = new Logger("SpotifyModal", this.name);
  #ready = false;
  #store: undefined | SpotifySocketModule = undefined;
  #websocket: undefined | WebSocket = undefined;
  #websocketList: Record<string, WebSocket> = {};

  public constructor() {
    super();
    this.getStore();
  }

  public get userHasSpotifyAccounts(): boolean {
    if (this.#accountList && Object.keys(this.#accountList).length) return true;
    else return false;
  }

  public get account(): void | SpotifySocket {
    return this.#account;
  }

  public get accountList(): Record<string, SpotifySocket> {
    return this.#accountList;
  }

  public get ready(): boolean {
    return this.#ready;
  }

  public get store(): void | SpotifySocketModule {
    return this.#store;
  }

  public get websocket(): void | WebSocket {
    return this.#websocket;
  }

  public get websocketList(): Record<string, WebSocket> {
    return this.#websocketList;
  }

  public async getStore(): Promise<void> {
    this.#store = (await webpack.waitForModule(
      webpack.filters.byProps("getActiveSocketAndDevice"),
    )) as unknown as SpotifySocketModule;
    this.emit("ready");
    this.#ready = true;
  }

  public async getAccounts(): Promise<void | Record<string, SpotifySocket>> {
    if (!this.ready) this.once("ready", () => this.getAccounts());
    else {
      this.#accountList = this.#store.__getLocalVars().accounts;
      return this.#accountList;
    }
  }

  public async getAccount(accountId?: string): Promise<void | SpotifySocket> {
    if (!this.ready) this.once("ready", () => this.getAccount(accountId));
    else {
      this.#accountList = this.#store.__getLocalVars().accounts;
      let account: undefined | SpotifySocket;
      const activeSocketAndDevice = this.#store.getActiveSocketAndDevice();

      if (!accountId && activeSocketAndDevice) {
        this.#account = activeSocketAndDevice.socket;
        return activeSocketAndDevice.socket;
      }

      if (!Object.keys(this.#accountList).length) return;
      else if (accountId in this.#accountList) account = this.#accountList[accountId];
      else if (!accountId) account = Object.values(this.#accountList)[0];

      return (this.#account = account);
    }
  }

  public async getWebSocket(accountId?: string): Promise<void | WebSocket> {
    if (!this.ready) this.once("ready", () => this.getWebSocket(accountId));
    else if (this.#account && !accountId) return this.#account.socket;
    else {
      const activeSocketAndDevice = this.#store.getActiveSocketAndDevice();
      if (!accountId && activeSocketAndDevice) {
        this.#websocket = activeSocketAndDevice.socket.socket;
        return activeSocketAndDevice.socket.socket;
      }

      this.#accountList = this.#store.__getLocalVars().accounts;

      if (Object.keys(this.#accountList).length)
        for (const [id, socket] of Object.entries(this.#accountList))
          this.#websocketList[id] = socket.socket;
      else return;

      if (accountId in this.#websocketList) return this.#websocketList[accountId];
    }
  }

  public async getAllWebSockets(): Promise<void | Record<string, WebSocket>> {
    if (!this.ready) this.once("ready", () => this.getAllWebSockets());
    else {
      this.#accountList = this.#store.__getLocalVars().accounts;

      if (Object.keys(this.#accountList).length)
        for (const [accountId, socket] of Object.entries(this.#accountList))
          this.#websocketList[accountId] = socket.socket;
      else return;

      return this.#websocketList;
    }
  }

  public async getAPI(accountId?: string): void | SpotifyAPI {
    if (!this.ready) return;

    const account = await this.getAccount(accountId);

    if (account) return new SpotifyAPI(account);
    if (this.#account) return new SpotifyAPI(this.#account);
  }
}

export const elementUtilities = {
  /** Common set of static attributes for elements */
  attributes: {
    svg: { viewBox: "0 0 24 24" },
    path: { fill: "currentColor" },
  },
  /** Constructs effects for specified element */
  effects(
    tag: "fade" | "hover" | "scrolling",
    element: HTMLElement | SVGElement,
    props?: {
      hover?: {
        duration?: number;
        onhover: ((mouseEvent: MouseEvent) => void) | string;
        onleave: ((mouseEvent: MouseEvent) => void) | string;
      };
      scrolling?: {
        instant: boolean;
      };
    },
  ): void | FadeAnimations | Animation {
    if (
      ["fade", "hover", "scrolling"].includes(tag) ||
      !(element instanceof HTMLElement || element instanceof SVGElement)
    )
      return;

    if (tag === "fade") {
      return {
        _: {
          display: element.style.display,
          fadein: new Animation(new KeyframeEffect(element, { opacity: [0, 1] }, 700)),
          fadeout: new Animation(new KeyframeEffect(element, { opacity: [1, 0] }, 700)),
        },
        fadein: (): void => {
          if (element.style.display === "none") {
            element.style.display = anim._.display;
            anim._.fadein.play();
          }
        },
        fadeout: (): void => {
          if (element.style.display !== "none") {
            anim._.fadeout.play();
            anim._.fadeout.onfinish = () => {
              element.style.display = "none";
            };
          }
        },
      } as FadeAnimations;
    } else if (tag === "hover") {
      const opts = props?.hover;
      const defaultColor = element.style.color;
      if (typeof opts !== "object" || Array.isArray(opts)) return;

      if (typeof opts?.duration === "number")
        element.style.transitionDuration = `${opts.duration}ms`;

      if (typeof opts?.onhover === "string")
        element.onmouseenter = (): void => {
          element.style.color = opts.onhover;
        };
      else if (typeof opts?.onhover === "function") element.onmouseenter = opts.onhover;

      if (typeof opts?.onleave === "string")
        element.onmouseleave = (): void => {
          element.style.color = opts.onleave;
        };
      else if (typeof opts?.onleave === "function") element.onmouseleave = opts.onleave;
      else
        element.onmouseleave = (): void => {
          element.style.color = defaultColor;
        };
    } else if (tag === "scrolling") {
      const keyframes = [
        [
          { transform: "translateX(0)" },
          { transform: "translateX(0)", offset: 0.2 },
          {
            transform: `translateX(-${element.scrollWidth - element.offsetWidth}px)`,
            offset: 0.8,
          },
          { transform: `translateX(-${element.scrollWidth - element.offsetWidth}px)` },
        ],
        {
          iterations: Infinity,
          duration: (element.scrollWidth - element.offsetWidth) * 50,
          direction: "alternate-reverse",
          easing: "linear",
        },
      ];

      if (!instant) return new Animation(new KeyframeEffect(element, ...keyframes));
      else return element.animate(...keyframes);
    }
  },
  /**
   Constructs a HTMLElement or an SVGElement.
  */
  element(
    tag: string | { name: string; svg?: boolean },
    classes?: string,
    style?: string,
    attributes?: Record<string, string>,
    children?: Array<Node | HTMLElement | SVGElement>,
  ): undefined | HTMLElement | SVGElement {
    if (!tag || (typeof tag !== "string" && typeof tag !== "object") || Array.isArray(tag)) return;

    let element: HTMLElement | SVGElement;

    if (typeof tag === "string")
      element = !["path", "svg"].includes(tag)
        ? document.createElement(tag)
        : document.createElementNS("http://www.w3.org/2000/svg", tag);
    else if (typeof tag === "object" && typeof tag?.name === "string")
      element = tag?.svg
        ? document.createElementNS("http://www.w3.org/2000/svg", tag.name)
        : document.createElement(tag.name);
    else return;

    if (typeof classes === "string") element.classList.add(...classes.split(" "));

    if (typeof style === "string") {
      if (element instanceof HTMLElement) element.setAttribute("style", style);
      else element.setAttributeNS(null, "style", style);
    }

    if (typeof attributes === "object" && !Array.isArray(attributes))
      for (const [key, value] of Object.entries(attributes)) {
        if (element instanceof HTMLElement) element.setAttribute(key, value);
        else element.setAttributeNS(null, key, value);
      }

    if (children.length)
      for (const child of children)
        if (child instanceof Node || child instanceof HTMLElement || child instanceof SVGElement)
          element.appendChild(child);

    return element;
  },
};
