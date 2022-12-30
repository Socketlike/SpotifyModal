/* eslint-disable @typescript-eslint/naming-convention
  ----
  It's Discord's naming conventions,
  not my fault that they used snake case on like 3 properties */

/**
 * Persistent data for a session
 * @typedef {Object}              EnvironmentData
 * @param   {(Element|undefined)} panel - Reference to the user panel element
 * @param   {boolean}             injected - Stores the panel injection status
 * @param   {number}              fluxDispatcherIndex - Index of the current SPOTIFY_PLAYER_STATE subscription function
 * @param   {(number|undefined)}  timebarInterval - Stores the Interval ID for the timebar update function
 * @param   {boolean}             isPlaying - Whether Spotify is playing or not
 * @param   {Object}              trackStats - Statistics of the current playing track
 * @param   {number}              trackStats.passed - Current play time for current playing track
 * @param   {number}              trackStats.duration - Duration of the current playing track
 * @param   {string}              albumUrl - URL to the album of the current playing track
 */
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

/**
 * Stores Discord's HTML classes
 * @typedef {Object} Classes
 * @param   {Object} panels - Stores the classes relating to the user panel components
 * @param   {string} container - Stores the class relating to the user panel container component
 * @param   {Object} anchors - Stores the classes relating to Discord's anchor (hyperlink) components
 * @param   {Object} activity - Stores the classes relating to Discord's user activity components
 * @param   {Object} colors - Stores the classes relating to Discord's text color scheme
 */
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

/**
 * The data recieved from fluxDispatcher's SPOTIFY_PLAYER_STATE subscription
 * @typedef {Object}             SpotifyPlayerStateData
 * @param   {boolean}            isPlaying - Whether or not the player is active
 * @param   {boolean}            repeat - Whether or not the repeat mode is active
 * @param   {(number|undefined)} position - Current playback time for current playing track (if playing)
 * @param   {Object}             device - Current device's data
 * @param   {boolean}            device.is_active - Whether or not the playing device is active
 * @param   {boolean}            device.is_private_session - Whether or not the user has activated private session mode
 * @param   {boolean}            device.is_restricted - Whether or not the user is restricted
 * @param   {string}             device.name - Device's name
 * @param   {string}             device.type - Type of the device (Smartphone|Computer)
 * @param   {(Object|undefined)} track - The current playing track's data (if playing)
 * @param   {(Object|undefined)} track.album - The current playing track's album data (if playing and album data is defined)
 * @param   {(string|undefined)} track.album.id - The current playing track's album ID (if track exists on Spotify)
 * @param   {(Object|undefined)} track.album.image - The current playing track's album image (if track exists on Spotify)
 * @param   {number}             track.album.image.height - Album image's height
 * @param   {number}             track.album.image.width - Album image's width
 * @param   {string}             track.album.image.url - Album image's source URL
 * @param   {(string|undefined)} track.album.name - Album's name (if defined)
 * @param   {(string|undefined)} track.id - Track's ID (if track exists on Spotify)
 * @param   {number}             track.duration - Track's duration
 * @param   {(Object[]|undefined)} track.artists - Track's list of artists
 * @param   {string}             track.artists[].name - Artist's name
 * @param   {(string|undefined)} track.artists[].id - Artist's ID (if artist exists on Spotify)
 * @param   {boolean}            track.isLocal - Whether or not the current playing track is a local file
 * @param   {string}             name - Current playing track's name
 */
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
