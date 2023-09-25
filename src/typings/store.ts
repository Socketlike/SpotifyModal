export interface SpotifyStore {
  shouldShowActivity(): boolean;
  spotifyModalAccounts?: Record<string, SpotifyAccount>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __getLocalVars(): {
    accounts: Record<string, SpotifyAccount>;
  };
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
      headers?: { 'Spotify-Connection-Id'?: string; 'Content-Type'?: string };
      payloads: [
        {
          events: [SpotifySocketPayloadEvents];
        },
      ];
      method?: 'PUT';
      type: 'message';
    };
