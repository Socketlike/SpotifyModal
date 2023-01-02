/* eslint-disable no-undefined
   ----
   putSpotifyAPI() does not need to be catched */
import { common, logger } from "replugged";
import { SpotifyAPIPlayerStateData } from "./types";

function putSpotifyAPI(
  endpoint: string,
  data?: string,
  method = "PUT",
): Promise<void | Response> | void {
  // @ts-expect-error - spotifySocket is not a string
  if (!common.spotifySocket.getActiveSocketAndDevice()) {
    logger.warn("putSpotifyAPI", "SpotifyModal", undefined, "No devices detected");
    return;
  }
  // @ts-expect-error - spotifySocket is not a string
  const socket = common.spotifySocket.getActiveSocketAndDevice()?.socket;
  if (socket)
    return fetch(`https://api.spotify.com/v1/${endpoint}`, {
      method,
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${socket.accessToken}`,
      },
      body: data,
    });
  
}

export async function getPlayerState(): Promise<SpotifyAPIPlayerStateData | void> {
  let res: void | Response;

  try {
    res = await putSpotifyAPI("me/player", undefined, "GET");
  } catch (error) {
    logger.error("getPlayerState", "SpotifyModal", undefined, "An error has occurred:", error);
  }

  if (!res) return;
  return await res.json();
}

export async function togglePlaybackState(): Promise<void | Response> {
  let res: void | Response;
  // @ts-expect-error - spotifySocket is not a string
  const socket = common.spotifySocket.getActiveSocketAndDevice()?.socket;

  try {
    res = await putSpotifyAPI(
      `me/player/${
        // @ts-expect-error - spotifySocket is not a string
        !common.spotifySocket.getPlayerState(socket?.accountId) ? "play" : "pause"
      }`,
      '{ "position_ms": 0 }',
    );
  } catch (error) {
    logger.error("togglePlaybackState", "SpotifyModal", undefined, "An error has occurred:", error);
  }

  return res;
}

export async function toggleRepeatState(repeatMode: number): Promise<void | Response> {
  const repeatModeList = ["off", "context", "track"];
  let res: void | Response;

  try {
    res = await putSpotifyAPI(`me/player/repeat?state=${repeatModeList[repeatMode] || "off"}`);
  } catch (error) {
    logger.error("toggleRepeatState", "SpotifyModal", undefined, "An error has occurred:", error);
  }

  return res;
}

export async function seekToPosition(position: number): Promise<void | Response> {
  if (typeof position !== "number") return;
  let res: void | Response;

  try {
    res = await putSpotifyAPI("me/player/seek", `{ "position_ms": ${position} }`);
  } catch (error) {
    logger.error("seekToPosition", "SpotifyModal", undefined, "An error has occurred:", error);
  }

  return res;
}

export async function setPlaybackVolume(percent: number): Promise<void | Response> {
  let volumePercent = percent;
  let res: void | Response;
  if (volumePercent > 100) volumePercent = 100;
  if (volumePercent < 0) volumePercent = 0;

  try {
    res = await putSpotifyAPI("me/player/volume", `{ "volume_percent": ${volumePercent} }`);
  } catch (error) {
    logger.error("setPlaybackVolume", "SpotifyModal", undefined, "An error has occurred:", error);
  }

  return res;
}

export async function togglePlaybackShuffle(state: boolean): Promise<void | Response> {
  let res: void | Response;

  try {
    res = await putSpotifyAPI(`me/player/shuffle?state=${Boolean(state)}`);
  } catch (error) {
    logger.error(
      "togglePlaybackShuffle",
      "SpotifyModal",
      undefined,
      "An error has occurred:",
      error,
    );
  }

  return res;
}

export async function skipToPreviousOrNext(next = true): Promise<void | Response> {
  let res: void | Response;

  try {
    res = await putSpotifyAPI(`me/player/${next ? "next" : "previous"}`, undefined, "POST");
  } catch (error) {
    logger.error(
      "skipToPreviousOrNext",
      "SpotifyModal",
      undefined,
      "An error has occurred:",
      error,
    );
  }

  return res;
}
