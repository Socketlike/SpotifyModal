/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars */

namespace Spotify {
  interface Account {
    accountId: string;
    accessToken: string;
    backoff: {
      jitter: boolean;
      max: number;
      min: number;
      _callback(...args: unknown[]): unknown;
      _current: number;
      _fails: number;
      current: number;
      fails: number;
      pending: number;
    };
    connectionId: string;
    handleDeviceStateChange(...args: unknown[]): unknown;
    isPremium: boolean;
    pingInterval: {
      _ref: number;
    };
    socket: PluginWS;
    _requestedConnect: boolean;
    _requestedDisconnect: boolean;
    connected: boolean;
  }

  interface User {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }

  interface Album {
    album_type: 'single' | 'album' | 'compilation';
    artists: User[];
    available_markets: string[];
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    images: Array<{
      height: null | number;
      url: string;
      width: null | number;
    }>;
    name: string;
    release_date: null | string;
    release_date_precision: null | string;
    total_tracks: number;
    type: string;
    uri: string;
  }

  interface Track {
    album: null | Album;
    artists: User[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    episode: boolean;
    explicit: boolean;
    external_ids: null | {
      isrc: string;
      ean?: string;
      upc?: string;
    };
    external_urls: null | {
      spotify: string;
    };
    href: string;
    id: string;
    is_local: boolean;
    name: string;
    popularity: number;
    preview_url: null | string;
    track: boolean;
    track_number: number;
    type: string;
    uri: string;
  }

  interface Device {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: 'Computer' | 'Smartphone' | 'Speaker';
    volume_percent: number;
  }

  interface State {
    actions: {
      disallows: Record<string, boolean>;
    };
    context: null | {
      collaborative: boolean;
      description: string;
      external_urls: {
        spotify: string;
      };
      followers: {
        href: null;
        total: number;
      };
      href: string;
      id: string;
      images: Array<{
        height: number | null;
        url: string;
        width: number | null;
      }>;
      name: string;
      owner: User;
      primary_color: null;
      public: boolean;
      snapshot_id: string;
      tracks: {
        href: string;
        items: Array<{
          added_at: string;
          added_by: User;
          is_local: boolean;
          primary_color: null;
          track: Track;
          video_thumbnail: {
            uri: string | null;
          };
        }>;
      };
      type: string;
      uri: string;
    };
    currently_playing_type: string;
    device: Device;
    is_playing: boolean;
    item: Track;
    progress_ms: number;
    repeat_state: 'off' | 'context' | 'track';
    shuffle_state: boolean;
    timestamp: number;
  }

  interface WSRawParsed {
    payloads:
      | undefined
      | Array<{
          events: Array<{
            event: {
              state?: State;
              devices?: Devices;
            };
            type: 'PLAYER_STATE_CHANGED' | 'DEVICE_STATE_CHANGED';
          }>;
        }>;
    type: undefined | 'message' | 'pong';
  }

  interface Store {
    getActiveSocketAndDevice():
      | undefined
      | {
          socket: Account;
          device: Device;
        };
    __getLocalVars(): {
      AUTO_PAUSE_TIMEOUT: 30000;
      DEVICE_STATE_CHANGE_THROTTLE: 3000;
      MAXIMUM_ARTISTS: 5;
      MAXIMUM_BACKOFF: 30000;
      MAXIMUM_START_TIME_DIFFERENCE: 1500;
      PING_INTERVAL: 30000;
      PLATFORM: {
        color: 'var(--spotify)';
        enabled: boolean;
        getPlatformUserUrl(...args: unknown[]): unknown;
        icon: {
          darkPNG: string;
          darkSVG: string;
          lightPNG: string;
          lightSVG: string;
          whitePNG: string;
          whiteSVG: string;
        };
        name: 'Spotify';
        type: 'Spotify';
      };
      RICH_PRESENCE_MAX_LENGTH: 128;
      SPEAKING_AUTO_PAUSE_GAP_TIMEOUT: 100;
      SPOTIFY_CONNECTION_URI_PREFIX: 'hm://pusher/v1/connections/';
      SPOTIFY_DEVICE_COMPUTER_TYPE: 'Computer';
      SPOTIFY_SOCKET_URL_PREFIX: 'wss://dealer.spotify.com/?access_token=';
      SYNCING_HOST_TIMEOUT: 300000;
      SpotifyAlbumTypes: {
        SINGLE: 'single';
      };
      SpotifyDataTypes: {
        MESSAGE: 'message';
        PING: 'ping';
        PONG: 'pong';
      };
      SpotifyEventTypes: {
        PLAYER_STATE_CHANGED: 'PLAYER_STATE_CHANGED';
        DEVICE_STATE_CHANGED: 'DEVICE_STATE_CHANGED';
      };
      TRACK_UPDATE_TIMEOUT: 5000;
      accounts: Record<string, Account>;
      lastPlayedTrackId: string | undefined;
      logger: {
        error(...data: unknown[]): void;
        info(...data: unknown[]): void;
        log(...data: unknown[]): void;
        name: 'Spotify';
        time(...data: unknown[]): void;
        trace(...data: unknown[]): void;
        verbose(...data: unknown[]): void;
        warn(...data: unknown[]): void;
      };
      pinnedState: unknown;
      playerDevices: Record<string, Device[]>;
      playerStates: Record<string, unknown | null>;
      speakingAutoPause: Record<string, never>;
      speakingAutoPauseGap: {
        _ref: null;
      };
      store: Store;
      streamingAutoPause: null;
      syncingHostTimeout: Record<string, never>;
      syncingWith: undefined;
      trackSyncUpdateTimeout: Record<string, never>;
      trackUpdateTimeout: {
        _ref: null;
      };
      wasAutoPaused: boolean;
    };
    wasAutoPaused(): boolean;
  }
}

namespace SpotifyModal {
  interface PluginWS extends WebSocket {
    account: Account;
  }
}

declare const DiscordNative: {
  clipboard: {
    copy: (content: string) => void;
  };
};
