import {
  SpotifyDevice,
  SpotifyUser,
  SpotifySocket,
  SpotifyWebSocketRawMessage,
  SpotifyWebSocketRawParsedMessage,
  SpotifyWebSocketState,
} from './types';
import { common } from 'replugged';
import './style.css';

const { React, ReactDOM } = common;

declare const DiscordNative: {
  clipboard: {
    copy: (content: string) => void;
  };
};

function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function parseTime(ms: number): string {
  if (typeof ms !== 'number') return '';
  const dateObject = new Date(ms);
  const raw = {
    month: dateObject.getUTCMonth(),
    day: dateObject.getUTCDate(),
    hours: dateObject.getUTCHours(),
    minutes: dateObject.getUTCMinutes(),
    seconds: dateObject.getUTCSeconds(),
  };
  const parsedHours = raw.hours + (raw.day - 1) * 24 + raw.month * 30 * 24;

  return `${parsedHours > 0 ? `${parsedHours}:` : ''}${
    raw.minutes < 10 && parsedHours > 0 ? `0${raw.minutes}` : raw.minutes
  }:${raw.seconds < 10 ? `0${raw.seconds}` : raw.seconds}`;
}

function ProgressBar(props: {
  percent: string;
  onClick: (percent: number) => void;
}): React.Element {
  return (
    <div
      className='progress-bar'
      onClick={(mouseEvent: React.MouseEvent) =>
        props.onClick(
          mouseEvent.nativeEvent.offsetX / (mouseEvent.target as HTMLDivElement).offsetWidth,
        )
      }>
      <div className='inner' style={{ width: `${props.percent}%` }}></div>
    </div>
  );
}

function ProgressDisplay(props: { current: number; duration: number }): React.Element {
  return (
    <div className='progress-display'>
      <span className='current'>{parseTime(props.current)}</span>
      <span className='duration'>{parseTime(props.duration)}</span>
    </div>
  );
}

function ProgressContainer(props: {
  currentNow: number;
  duration: number;
  onClick: (percent: number) => void;
}): React.Element {
  const [current, setCurrent] = React.useState(props.currentNow);
  const [shouldReset, setShouldReset] = React.useState(true);
  let interval: number;

  React.useEffect(() => {
    interval = setInterval(() => {
      setCurrent((previous: number) => {
        if (previous < props.duration) return previous + 500;
        else return props.duration;
      });
    }, 500);
    return () => clearInterval(interval);
  });

  return (
    <div className='progress-container'>
      <ProgressDisplay current={current} duration={props.duration} />
      <ProgressBar
        percent={((current / props.duration) * 100).toFixed(4)}
        onClick={props.onClick}
      />
    </div>
  );
}

function Icon(props: {
  path: string;
  className: string;
  onClick: (mouseEvent) => Promise<void>;
  title?: string;
}): React.Element {
  return (
    <svg
      className={props.className}
      viewBox='0 0 24 24'
      onClick={typeof props.onClick === 'function' ? props.onClick : null}>
      {props.title ? <title>{props.title}</title> : ''}
      <path fill='currentColor' d={props.path}></path>
    </svg>
  );
}

function Icons(props: {
  onClick: {
    shuffle: (currentState: boolean) => void;
    skipPrev: () => void;
    playPause: (currentState: string) => void;
    skipNext: () => void;
    repeat: (currentState: string) => void;
  };
  state: {
    shuffle: boolean;
    playPause: boolean;
    repeat: string;
  };
}): React.Element {
  return (
    <div className='icons'>
      <Icon
        path='M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z'
        className={`shuffle${props.state.shuffle ? ' active' : ''}`}
        onClick={() => props.onClick.shuffle(props.state.shuffle)}
        title={`Shuffle ${props.state.shuffle ? 'on' : 'off'}`}
      />
      <Icon
        path='M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z'
        className='skip-prev'
        onClick={props.onClick.skipPrev}
      />
      <Icon
        path={
          props.state.playPause
            ? 'M14,19H18V5H14M6,19H10V5H6V19Z'
            : 'M8,5.14V19.14L19,12.14L8,5.14Z'
        }
        className='play-pause'
        onClick={() => props.onClick.playPause(props.state.playPause)}
      />
      <Icon
        path='M16,18H18V6H16M6,18L14.5,12L6,6V18Z'
        className='skip-next'
        onClick={props.onClick.skipNext}
      />
      <Icon
        path={
          props.state.repeat !== 'track'
            ? 'M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z'
            : 'M13,15V9H12L10,10V11H11.5V15M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z'
        }
        className='repeat'
        onClick={() => props.onClick.repeat(props.state.repeat)}
        title={`Repeat ${props.state.repeat === 'context' ? 'all' : props.state.repeat}`}
      />
    </div>
  );
}

