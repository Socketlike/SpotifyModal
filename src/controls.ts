/* eslint-disable no-undefined, @typescript-eslint/require-await, @typescript-eslint/no-floating-promises
   ----
   putSpotifyAPI() does not need to be catched */
import { common, logger } from "replugged";

async function putSpotifyAPI(url: string, data: string, name: string): Promise<void> {
  // @ts-expect-error - spotifySocket is not a string
  if (!common.spotifySocket.getActiveSocketAndDevice()) {
    logger.warn(name, "SpotifyModal", undefined, "No devices detected");
    return;
  }
  // @ts-expect-error - spotifySocket is not a string
  const socket = common.spotifySocket.getActiveSocketAndDevice()?.socket;
  if (socket)
    fetch(url, {
      method: "PUT",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${socket.accessToken}`,
      },
      body: data,
    })
      .catch((error) => {
        logger.error(name, "SpotifyModal", undefined, "An error has occurred:", error);
      })
      .then((response) => {
        // @ts-expect-error - response is not void
        if (response.status === 401)
          logger.error(name, "SpotifyModal", undefined, "Expired access token");
        // @ts-expect-error - response is not void
        else if (response.status === 403)
          logger.error(name, "SpotifyModal", undefined, "Bad request");
        // @ts-expect-error - response is not void
        else if (response.status === 204) logger.log(name, "SpotifyModal", undefined, "Succeeded");
        // @ts-expect-error - response is not void
        else logger.log(name, "SpotifyModal", undefined, "Unknown response", response.json());
      });
}

export function togglePlaybackState(): string {
  // @ts-expect-error - spotifySocket is not a string
  const socket = common.spotifySocket.getActiveSocketAndDevice()?.socket;
  putSpotifyAPI(
    `https://api.spotify.com/v1/me/player/${
      // @ts-expect-error - spotifySocket is not a string
      !common.spotifySocket.getPlayerState(socket?.accountId) ? "play" : "pause"
    }`,
    '{ "position_ms": 0 }',
    "togglePlaybackState",
  );
  // @ts-expect-error - spotifySocket is not a string
  return !common.spotifySocket.getPlayerState(socket?.accountId) ? "play" : "pause";
}

export function toggleRepeatState(repeatMode: number): string {
  const repeatModeList = ["off", "context", "track"];
  putSpotifyAPI(
    "https://api.spotify.com/v1/me/player/repeat",
    `{ "state": "${repeatModeList[repeatMode] || "off"}" }`,
    "toggleRepeatState",
  );
  return repeatModeList[repeatMode] || "off";
}

export function seekToPosition(position: number): void {
  if (typeof position !== "number") return;
  putSpotifyAPI(
    "https://api.spotify.com/v1/me/player/seek",
    `{ "position_ms": ${position} }`,
    "seekToPosition",
  );
}

export function setPlaybackVolume(percent: number): void {
  let volumePercent = percent;
  if (volumePercent > 100) volumePercent = 100;
  if (volumePercent < 0) volumePercent = 0;
  putSpotifyAPI(
    "https://api.spotify.com/v1/me/player/volume",
    `{ "volume_percent": ${volumePercent} }`,
    "setPlaybackVolume",
  );
}

export function togglePlaybackShuffle(state: boolean): void {
  putSpotifyAPI(
    "https://api.spotify.com/v1/me/player/shuffle",
    `{ "state": ${Boolean(state)} }`,
    "togglePlaybackShuffle",
  );
}

export function skipToPreviousOrNext(next = true): void {
  putSpotifyAPI(
    `https://api.spotify.com/v1/me/player/${next ? "next" : "previous"}`,
    "{}",
    "skipToPreviousOrNext",
  );
}
