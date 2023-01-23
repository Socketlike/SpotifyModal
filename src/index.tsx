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
import { Dock, ProgressContainer, Icons, parseTime } from './components';
import './style.css';

const { React, ReactDOM } = common;

declare const DiscordNative: {
  clipboard: {
    copy: (content: string) => void;
  };
};

let account: SpotifySocket;
let currentAccountId = '';
let dispatcher = common.fluxDispatcher;
let injected = false;
let panel: HTMLElement;
const rootElement = document.createElement('div');
rootElement.classList.add('spotify-modal');
const root = ReactDOM.createRoot(rootElement);
let wsstate: SpotifyWebSocketState;
let wsdevices: SpotifyDevice[];
let websocket: WebSocket;
let durationId: number;

export const components = () => ({ Dock, ProgressContainer, Icons });

export async function start(): Promise<void> {
  /*
  dispatcher.subscribe('SPOTIFY_PROFILE_UPDATE', dispatcherListener);
  dispatcher.subscribe('SPOTIFY_SET_DEVICES', dispatcherListener);
  dispatcher.subscribe('SPOTIFY_SET_ACTIVE_DEVICES', dispatcherListener);
  dispatcher.subscribe('SPOTIFY_PLAYER_STATE', dispatcherListener);
  await dispatcherListener({});
  */
  panel = document.body.querySelectorAll('[class^=panels-]')[0];
  panel.insertAdjacentElement('afterbegin', rootElement);
  root.render(
    <Dock
      onClick={{
        shuffle: (state: boolean): void =>
          common.toast.toast(`Shuffle state ${state ? 'on' : 'off'}`, 1),
        skipPrev: (): void => common.toast.toast('Skip previous', 1),
        playPause: (state: boolean): void =>
          common.toast.toast(`Play / pause state ${state ? 'play' : 'pause'}`, 1),
        skipNext: (): void => common.toast.toast('Skip next', 1),
        repeat: (state: boolean): void => common.toast.toast(`Repeat state ${state}`, 1),
      }}
      state={{
        shuffle: false,
        playPause: false,
        repeat: 'off',
      }}
    >
     <ProgressContainer
        currentNow={10}
        duration={10000}
        onClick={(percent: number) =>
          common.toast.toast(`Change track position to ${parseTime(Math.round(10000 * percent))}`)
        }
      />
    </Dock>,
  );
}

export async function stop(): void {
  if (panel) panel.removeChild(rootElement);
  root.unmount();
  /*
  dispatcher.unsubscribe('SPOTIFY_PROFILE_UPDATE', dispatcherListener);
  dispatcher.unsubscribe('SPOTIFY_SET_DEVICES', dispatcherListener);
  dispatcher.unsubscribe('SPOTIFY_SET_ACTIVE_DEVICES', dispatcherListener);
  dispatcher.unsubscribe('SPOTIFY_PLAYER_STATE', dispatcherListener);
  if (websocket) websocket.removeEventListener('message', eventListener);
  */
}

/*
const updateProgress = (): void => {
  playbackTimeDisplay.setState({
    current: playbackTimeDisplay.state.current + 500,
  });

  progressBar.setState({
    percent: playbackTimeDisplay.state.duration
      ? ((playbackTimeDisplay.state.current / playbackTimeDisplay.state.duration) * 100).toFixed(4)
      : '0%',
  });
}; */

/*
const injectModal = (): void => {
  if (!injected) {
    panel = document.body.querySelectorAll('[class^="panels-"]')?.[0] as HTMLElement;
    if (!panel) return;
    panel.insertAdjacentElement('afterbegin', rootElement);
    root.render(modal);
    injected = true;
  }
}; */

/*
const updateModal = (state: SpotifyWebSocketState, devices: SpotifyDevice[]): void => {
  injectModal();
  if (state?.is_playing && !durationId) durationId = setInterval(updateProgress, 500) as number;
  else if (!state?.is_playing && durationId) {
    clearInterval(durationId);
    durationId = 0;
  }

  progressBar.setState({
    percent: state?.item?.duration_ms
      ? ((state.item.progress_ms / state.item.duration_ms) * 100).toFixed(4)
      : '0%',
  });

  playbackTimeDisplay.setState({
    current: state?.progress_ms ?? 0,
    duration: state?.item?.duration_ms ?? 0,
  });

  modal.setState({
    album: { id: state?.item?.album?.id ?? '', name: state?.item?.album?.name ?? 'None' },
    track: { id: state?.item?.id ?? '', name: state?.item?.name ?? 'None' },
    status: {
      repeat: state?.repeat_state ?? 'off',
      shuffle: state?.shuffle_state ?? false,
      playing: state?.is_playing ?? false,
      active: Boolean(devices?.length),
    },
    artists: Array.isArray(state?.item?.artists) ? state.item.artists : ([] as SpotifyUser[]),
    coverArtSrc: state?.item?.album?.images?.[0]?.url ?? '',
  });
}; */

/*
const eventListener = (message: SpotifyWebSocketRawMessage): Promise<void> => {
  if (!message?.data) return;
  const parsed = JSON.parse(message.data) as unknown as SpotifyWebSocketRawParsedMessage;

  if (parsed?.type !== 'pong' && parsed?.payloads) {
    if (typeof parsed.payloads?.[0]?.events?.[0]?.type !== 'string') return;
    if (parsed.payloads[0].events[0].type === 'PLAYER_STATE_CHANGED')
      wsstate = parsed.payloads[0].events[0].event.state;
    else if (parsed.payloads[0].events[0].type === 'DEVICE_STATE_CHANGED')
      wsdevices = parsed.payloads[0].events[0].event.devices;

    updateModal(wsstate, wsdevices);
  }
};

const dispatcherListener = async ({
  accountId,
  devices,
}: {
  accountId: string;
  devices?: SpotifyDevice[];
}): Promise<void> => {
  if (Array.isArray(devices) && !devices.length) {
    currentAccountId = '';
    return;
  }

  if (currentAccountId && currentAccountId !== accountId) return;
  if (accountId && currentAccountId === accountId) return;

  if (websocket) websocket.removeEventListener('message', eventListener);

  account = await getSpotifyAccount(accountId);
  if (account) {
    currentAccountId = account.accountId;
    websocket = account.socket;
  }
  if (websocket) websocket.addEventListener('message', eventListener);
}; */
