/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any */

interface ControlContextInterface {
  modify: {
    playing: (newPlaying: boolean | ((previousPlaying: boolean) => boolean)) => void;
    repeat: (
      newRepeat:
        | 'off'
        | 'context'
        | 'track'
        | ((previousRepeat: 'off' | 'context' | 'track') => 'off' | 'context' | 'track'),
    ) => void;
    shuffle: (newShuffle: boolean | ((previousShuffle: boolean) => boolean)) => void;
  };
  on: {
    playPauseClick: (mouseEvent: React.MouseEvent, currentState: boolean) => void;
    repeatClick: (mouseEvent: React.MouseEvent, currentState: 'off' | 'context' | 'track') => void;
    shuffleClick: (mouseEvent: React.MouseEvent, currentState: boolean) => void;
    skipNextClick: (mouseEvent: React.MouseEvent) => void;
    skipPrevClick: (mouseEvent: React.MouseEvent) => void;
  };
  playing: boolean;
  repeat: 'off' | 'context' | 'track';
  shuffle: boolean;
  shouldShow: boolean;
}

interface ProgressContextInterface {
  duration: number;
  modifyProgress: (newProgress: number | ((previousProgress: number) => number)) => void;
  onProgressModified: (newProgress: number) => void;
  playing: boolean;
  progress: number;
}

export interface SpotifySocket {
  accountId: string;
  accessToken: string;
  backoff: {
    jitter: boolean;
    max: number;
    min: number;
    _callback: (...args: unknown[]) => unknown;
    _current: number;
    _fails: number;
    current: number;
    fails: number;
    pending: number;
  };
  connectionId: string;
  handleDeviceStateChange: (...args: unknown[]) => unknown;
  isPremium: boolean;
  pingInterval: {
    _ref: number;
  };
  socket: WebSocket;
  _requestedConnect: boolean;
  _requestedDisconnect: boolean;
  connected: boolean;
}

export interface SpotifyUser {
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface SpotifyAlbum {
  album_type: 'single' | 'album';
  artists: SpotifyUser[];
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

export interface SpotifyTrack {
  album: null | SpotifyAlbum;
  artists: SpotifyUser[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  episode: boolean;
  explicit: boolean;
  external_ids: null | {
    isrc: string;
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

export type SpotifyStateContext = null | {
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
  owner: SpotifyUser;
  primary_color: null;
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    items: Array<{
      added_at: string;
      added_by: SpotifyUser;
      is_local: boolean;
      primary_color: null;
      track: SpotifyTrack;
      video_thumbnail: {
        uri: string | null;
      };
    }>;
  };
  type: string;
  uri: string;
};

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: 'Computer' | 'Smartphone' | 'Speaker';
  volume_percent: number;
}

export interface SpotifyWebSocketState {
  actions: {
    disallows: Record<string, boolean>;
  };
  context: SpotifyStateContext;
  currently_playing_type: string;
  device: SpotifyDevice;
  is_playing: boolean;
  item: SpotifyTrack;
  progress_ms: number;
  repeat_state: 'off' | 'context' | 'track';
  shuffle_state: boolean;
  timestamp: number;
}

export interface SpotifyWebSocketRawParsedMessage {
  payloads:
    | undefined
    | Array<{
        events: Array<{
          event: {
            state: undefined | SpotifyWebSocketState;
            devices: undefined | SpotifyWebSocketDevices;
          };
          type: 'PLAYER_STATE_CHANGED' | 'DEVICE_STATE_CHANGED';
        }>;
      }>;
  type: undefined | 'message' | 'pong';
}

export type SpotifyWebSocketDevices = SpotifyDevice[];

export interface SpotifyStore {
  getActiveSocketAndDevice: () =>
    | undefined
    | {
        socket: SpotifySocket;
        device: SpotifyDevice;
      };
  __getLocalVars: () => {
    AUTO_PAUSE_TIMEOUT: 30000;
    DEVICE_STATE_CHANGE_THROTTLE: 3000;
    MAXIMUM_ARTISTS: 5;
    MAXIMUM_BACKOFF: 30000;
    MAXIMUM_START_TIME_DIFFERENCE: 1500;
    PING_INTERVAL: 30000;
    PLATFORM: {
      color: 'var(--spotify)';
      enabled: boolean;
      getPlatformUserUrl: (...args: unknown[]) => unknown;
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
    accounts: Record<string, SpotifySocket>;
    lastPlayedTrackId: string | undefined;
    logger: {
      error: (...data: unknown[]) => void;
      info: (...data: unknown[]) => void;
      log: (...data: unknown[]) => void;
      name: 'Spotify';
      time: (...data: unknown[]) => void;
      trace: (...data: unknown[]) => void;
      verbose: (...data: unknown[]) => void;
      warn: (...data: unknown[]) => void;
    };
    pinnedState: SpotifyFluxDispatcherState | undefined;
    playerDevices: Record<string, SpotifyDevice[]>;
    playerStates: Record<string, SpotifyFluxDispatcherState | null>;
    speakingAutoPause: Record<string, never>;
    speakingAutoPauseGap: {
      _ref: null;
    };
    store: SpotifySocketModule;
    streamingAutoPause: null;
    syncingHostTimeout: Record<string, never>;
    syncingWith: undefined;
    trackSyncUpdateTimeout: Record<string, never>;
    trackUpdateTimeout: {
      _ref: null;
    };
    wasAutoPaused: boolean;
  };
}
