/* eslint-disable
    no-undefined,
    @typescript-eslint/no-floating-promises,
    @typescript-eslint/require-await,
    @typescript-eslint/naming-convention
*/

import {
  SpotifyDevice,
  SpotifyWebSocketMessage,
  SpotifyMinifiedWebSocketMessage,
  SpotifySocket,
} from "./types";
import {
  _dockIconsElement,
  _metadataElement,
  _playbackTimeDisplayElement,
  _timebarElement,
  artistsElement,
  coverArtElement,
  dockAnimations,
  dockElement,
  modalAnimations,
  modalElement,
  parseArtists,
  playbackTimeCurrentElement,
  playbackTimeDurationElement,
  timebarInnerElement,
  titleElement,
} from "./modal";
import {
  pausePath,
  playPath,
  playPauseIcon,
  repeatAllPath,
  repeatIcon,
  repeatIconTitle,
  repeatOnePath,
  shuffleIcon,
  shuffleIconTitle,
  skipNextIcon,
  skipPreviousIcon,
} from "./icons";

export const controls: {
  sendSpotifyAPI: (endpoint: string, data?: string, method?: string) => Promise<void | Promise> | void;
  seekToPosition: (position: number) => Promise<void | Response>;
  setPlaybackVolume: (volume: number) => Promise<void | Response>;
  setRepeatState: (state: string) => Promise<void | Response>;
  skipToPreviousOrNext: (next?: boolean) => Promise<void | Response>;
  togglePlaybackState: () => Promise<void | Response>;
  togglePlaybackShuffle: () => Promise<void | Response>;
} = {
};

export class ModalManager {
  public accounts: string[];
  public classes: Record<string, string>;
  public modalInjected: boolean;
  public modalAnimations: {
    artistsElement: undefined | Animation;
    titleElement: undefined | Animation;
  };
  public panel: Element;
  public playerState: {
    isActive: boolean;
    isPlaying: boolean;
    accountId: string;
    shuffleOn: boolean;
    repeatMode: string;
    trackState: {
      progress: number;
      duration: number;
      albumUrl: string;
    };
  };
  public spotifySocket: undefined | SpotifySocket;
  public spotifyWebSocketMessageHandler: () => void;
  public timebarUpdateIntervalId: undefined | number;
  public timebarUpdateHandler: () => Promise<void>;
  public timebarUpdateRate: number;
  public websocketEventRegistered: boolean;

  public constructor(spotifySocket?: SpotifySocket, timebarUpdateRate: number) {
    this.accounts = [];
    this.classes = {};

    this.modalInjected = false;
    this.modalAnimations = {
      artistsElement: undefined,
      titleElement: undefined,
    };

    // @ts-expect-error - When panel is falsy it gets catched so it doesn't matter
    this.panel = undefined;
    this.playerState = {
      isActive: false,
      isPlaying: false,
      accountId: "",
      shuffleOn: false,
      repeatMode: "off",
      trackState: {
        progress: 0,
        duration: 0,
        albumUrl: "",
      },
    };

    this.spotifySocket = spotifySocket;
    this.spotifyWebSocketMessageHandler = (message): void => {
      this.handleSpotifyWebSocketMessage(JSON.parse(message.data));
    };

    this.timebarUpdateIntervalId = undefined;
    // This is only an arrow function because it needs to stay in this context
    this.timebarUpdateHandler = async (): Promise<void> => {
      if (!this.playerState.isPlaying || !this.playerState.isActive) {
        clearInterval(this.timebarUpdateIntervalId);
        this.timebarUpdateIntervalId = undefined;
        playbackTimeCurrentElement.innerText = playbackTimeCurrentElement.innerText || "0:00";
        return;
      }
      this.playerState.trackState.passed += timebarUpdateRate;
      if (parseTime(this.playerState.trackState.passed) !== playbackTimeCurrentElement.innerText)
        playbackTimeCurrentElement.innerText = parseTime(this.playerState.trackState.passed);
      timebarInnerElement.style.width = `${(
        (this.playerState.trackState.passed / this.playerState.trackState.duration) *
        100
      ).toFixed(4)}%`;
    };
    this.timebarUpdateRate = timebarUpdateRate;

    this.websocketEventRegistered = false;
  }

