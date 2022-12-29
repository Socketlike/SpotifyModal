/* eslint-disable @typescript-eslint/naming-convention
  ----
  It's Discord's naming conventions,
  not my fault that they used snake case on like 3 properties */

export interface EnvironmentData {
  panel: Element | undefined;
  injected: boolean;
  fluxDispatcherIndex: number;
  timebarInterval: number | undefined;
  isPlaying: boolean;
  trackStats: {
    passed: number;
    duration: number;
    albumUrl: string;
  };
}

export interface Classes {
  panels: {
    panels: string;
  };
  container: string;
  anchors: {
    anchor: string;
    anchorUnderlineOnHover: string;
  };
  activity: {
    activityName: string;
    bodyLink: string;
    ellipsis: string;
    nameNormal: string;
  };
  colors: {
    defaultColor: string;
    "text-sm/semibold": string;
  };
}

export interface SpotifyPlayerStateData {
  isPlaying: boolean;
  repeat: boolean;
  position: number;
  device: {
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
  };
  track: {
    album: {
      id: string;
      image: {
        height: number;
        width: number;
        url: string;
      };
      name: string;
    };
    id: string;
    duration: number;
    artists: Array<{ name: string; id: string }>;
    isLocal: boolean;
    name: string;
  };
}
