export interface SpotifyStore {
  shouldShowActivity(): boolean;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __getLocalVars(): SpotifyStoreLocalVariables;
  wasAutoPaused(): boolean;
}

export interface SpotifyStoreLocalVariables {
  accounts: Record<string, SpotifyAccount>;
  logger: {
    error(...args: unknown[]): void;
    info(...args: unknown[]): void;
    log(...args: unknown[]): void;
    name: 'Spotify';
    time(...args: unknown[]): void;
    trace(...args: unknown[]): void;
    verbose(...args: unknown[]): void;
    warn(...args: unknown[]): void;
  };
  store: SpotifyStore;
}

export interface SpotifyAccount {
  accessToken: string;
  accountId: string;
  connectionId: string;
  isPremium: boolean;
  socket: WebSocket & { account: SpotifyAccount };
}

export interface SpotifySocketPongData {
  type: 'pong';
}

export interface SpotifySocketPayloadPlayerStateEvent {
  event: {
    state: SpotifyApi.CurrentPlaybackResponse;
  };
  type: 'PLAYER_STATE_CHANGED';
}

export interface SpotifySocketPayloadDeviceStateEvent {
  event: {
    devices: SpotifyApi.UserDevice[];
  };
  type: 'DEVICE_STATE_CHANGED';
}

export interface SpotifySocketMessageData {
  payloads: [
    {
      events: [SpotifySocketPayloadPlayerStateEvent | SpotifySocketPayloadDeviceStateEvent];
    },
  ];
  type: 'message';
}

export type SpotifySocketData = SpotifySocketPongData | SpotifySocketMessageData;