  public static minifySocketMessage(
    message: SpotifyWebSocketMessage,
  ): SpotifyMinifiedWebSocketMessage {
    if (!message) return { type: "unknown", state: undefined };
    const res: SpotifyMinifiedWebSocketMessage = {};
    res.type = message.type || "unknown";
    if (message.type !== "pong") {
      res.eventType = message.payloads[0].events[0].type;
      res.user = message.payloads[0].events[0].user.id;
      if (res.eventType === "PLAYER_STATE_CHANGED") {
        res.state = message.payloads[0].events[0].event.state;
      } else if (res.eventType === "DEVICE_STATE_CHANGED")
        res.device = message.payloads[0].events[0].event.devices;
    }

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

    this.classes = {
      activityName: this.classes.activityName || activityClasses.activityName,
      anchor: this.classes.anchor || anchorClasses.anchor,
      anchorUnderlineOnHover:
        this.classes.anchorUnderlineOnHover || anchorClasses.anchorUnderlineOnHover,
      bodyLink: this.classes.bodyLink || activityClasses.bodyLink,
      container: this.classes.container || containerClasses.container,
      defaultColor: this.classes.defaultColor || colorClasses.defaultColor,
      ellipsis: this.classes.ellipsis || activityClasses.ellipsis,
      nameNormal: this.classes.nameNormal || activityClasses.nameNormal,
      panels: this.classes.panels || panelClasses.panels,
      "text-sm/semibold": this.classes["text-sm/semibold"] || colorClasses["text-sm/semibold"],
    };
  }

  public async injectModal(): Promise<void> {
    if (this.modalInjected) {
      logger.warn("ModalManager#injectModal", "SpotifyModal", undefined, "Already injected");
      return;
    }

    if (Object.keys(this.classes).length === 0) await this.getClasses();

    if (!this.classes.panels) {
      logger.error("ModalManager#injectModal", "SpotifyModal", undefined, "Panel class not found");
      this.getClasses();
      return;
    }

    if (!this.classes.container) {
      logger.error(
        "ModalManager#injectModal",
        "SpotifyModal",
        undefined,
        "Container class not found",
      );
      this.getClasses();
      return;
    }

    this.panel = document.getElementsByClassName(this.classes.panels)[0];
    if (!this.panel) {
      logger.error("ModalManager#injectModal", "SpotifyModal", undefined, "Panel not found");
      return;
    }

    if (!modalElement.className.includes(this.classes.container))
      modalElement.classList.add(this.classes.container);
    if (!titleElement.className.includes(this.classes.anchor))
      titleElement.classList.add(
        this.classes.anchor,
        this.classes.anchorUnderlineOnHover,
        this.classes.defaultColor,
        this.classes["text-sm/semibold"],
        ...this.classes.nameNormal.split(" ").filter((classes) => !classes.match(/^ellipsis/)),
      );
    if (!coverArtElement.onclick)
      coverArtElement.onclick = () => {
        if (!this.playerState.trackState.albumUrl) return;
        window.open(this.playerState.trackState.albumUrl, "_blank");
      };

    // @ts-expect-error - "afterBegin" is a valid argument for InsertPosition
    this.panel.insertAdjacentElement("afterBegin", modalElement);
    // @ts-expect-error - "afterEnd" is a valid argument for InsertPosition
    modalElement.insertAdjacentElement("afterEnd", dockElement);

    this.modalInjected = true;
    logger.log("ModalManager#injectModal", "SpotifyModal", undefined, "Modal injected");
  }

  public uninjectModal(): void {
    if (!this.modalInjected) {
      logger.warn("ModalManager#uninjectModal", "SpotifyModal", undefined, "Already uninjected");
      return;
    }

    this.panel.removeChild(modalElement);
    this.panel.removeChild(dockElement);
    this.modalInjected = false;
    logger.log("ModalManager#uninjectModal", "SpotifyModal", undefined, "Modal uninjected");
  }

