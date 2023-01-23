import { common, webpack } from 'replugged';
import { getSpotifyAccount } from './common';
import {
  SpotifyDevice,
  SpotifyUser,
  SpotifySocket,
  SpotifyWebSocketRawMessage,
  SpotifyWebSocketRawParsedMessage,
  SpotifyWebSocketState,
} from './types';
import {
  Artists,
  Dock,
  Header,
  Icon,
  Icons,
  Modal,
  ProgressBar,
  ProgressContainer,
  ProgressDisplay,
  componentEventTarget,
  parseTime,
} from './components';
import './style.css';

const { React, ReactDOM } = common;

declare const DiscordNative: {
  clipboard: {
    copy: (content: string) => void;
  };
};

let currentAccountId = '';
let dispatcher = common.fluxDispatcher;
let injected = false;
let panel: HTMLElement;
const rootElement = document.createElement('div');
rootElement.classList.add('spotify-modal');
const root = ReactDOM.createRoot(rootElement);

export const components = {
  Artists,
  Dock,
  Header,
  Icon,
  Icons,
  Modal,
  ProgressBar,
  ProgressContainer,
  ProgressDisplay,
  componentEventTarget,
  parseTime,
};

export const handlers = {
  shuffleClick: (
    event: CustomEvent<{
      mouseEvent: React.MouseEvent;
      currentState: boolean;
      modifyState: (state: boolean | ((previous: boolean) => boolean)) => void;
    }>,
  ): void => {
    event.detail.modifyState(!event.detail.currentState);
    common.toast.toast(`Shuffle set to ${!event.detail.currentState ? 'on' : 'off'}`, 1);
  },
  skipPrevClick: (
    event: CustomEvent<{
      mouseEvent: React.MouseEvent;
      currentPos: number;
      modifyCurrent: (pos: number | ((previous: number) => number)) => void;
    }>,
  ): void => {
    if (event.detail.currentPos >= 6000) {
      event.detail.modifyCurrent(0);
      common.toast.toast('Set playback time to 0', 1);
    } else common.toast.toast('Skip previous', 1);
  },
  playPauseClick: (
    event: CustomEvent<{
      mouseEvent: React.MouseEvent;
      currentState: boolean;
      modifyState: (state: boolean | ((previous: boolean) => boolean)) => void;
    }>,
  ): void => {
    event.detail.modifyState(!event.detail.currentState);
    common.toast.toast(`Play / pause set to ${!event.detail.currentState ? 'play' : 'pause'}`, 1);
  },
  skipNextClick: (event: CustomEvent<{ mouseEvent: React.MouseEvent }>): void => {
    common.toast.toast('Skip next', 1);
  },
  repeatClick: (
    event: CustomEvent<{
      mouseEvent: React.MouseEvent;
      currentState: 'off' | 'context' | 'track';
      modifyState: (state: boolean | ((previous: boolean) => boolean)) => void;
    }>,
  ): void => {
    const nextMode = { off: 'context', context: 'track', track: 'off' };
    event.detail.modifyState(nextMode[event.detail.currentState]);
    common.toast.toast(
      `Repeat set to ${
        nextMode[event.detail.currentState] === 'context'
          ? 'all'
          : nextMode[event.detail.currentState]
      }`,
      1,
    );
  },
  progressBarClick: (
    event: CustomEvent<{
      mouseEvent: React.MouseEvent;
      percent: number;
      duration: number;
      modifyCurrent: (pos: number | ((previous: number) => number)) => void;
    }>,
  ): void => {
    event.detail.modifyCurrent(Math.round(event.detail.duration * event.detail.percent));
    common.toast.toast(
      `Set current pos to ${Math.round(event.detail.duration * event.detail.percent)}`,
      1,
    );
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

export async function start(): Promise<void> {
  panel = document.body.querySelectorAll('[class^=panels-]')[0];
  panel.insertAdjacentElement('afterbegin', rootElement);
  Object.entries(handlers).forEach(
    ([name, listener]: [string, (event: CustomEvent<any>) => void]): void => {
      componentEventTarget.addEventListener(name, listener);
    },
  );
  root.render(<Modal />);
}

export async function stop(): void {
  if (panel) panel.removeChild(rootElement);
  Object.entries(handlers).forEach(
    ([name, listener]: [string, (event: CustomEvent<any>) => void]) => {
      componentEventTarget.removeEventListener(name, listener);
    },
  );
  root.unmount();
}

export function Settings(): React.Element {
  return (
    <div>
      <span style={{ color: 'white', backgroundColor: 'red' }}>Settings component test</span>
    </div>
  );
}