function Dock(props: {
  children: React.Element[];
  onClick: {
    shuffle: (currentState: boolean) => void;
    skipPrev: () => void;
    playPause: (currentState: string) => void;
    skipNext: () => void;
    repeat: (currentState: string) => void;
  };
  state: {
    shuffle: boolean;
    playPause: boolean;
    repeat: 'off' | 'context' | 'track';
  };
}): React.Element {
  return (
    <div className='dock'>
      {props.children}
      <Icons
        onClick={props.onClick}
        title={{
          shuffle: `Shuffle ${props.state.shuffle ? 'on' : 'off'}`,
          repeat: `Repeat ${props.state.repeat !== 'context' ? props.state.repeat : 'all'}`,
        }}
        state={props.state}
      />
    </div>
  );
}

function Header(props: {
  title: { name: string; id?: string };
  artists: SpotifyUser[];
  album: { name: string; id?: string };
  coverArt?: string;
}): React.Element {
  return (
    <div className='header'>
      <div className=''> </div>
    </div>
  );
}

export { ProgressBar, ProgressContainer, ProgressDisplay, Icons, Dock, parseTime };

/*
function ProgressBar(props: { current: number; end: number }) {
  const [currentPos, setCurrentPos] = React.useState(props.current);
  const [intervalId, setIntervalId] = React.useState(0);

  React.useEffect(() => {
    setIntervalId(
      setInterval((): void => {
        setCurrentPos(currentPos + 500);
      }, 500),
    );
    return () => {
      clearInterval(intervalId);
      setIntervalId(0);
    };
  }, []);

  return (
    <div className='progress-bar'>
      <div
        className='inner'
        style={{ width: `${((currentPos / props.end) * 100).toFixed(4)}%` }}></div>
    </div>
  );
}

function PlaybackTimeDisplay(props: { current: number; end: number }) {
  const [currentPos, setCurrentPos] = React.useState(props.current);
  const [intervalId, setIntervalId] = React.useState(0);

  function parseTime(ms: number): string {
    if (typeof ms !== 'number') return '';
    const dateObject = new Date(ms);
    const raw = {
      month: dateObject.getUTCMonth(),
      day: dateObject.getUTCDate(),
      hours: dateObject.getUTCHours(),
      minutes: dateObject.getUTCMinutes(),
      seconds: dateObject.getUTCSeconds(),
    };
    const parsedHours = raw.hours + (raw.day - 1) * 24 + raw.month * 30 * 24;

    return `${parsedHours > 0 ? `${parsedHours}:` : ''}${
      raw.minutes < 10 && parsedHours > 0 ? `0${raw.minutes}` : raw.minutes
    }:${raw.seconds < 10 ? `0${raw.seconds}` : raw.seconds}`;
  }

  React.useEffect(() => {
    setIntervalId(
      setInterval((): void => {
        setCurrentPos(currentPos + 500);
      }, 500),
    );
    return () => {
      clearInterval(intervalId);
      setIntervalId(0);
    };
  }, []);

  return (
    <div className='playback-time'>
      <span className='current'>{parseTime(currentPos)}</span>
      <span className='duration'>{parseTime(props.end)}</span>
    </div>
  );
} */