  public async updateModal(data: SpotifyMinifiedWebSocketMessage): Promise<void> {
    if (data.state.is_playing || data.state.item) {
      if (typeof this.timebarUpdateIntervalId !== "number")
        // @ts-expect-error - setInterval returns a number
        this.timebarUpdateIntervalId = setInterval(
          this.timebarUpdateHandler,
          this.timebarUpdateRate,
        );

      repeatIcon.style.color =
        this.playerState.repeatMode !== "off"
          ? "var(--brand-experiment-500)"
          : "var(--text-normal)";
      repeatIcon.replaceChild(
        res.repeat_state === "off" || res.repeat_state === "context"
          ? repeatAllPath
          : repeatOnePath,
        repeatIcon.children[1],
      );
      repeatIconTitle.replaceChildren(
        document.createTextNode(`Repeat ${this.playerState.repeatMode}`),
      );

      shuffleIcon.style.color = this.playerState.shuffleOn
        ? "var(--brand-experiment-500)"
        : "var(--text-normal)";
      shuffleIconTitle.replaceChildren(
        document.createTextNode(`Shuffle ${this.playerState.shuffleOn ? "on" : "off"}`),
      );

      if (modalElement.style.display === "none") modalAnimations.fadein();
      if (dockElement.style.display === "none") dockAnimations.fadein();

      artistsElement.replaceChildren(
        ...parseArtists(
          data.item,
          `${this.classes.anchor} ` +
            `${this.classes.anchorUnderlineOnHover} ` +
            `${this.classes.bodyLink} ` +
            `${this.classes.ellipsis}`,
        ),
      );

      titleElement.innerText = typeof data?.track?.name === "string" ? data.track.name : "Unknown";
      titleElement.title = typeof data?.track?.name === "string" ? data.track.name : "Unknown";

      if (data.item.is_local) {
        titleElement.href = "";
        titleElement.style.textDecoration = "none";
        titleElement.style.cursor = "default";
        coverArtElement.src = "";
        coverArtElement.title = data.item?.album?.name || "Unknown";
        coverArtElement.style.cursor = "";
      } else {
        titleElement.href = `https://open.spotify.com/track/${data.item.id}`;
        titleElement.style.textDecoration = "";
        titleElement.sytle.cursor = "";
        coverArtElement.src = data.item.album.images[0].url;
        coverArtElement.title = data.item.album.name;
        coverArtElement.style.cursor = "pointer";
      }

      if (
        super.parseTime(this.playerState.trackState.duration) !==
        playbackTimeDurationElement.innerText
      )
        playbackTimeDurationElement.innerText = super.parseTime(
          this.playerState.trackState.duration,
        );

      playPauseIcon.replaceChildren(this.playerState.isPlaying ? pausePath : playPath);

      if (titleElement.scrollWidth > titleElement.offsetWidth + 20) {
        if (this.modalAnimations.titleElement) this.modalAnimations.titleElement.cancel();
        if (titleElement.className.includes(this.classes.ellipsis))
          titleElement.classList.remove(this.classes.ellipsis);
        this.modalAnimations.titleElement = titleElement.animate(
          [
            { transform: "translateX(0)" },
            {
              transform: `translateX(-${titleElement.scrollWidth - titleElement.offsetWidth}px)`,
            },
          ],
          {
            iterations: Infinity,
            duration: (titleElement.scrollWidth - titleElement.offsetWidth) * 50,
            direction: "alternate-reverse",
            easing: "linear",
          },
        );
      } else {
        if (this.modalAnimations.titleElement) {
          this.modalAnimations.titleElement.cancel();
          this.modalAnimations.titleElement = undefined;
        }
        if (!titleElement.className.includes(this.classes.ellipsis))
          titleElement.classList.add(this.classes.ellipsis);
      }

      if (artistsElement.scrollWidth > artistsElement.offsetWidth + 20) {
        if (this.modalAnimations.artistsElement) this.modalAnimations.artistsElement.cancel();
        if (artistsElement.className.includes(this.classes.ellipsis))
          artistsElement.classList.remove(this.classes.ellipsis);
        this.modalAnimations.artistsElement = artistsElement.animate(
          [
            { transform: "translateX(0)" },
            {
              transform: `translateX(-${
                artistsElement.scrollWidth - artistsElement.offsetWidth
              }px)`,
            },
          ],
          {
            iterations: Infinity,
            duration: (artistsElement.scrollWidth - artistsElement.offsetWidth) * 50,
            direction: "alternate-reverse",
            easing: "linear",
          },
        );
      } else {
        if (this.modalAnimations.artistsElement) {
          this.modalAnimations.artistsElement.cancel();
          this.modalAnimations.artistsElement = undefined;
        }
        if (!artistsElement.className.includes(this.classes.ellipsis))
          artistsElement.classList.add(this.classes.ellipsis);
      }
    } else {
      if (!this.playerState.isActive) {
        if (this.modalAnimations.titleElement) {
          this.modalAnimations.titleElement.cancel();
          this.modalAnimations.titleElement = undefined;
        }

        if (this.modalAnimations.artistsElement) {
          this.modalAnimations.artistsElement.cancel();
          this.modalAnimations.artistsElement = undefined;
        }

        if (modalElement.style.display !== "none") modalAnimations.fadeout();
        if (dockElement.style.display !== "none") dockAnimations.fadeout();
      }
    }
  }

