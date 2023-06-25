/* eslint-disable @typescript-eslint/naming-convention */

export interface Socket {
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

export interface Payload {
  events: Array<{
    event: {
      state?: SpotifyApi.CurrentPlaybackResponse;
      devices?: SpotifyApi.UserDevice[];
    };
    type: 'PLAYER_STATE_CHANGED' | 'DEVICE_STATE_CHANGED';
  }>;
}

export interface WSRawData {
  payloads?: Payload[];
  type?: 'message' | 'pong';
}

export interface StoreVariables {
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
  accounts: Record<string, Socket>;
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
  playerDevices: Record<string, SpotifyApi.UserDevice[]>;
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
}

export interface Store {
  getActiveSocketAndDevice?(): {
    socket: Socket;
    device: SpotifyApi.UserDevice;
  };
  __getLocalVars(): StoreVariables;
  wasAutoPaused(): boolean;
}

export interface PluginWS extends WebSocket {
  account: Socket<PluginWS>;
}