/*
class Artists extends React.Component {
  public props: {
    list: SpotifyUser[];
  };

  public render() {
    return (
      <span className='artists'>
        {this.props.list.forEach(({ name, id }) => {
          const url = `https://open.spotify.com/artist/${id}`;
          if (id)
            return (
              <a
                className='artist'
                target='_blank'
                href={url}
                oncontextmenu={() => {
                  DiscordNative.clipboard.copy(url);
                  common.toast.toast("Copied artist's Spotify URL", 1);
                }}>
                {name}
              </a>
            );
          else return <>{name}</>;
        })}
      </span>
    );
  }
}

class CoverArt extends React.Component {
  public props: {
    id: string;
    name: string;
    src: string;
  };

  public render() {
    return (
      <img
        className='cover-art'
        src={this.props.coverSrc}
        title={this.props.albumName}
        onclick={() => {
          if (this.props.albumId)
            window.open(`https://open.spotify.com/album/${this.props.albumId}`);
        }}
        oncontextmenu={() => {
          if (this.props.albumId) {
            DiscordNative.clipboard.copy(`https://open.spotify.com/album/${this.props.albumId}`);
            common.toast.toast('Copied album URL', 1);
          }
        }}
      />
    );
  }
}

class Title extends React.Component {
  public props: {
    id: string;
    name: string;
  };

  public render() {
    return (
      <a
        className={`title${this.props.id ? ' href' : ''}`}
        title={this.props.name}
        href={`https://open.spotify.com/track/${this.props.id}`}
        target='_blank'
        oncontextmenu={() => {
          if (this.props.id) {
            DiscordNative.clipboard.copy(`https://open.spotify.com/track/${this.props.id}`);
            common.toast.toast('Copied track URL', 1);
          }
        }}>
        {this.props.name}
      </a>
    );
  }
}

class ModalHeader extends React.Component {
  public props: {
    albumId: string;
    albumName: string;
    trackId: string;
    trackName: string;
    coverSrc: string;
    artists: SpotifyUser[];
  };

  public render() {
    return (
      <div className='header'>
        <CoverArt id={this.props.albumId} name={this.props.albumName} src={this.props.coverSrc} />
        <div className='metadata'>
          <Title id={this.props.trackId} name={this.props.trackName} />
          <Artists list={this.props.artists} />
        </div>
      </div>
    );
  }
}

class DockIcons extends React.Component {
  public props: {
    shuffle: boolean;
    repeat: 'off' | 'context' | 'track';
    playing: boolean;
  };

  public async onShuffleClick(): Promise<void> {}

  public render() {
    return (
      <div className='icons'>
        <Icon
          title={`Shuffle ${shuffle ? 'on' : 'off'}`}
          classNames={`shuffle${shuffle ? ' active' : ''}`}
          d='M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z'
        />
        <Icon
          classNames='play-pause'
          d={playing ? 'M14,19H18V5H14M6,19H10V5H6V19Z' : 'M8,5.14V19.14L19,12.14L8,5.14Z'}
        />
      </div>
    );
  }
}

class ModalDock extends React.Component {
  public props: {
    shuffle: boolean;
    repeat: 'off' | 'context' | 'track';
    playing: boolean;
    dockComponents: { progressBar?: ProgressBar; timeDisplay?: PlaybackTimeDisplay };
  };

  public render() {
    return (
      <div className='dock'>
        {[this.props.dockComponents?.timeDisplay ? this.props.dockComponents.timeDisplay : <></>]}
        {[this.props.dockComponents?.progressBar ? this.props.dockComponents.progressBar : <></>]}
        <DockIcons
          shuffle={this.props.shuffle}
          repeat={this.props.repeat}
          playing={this.props.playing}
        />
      </div>
    );
  }
}

class ModalContainer extends React.Component {
  public state: {
    album: { id: string; name: string };
    track: { id: string; name: string };
    status: {
      repeat: 'off' | 'context' | 'track';
      shuffle: boolean;
      playing: boolean;
      active: boolean;
    };
    artists: SpotifyUser[];
    coverArtSrc: string;
    currentPos: number;
    endPos: number;
    dockComponents: { progressBar?: ProgressBar; timeDisplay?: PlaybackTimeDisplay };
  } = {
    album: { id: '', name: 'None' },
    track: { id: '', name: 'None' },
    status: { repeat: 'off', shuffle: false, playing: false, active: false },
    artists: [] as SpotifyUser[],
    coverArtSrc: '',
    dockComponents: {},
  };

  public render() {
    return (
      <div className={`spotify-modal${this.state.status.active ? ' inactive' : ''}`}>
        <ModalHeader
          albumId={this.state.album.id}
          trackId={this.state.track.id}
          albumName={this.state.album.name}
          trackName={this.state.track.name}
          coverSrc={this.state.coverArtSrc}
          artists={this.state.artists}
        />
        <ModalDock
          shuffle={this.state.status.shuffle}
          repeat={this.state.status.repeat}
          playing={this.state.status.playing}
          dockComponents={this.state.dockComponents}
        />
      </div>
    );
  }
} */