  public async handleSpotifyWebSocketMessage(data: SpotifyWebSocketMessage): Promise<void> {
    if (!this.modalInjected) this.injectModal();
    if (data.type === "pong") return;

    const minifiedData = super.minifySocketMessage(data);
    if (minifiedData.eventType === "DEVICE_STATE_CHANGED") {
      if (!minifiedData.devices.some((device: SpotifyDevice): boolean => device.is_active)) {
        logger.log(
          "ModalManager#handleSpotifyWebSocketMessage",
          "SpotifyModal",
          undefined,
          "State updated: Not playing, closed",
        );
        this.playerState.accountId = "";
        this.playerState.isActive = false;
        this.playerState.isPlaying = false;
      } else this.playerState.isActive = true;
      return;
    }

    if (!this.playerState.accountId) this.playerState.accountId = minifiedData.user;
    this.playerState.isPlaying = minifiedData.state.is_playing;

    if (this.playerState.accountId !== minifiedData.user) {
      logger.warn(
        "ModalManager#handleSpotifyWebSocketMessage",
        "SpotifyModal",
        undefined,
        "New state's account ID differs from current account ID. State change will be ignored.",
      );
      return;
    }

    if (this.playerState.isPlaying) {
      logger.log(
        "ModalManager#handleSpotifyWebSocketMessage",
        "SpotifyModal",
        undefined,
        "State updated: Playing",
        data,
      );

      if (!minifiedData.state.item) {
        logger.warn(
          "ModalManager#handleSpotifyWebSocketMessage",
          "SpotifyModal",
          undefined,
          "State is missing the track property!",
        );
        return;
      }

      this.playerState.trackState.duration = minifiedData.state.item.duration_ms;
      this.playerState.trackState.progress = minifiedData.state.progress_ms;
      this.playerState.trackState.albumUrl = minifiedData.state.item.is_local
        ? ""
        : `https://open.spotify.com/album/${minifiedData.state.item.album.id}`;
      this.playerState.repeatMode = minifiedData.state.repeat_state;
      this.playerState.shuffleOn = minifiedData.state.shuffle_state;
    } else {
      logger.log(
        "ModalManager#handleSpotifyStateChange",
        "SpotifyModal",
        undefined,
        `State updated: Not playing, paused`,
        minifiedData,
      );
    }

    this.updateModal(minifiedData);
  }

  public registerWebSocketEventListener(): void {
    if (!this.spotifySocket)
      logger.error(
        "ModalManager#registerWebSocketEventListener",
        "SpotifyModal",
        undefined,
        "Spotify socket not found",
      );
    else if (this.websocketEventRegistered)
      logger.warn(
        "ModalManager#registerWebSocketEventListener",
        "SpotifyModal",
        undefined,
        "Already registered",
      );
    else {
      if (Object.keys(spotifySocket.__getLocalVars()?.accounts).length === 0) {
        logger.error(
          "ModalManager#registerWebSocketEventListener",
          "SpotifyModal",
          undefined,
          "User has no Spotify accounts",
        );
        return;
      }

      this.accounts = Object.keys(spotifySocket.__getLocalVars()?.accounts);
      if (this.accounts.length > 1)
        logger.log(
          "ModalManager#registerWebSocketEventListener",
          "SpotifyModal",
          undefined,
          "User has more than 1 account connected, using the first one in the list:",
          accounts[0],
        );

      if (!spotifySocket.__getLocalVars().accounts[this.accounts[0]]?.socket?.socket) {
        logger.error(
          "ModalManager#registerWebSocketEventListener",
          "SpotifyModal",
          undefined,
          "Spotify WebSocket not found",
        );
        return;
      }

      spotifySocket
        .__getLocalVars()
        .accounts[this.accounts[0]].socket.socket.addEventListener(
          "message",
          this.handleSpotifyWebSocketMessage,
        );

      logger.log(
        "ModalManager#registerWebSocketEventListener",
        "SpotifyModal",
        undefined,
        "Registered WebSocket event listener",
      );
      this.websocketEventRegistered = true;
    }
  }

  public unregisterWebSocketEventListener(): void {
    if (!this.spotifySocket)
      logger.warn(
        "ModalManager#unregisterWebSocketEventListener",
        "SpotifyModal",
        undefined,
        "Spotify socket not found",
      );
    else if (!this.websocketEventRegistered)
      logger.warn(
        "ModalManager#unregisterWebSocketEventListener",
        "SpotifyModal",
        undefined,
        "Already unregistered",
      );
    else {
      this.spotifySocket
        .__getLocalVars()
        .accounts[this.accounts[0]].socket.socket.removeEventListener(
          "message",
          this.spotifyWebSocketMessageHandler,
        );
      logger.log(
        "ModalManager#unregisterWebSocketEventListener",
        "SpotifyModal",
        undefined,
        "Unregistered WebSocket event listener",
      );
    }
  }
}
