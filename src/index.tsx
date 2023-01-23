import { common, webpack } from 'replugged';
import {
  SpotifyDevice,
  SpotifyUser,
  SpotifySocket,
  SpotifyWebSocketRawMessage,
  SpotifyWebSocketRawParsedMessage,
  SpotifyWebSocketState,
} from './types';
import {
  SpotifyWatcher,
  addRootToPanel,
  logger,
  removeRootFromPanelAndUnmount,
  spotifyAPI,
} from './utils';
import './style.css';

import { Modal, componentEventTarget } from './components';

export * as components from './components';
export * as utils from './utils';

const { React, ReactDOM } = common;
declare const DiscordNative: {
  clipboard: {
    copy: (content: string) => void;
  };
};

export const handlers = {
  shuffleClick: (
    event: CustomEvent<{
      mouseEvent: React.MouseEvent;
      currentState: boolean;
      modifyState: (state: boolean | ((previous: boolean) => boolean)) => void;
    }>,
  ): void => {
    if (!watcher.account?.accessToken) return;
    spotifyAPI
      .setShuffleState(watcher.account.accessToken, !event.detail.currentState)
      .then((res: Response): Promise<void> => {
        if (!res.ok)
          common.toast.toast(
            '[SpotifyModal] Failed to update shuffle state. Please update your Spotify state manually.',
            2,
          );
      });
  },
  skipPrevClick: (
    event: CustomEvent<{
      mouseEvent: React.MouseEvent;
      currentPos: number;
      modifyCurrent: (pos: number | ((previous: number) => number)) => void;
    }>,
  ): void => {
    if (!watcher.account?.accessToken) return;
    if (event.detail.currentPos >= 6000)
      spotifyAPI
        .seekToPosition(watcher.account.accessToken, 0)
        .then((res: Response): Promise<void> => {
          if (!res.ok)
            common.toast.toast(
              '[SpotifyModal] Failed to update current playback position. Please update your Spotify state manually.',
              2,
            );
        });
    else
      spotifyAPI
        .skipNextOrPrevious(watcher.account.accessToken, false)
        .then((res: Response): Promise<void> => {
          if (!res.ok)
            common.toast.toast(
              '[SpotifyModal] Failed to skip to previous track. Please update your Spotify state manually.',
              2,
            );
        });
  },
  playPauseClick: (
    event: CustomEvent<{
      mouseEvent: React.MouseEvent;
      currentState: boolean;
      modifyState: (state: boolean | ((previous: boolean) => boolean)) => void;
    }>,
  ): void => {
    if (!watcher.account?.accessToken) return;
    spotifyAPI
      .setPlaybackState(watcher.account.accessToken, !event.detail.currentState)
      .then((res: Response): Promise<void> => {
        if (!res.ok)
          common.toast.toast(
            '[SpotifyModal] Failed to update playback state. Please update your Spotify state manually.',
            2,
          );
      });
  },
  skipNextClick: (event: CustomEvent<{ mouseEvent: React.MouseEvent }>): void => {
    if (!watcher.account?.accessToken) return;
    spotifyAPI
      .skipNextOrPrevious(watcher.account.accessToken)
      .then((res: Response): Promise<void> => {
        if (!res.ok)
          common.toast.toast(
            '[SpotifyModal] Failed to skip to next track. Please update your Spotify state manually.',
            2,
          );
      });
  },
  repeatClick: (
    event: CustomEvent<{
      mouseEvent: React.MouseEvent;
      currentState: 'off' | 'context' | 'track';
      modifyState: (state: boolean | ((previous: boolean) => boolean)) => void;
    }>,
  ): void => {
    if (!watcher.account?.accessToken) return;

    const nextMode = { off: 'context', context: 'track', track: 'off' };
    spotifyAPI
      .setRepeatState(watcher.account.accessToken, nextMode[event.detail.currentState])
      .then((res: Response): Promise<void> => {
        if (!res.ok)
          common.toast.toast(
            '[SpotifyModal] Failed to update repeat state. Please update your Spotify state manually.',
            2,
          );
      });
  },
  progressBarClick: (
    event: CustomEvent<{
      mouseEvent: React.MouseEvent;
      percent: number;
      duration: number;
      modifyCurrent: (pos: number | ((previous: number) => number)) => void;
    }>,
  ): void => {
    if (!watcher.account?.accessToken) return;
    spotifyAPI
      .seekToPosition(
        watcher.account.accessToken,
        Math.round(event.detail.duration * event.detail.percent),
      )
      .then((res: Response): Promise<void> => {
        if (!res.ok)
          common.toast.toast(
            '[SpotifyModal] Failed to update playback position. Please update your Spotify state manually.',
            2,
          );
      });
  },
  coverArtClick: (event: CustomEvent<{ name: string; id?: string }>): void => {
    if (typeof event.detail.id === 'string') {
      window.open(`https://open.spotify.com/album/${event.detail.id}`);
      common.toast.toast(`Opening album (${event.detail.name}) in browser`, 1);
    }
  },
  coverArtRightClick: (event: CustomEvent<{ name: string; id?: string }>): void => {
    if (typeof event.detail.id === 'string') {
      DiscordNative.clipboard.copy(`https://open.spotify.com/album/${event.detail.id}`);
      common.toast.toast(`Copied album (${event.detail.name}) URL to clipboard`, 1);
    }
  },
  titleRightClick: (event: CustomEvent<{ name: string; id?: string }>): void => {
    if (typeof event.detail.id === 'string') {
      DiscordNative.clipboard.copy(`https://open.spotify.com/track/${event.detail.id}`);
      common.toast.toast(`Copied track (${event.detail.name}) URL to clipboard`, 1);
    }
  },
  artistRightClick: (event: CustomEvent<SpotifyUser>): void => {
    if (typeof event.detail.id === 'string') {
      DiscordNative.clipboard.copy(`https://open.spotify.com/artist/${event.detail.id}`);
      common.toast.toast(`Copied artist (${event.detail.name}) URL to clipboard`, 1);
    }
  },
};

