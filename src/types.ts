/* eslint-disable @typescript-eslint/naming-convention */

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
};

export interface SpotifyTrack {
  album: null | {
    album_type: null | string;
    artists: Array<{
      external_urls: undefined | Record<string, string>;
      href: undefined | string;
      id: undefined | string;
      name: string;
      type: string;
      uri: undefined | string;
    }>;
    external_urls: undefined | Record<string, string>;
    href: null | string;
    id: null | string;
    images: null | Array<{
      height: number;
      url: string;
      width: number;
    }>;
    available_markets: string[];
    name: string;
    release_date: null | string;
    release_date_precision: null | string;
    total_tracks: null | string;
    type: string;
    uri: null | string;
  };
  artists: null | Array<{
    external_urls: Record<string, string>;
    href: null | string;
    id: null | string;
    name: string;
    type: string;
    uri: null | string;
  }>;
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: Record<string, string>;
  external_urls: Record<string, string>;
  href: null | string;
  id: null | string;
  is_local: boolean;
  is_playable: boolean;
  name: string;
  popularity: number;
  preview_url: null | string;
  track_number: number;
  type: string;
  uri: string;
}

export interface SpotifyState {
  actions: {
    disallows: Record<string, boolean>;
  };
  context: undefined | {
    external_urls: Record<string, string>;
    href: string;
    type: string;
    uri: string;
  };
  currently_playing_type: string;
  device: SpotifyDevice;
  is_playing: boolean;
  item: undefined | SpotifyTrack;
  progress_ms: undefined | number;
  repeat_state: string;
  shuffle_state: boolean;
  timestamp: number;
}

/**
 * Message recieved from the Spotify WebSocket
 * @type  {Object}  SpotifyWebSocketMessage
 */
export interface SpotifyWebSocketMessage {
  headers: undefined | {
    "content-type": string;
  };
  payloads: undefined | Array<{
    events: Array<{
      event: {
        event_id: number;
        devices: undefined | Array<SpotifyDevice>;
        state: undefined | SpotifyState;
        href: string;
        source: string;
        type: string;
        uri: string;
        user: {
          id: string;
        };
      };
    }>;
  }>;
  type: string;
  uri: string;
}

export interface SpotifyMinifiedWebSocketMessage {
  type: string;
  eventType: undefined | string;
  user: undefined | string;
  devices: undefined | Array<SpotifyDevice>;
  state: undefined | SpotifyState;
}

export interface SpotifySocket {
  __getLocalVars: () => {
    accounts: Record<string, {
      socket: undefined | Record<string, {
        socket: WebSocket;
      }>;
    };
  }>;
}
