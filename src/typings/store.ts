export interface SpotifyStore {
  shouldShowActivity(): boolean;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __getLocalVars(): {
    accounts: Record<string, SpotifyAccount>;
    store: SpotifyStore;
  };
  wasAutoPaused(): boolean;
}
export interface SpotifyAccount {
  accessToken: string;
  accountId: string;
  connectionId: string;
  isPremium: boolean;
  socket: WebSocket & { account: SpotifyAccount };
}

export type SpotifySocketPayloadEvents =
  | {
      event: {
        state: SpotifyApi.CurrentPlaybackResponse;
      };
      type: 'PLAYER_STATE_CHANGED';
    }
  | {
      event: {
        devices: SpotifyApi.UserDevice[];
      };
      type: 'DEVICE_STATE_CHANGED';
    };

export type SpotifySocketData =
  | {
      type: 'pong';
    }
  | {
      payloads: [
        {
          events: [SpotifySocketPayloadEvents];
        },
      ];
      type: 'message';
    };