let injected = false;
export let watcher: SpotifyWatcher;
let root: { element: HTMLDivElement; root: ReactDOM.Root };
let modal: React.Element;
let container = '';

export async function start(): Promise<void> {
  Object.entries(handlers).forEach(([name, handler]): void =>
    componentEventTarget.addEventListener(name, handler),
  );

  const containerClasses = await webpack.waitForModule<{
    container: string;
  }>(webpack.filters.byProps('avatar', 'customStatus'));

  if (containerClasses?.container) container = containerClasses.container;

  watcher = new SpotifyWatcher();
  watcher.addEventListener(
    'update',
    (data: CustomEvent<{ state?: SpotifyWebSocketState; devices?: SpotifyDevices[] }>): void => {
      const { devices, state } = data.detail;

      if (!injected) {
        root = addRootToPanel();
        if (root.root) {
          root.root.render(
            <Modal
              additionalHeaderClasses={container}
              track={{
                name: typeof state?.item?.name === 'string' ? state.item.name : 'None',
                id: typeof state?.item?.id === 'string' ? state.item.id : undefined,
              }}
              album={{
                name: typeof state?.item?.album?.name === 'string' ? state.item.album.name : 'None',
                id: typeof state?.item?.album?.id === 'string' ? state.item.album.id : undefined,
              }}
              artists={Array.isArray(state?.item?.artists) ? state.item.artists : undefined}
              coverArt={
                typeof state?.item?.album?.images?.[0]?.url === 'string'
                  ? state.item.album.images[0].url
                  : undefined
              }
              current={typeof state?.progress_ms === 'number' ? state.progress_ms : undefined}
              duration={
                typeof state?.item?.duration_ms === 'number' ? state.item.duration_ms : undefined
              }
              playing={typeof state?.is_playing === 'boolean' ? state.is_playing : undefined}
              shuffle={typeof state?.shuffle_state === 'boolean' ? state.shuffle_state : undefined}
              shouldShow={Boolean(devices?.length)}
              repeat={
                ['off', 'context', 'track'].includes(state?.repeat_state)
                  ? (state.repeat_state as 'off' | 'context' | 'track')
                  : undefined
              }
            />,
          );
          injected = true;
        }
      } else {
        if (typeof state === 'object')
          componentEventTarget.dispatchEvent(
            new CustomEvent('allChange', {
              detail: {
                track: {
                  name: typeof state?.item?.name === 'string' ? state.item.name : 'None',
                  id: typeof state?.item?.id === 'string' ? state.item.id : undefined,
                },
                album: {
                  name:
                    typeof state?.item?.album?.name === 'string' ? state.item.album.name : 'None',
                  id: typeof state?.item?.album?.id === 'string' ? state.item.album.id : undefined,
                },
                artists: Array.isArray(state?.item?.artists) ? state.item.artists : undefined,
                coverArt:
                  typeof state?.item?.album?.images?.[0]?.url === 'string'
                    ? state.item.album.images[0].url
                    : undefined,
                current: typeof state?.progress_ms === 'number' ? state.progress_ms : undefined,
                duration:
                  typeof state?.item?.duration_ms === 'number' ? state.item.duration_ms : undefined,
                playing: typeof state?.is_playing === 'boolean' ? state.is_playing : undefined,
                shuffle:
                  typeof state?.shuffle_state === 'boolean' ? state.shuffle_state : undefined,
                shouldShow:
                  typeof state?.device?.is_active === 'boolean' ? state.shuffle_state : undefined,
                repeat: ['off', 'context', 'track'].includes(state?.repeat_state)
                  ? (state.repeat_state as 'off' | 'context' | 'track')
                  : undefined,
              },
            }),
          );
        if (Array.isArray(devices))
          componentEventTarget.dispatchEvent(
            new CustomEvent('shouldShowChange', {
              detail: Boolean(devices.length),
            }),
          );
      }
    },
  );
}

export async function stop(): void {
  Object.entries(handlers).forEach(([name, handler]): void =>
    componentEventTarget.removeEventListener(name, handler),
  );
  componentEventTarget.dispatchEvent(new CustomEvent('shouldShowChange', { detail: false }));
  watcher.destroy();
  removeRootFromPanelAndUnmount(root);
}

// For testing purposes
/* export function Settings(): React.Element {
  return (
    <div>
      <span style={{ color: 'white', backgroundColor: 'red' }}>Settings component test</span>
    </div>
  );
} */
