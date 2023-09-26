export interface SpotifyStore {
  shouldShowActivity(): boolean;
  spotifyModalAccounts?: Record<string, SpotifyAccount>;
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
