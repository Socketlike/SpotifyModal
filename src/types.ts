/* eslint-disable @typescript-eslint/naming-convention
  ----
  It's Discord's naming conventions,
  not my fault that they used snake case on like 3 properties */

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
  accountId: string;
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

/**
 * Player state data recieved from the raw Spotify API
 * @type  {Object}  SpotifyAPIPlayerStateData
 * @param {string}  repeat_state
 * @param {boolean} shuffle_state
 */
export interface SpotifyAPIPlayerStateData {
  repeat_state: string;
  shuffle_state: boolean;
}
