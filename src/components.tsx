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

const componentEventTarget = new EventTarget();
const ModalContext = React.createContext();

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
  current: number;
  duration: number;
  modifyCurrent: (pos: number | ((prev: number) => number)) => void;
}): React.Element {
  return (
    <div
      className='progress-bar'
      onClick={(mouseEvent: React.MouseEvent): void => {
        const percent = mouseEvent.nativeEvent.offsetX / mouseEvent.currentTarget.offsetWidth;
        componentEventTarget.dispatchEvent(
          new CustomEvent('progressBarClick', {
            detail: {
              duration: props.duration,
              modifyCurrent: props.modifyCurrent,
              mouseEvent,
              percent,
            },
          }),
        );
      }}>
      <div
        className='inner'
        style={{
          width: `${props.duration ? ((props.current / props.duration) * 100).toFixed(4) : '0'}%`,
        }}></div>
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

function ProgressContainer(): React.Element {
  const context = React.useContext(ModalContext);

  React.useEffect((): void | (() => void) => {
    if (!context.playing) return;
    const interval = setInterval(() => {
      context.modify.current((previous: number): number => {
        if (previous < context.duration) return previous + 500;
        else return context.duration;
      });
    }, 500);
    return () => clearInterval(interval);
  });

  return (
    <div className='progress-container'>
      <ProgressDisplay current={context.current} duration={context.duration} />
      <ProgressBar
        current={context.current}
        duration={context.duration}
        modifyCurrent={context.modify.current}
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
      <path fill='currentColor' d={props.path} />
    </svg>
  );
}

function Icons(): React.Element {
  const context = React.useContext(ModalContext);

  return (
    <div className='icons'>
      <Icon
        path='M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z'
        className={`shuffle${context.shuffle ? ' active' : ''}`}
        onClick={(mouseEvent: React.MouseEvent): void =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('shuffleClick', {
              detail: {
                mouseEvent,
                currentState: context.shuffle,
                modifyState: context.modify.shuffle,
              },
            }),
          )
        }
        title={`Shuffle ${context.shuffle ? 'on' : 'off'}`}
      />
      <Icon
        path='M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z'
        className='skip-prev'
        onClick={(mouseEvent: React.MouseEvent): void =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('skipPrevClick', {
              detail: {
                mouseEvent,
                currentPos: context.current,
                modifyCurrent: context.modify.current,
              },
            }),
          )
        }
      />
      <Icon
        path={context.playing ? 'M14,19H18V5H14M6,19H10V5H6V19Z' : 'M8,5.14V19.14L19,12.14L8,5.14Z'}
        className='play-pause'
        onClick={(mouseEvent: React.MouseEvent): void =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('playPauseClick', {
              detail: {
                mouseEvent,
                currentState: context.playing,
                modifyState: context.modify.playing,
              },
            }),
          )
        }
      />
      <Icon
        path='M16,18H18V6H16M6,18L14.5,12L6,6V18Z'
        className='skip-next'
        onClick={(mouseEvent: React.MouseEvent): void =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('skipNextClick', { detail: { mouseEvent } }),
          )
        }
      />
      <Icon
        path={
          context.repeat !== 'track'
            ? 'M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z'
            : 'M13,15V9H12L10,10V11H11.5V15M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z'
        }
        className={`repeat${context.repeat !== 'off' ? ' active' : ''}`}
        onClick={(mouseEvent): void =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('repeatClick', {
              detail: {
                mouseEvent,
                currentState: context.repeat,
                modifyState: context.modify.repeat,
              },
            }),
          )
        }
        title={`Repeat ${context.repeat === 'context' ? 'all' : context.repeat}`}
      />
    </div>
  );
}

function Artists(): React.Element {
  const context = React.useContext(ModalContext);

  return (
    <span className='artists'>
      {Array.isArray(context.artists)
        ? context.artists.map((artist, index): React.Fragment => {
            if (artist.id)
              return (
                <>
                  <a
                    className='artist'
                    title={artist.name}
                    onContextMenu={(): void =>
                      componentEventTarget.dispatchEvent(
                        new CustomEvent('artistRightClick', { detail: artist }),
                      )
                    }
                    href={`https://open.spotify.com/artist/${artist.id}`}
                    target='_blank'>
                    {artist.name}
                  </a>
                  {index !== context.artists.length - 1 ? <>, </> : <></>}
                </>
              );
            return (
              <>
                {artist.name}
                {index !== context.artists.length - 1 ? <>, </> : <></>}
              </>
            );
          })
        : None}
    </span>
  );
}

function Header(): React.Element {
  const context = React.useContext(ModalContext);

  return (
    <div
      className={`header${!context.shouldShow ? ' hidden' : ''}${
        context.header ? ` ${context.header}` : ''
      }`}>
      <img
        className={`cover-art${typeof context.album.id === 'string' ? ' href' : ''}`}
        src={typeof context.coverArt === 'string' ? context.coverArt : ''}
        title={context.album.id ? context.album.name : ''}
        onContextMenu={(): void =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('coverArtRightClick', { detail: context.album }),
          )
        }
        onClick={(): void =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('coverArtClick', { detail: context.album }),
          )
        }
      />
      <div className='song-info'>
        <a
          className={`title${typeof context.track.id === 'string' ? ' href' : ''}`}
          title={context.track.name}
          onContextMenu={(): void =>
            componentEventTarget.dispatchEvent(
              new CustomEvent('titleRightClick', { detail: context.track }),
            )
          }
          href={
            typeof context.track.id === 'string'
              ? `https://open.spotify.com/track/${context.track.id}`
              : ''
          }
          target='_blank'>
          {context.track.name}
        </a>
        <Artists />
      </div>
    </div>
  );
}

function Modal(props: {
  additionalHeaderClasses: string;
  track?: { name: string; id?: string };
  album?: { name: string; id?: string };
  current?: number;
  duration?: number;
  playing?: boolean;
  shuffle?: boolean;
  shouldShow?: boolean;
  repeat?: 'off' | 'context' | 'track';
  artists?: SpotifyUser[];
  coverArt?: string;
}): React.Element {
  const [track, setTrack] = React.useState(props.track ? props.track : { name: 'None' });
  const [album, setAlbum] = React.useState(props.album ? props.album : { name: 'None' });
  const [current, setCurrent] = React.useState(
    typeof props.current === 'number' ? props.current : 0,
  );
  const [duration, setDuration] = React.useState(
    typeof props.duration === 'number' ? props.duration : 0,
  );
  const [playing, setPlaying] = React.useState(
    typeof props.playing === 'boolean' ? props.playing : false,
  );
  const [shuffle, setShuffle] = React.useState(
    typeof props.shuffle === 'boolean' ? props.shuffle : false,
  );
  const [shouldShow, setShouldShow] = React.useState(
    typeof props.shouldShow === 'boolean' ? props.shouldShow : false,
  );
  const [repeat, setRepeat] = React.useState(
    ['off', 'context', 'track'].includes(props.repeat) ? props.repeat : 'off',
  );
  const [artists, setArtists] = React.useState(
    Array.isArray(props.artists) ? props.artists : [{ name: 'None' }],
  );
  const [coverArt, setCoverArt] = React.useState(
    typeof props.coverArt === 'string' ? props.coverArt : '',
  );

  const modify = {
    metadata: (
      trackMeta?: { name: string; id?: string },
      albumMeta?: { name: string; id?: string },
      artists?: SpotifyUser[],
      coverArt?: string,
    ): void => {
      setTrack({
        name: typeof trackMeta?.name === 'string' ? trackMeta.name : 'None',
        id: typeof trackMeta?.id === 'string' ? trackMeta.id : undefined,
      });
      setAlbum({
        name: typeof albumMeta?.name === 'string' ? albumMeta.name : 'None',
        id: typeof albumMeta?.id === 'string' ? albumMeta.id : undefined,
      });
      setArtists(Array.isArray(artists) ? artists : [{ name: 'None' }]);
      setCoverArt(typeof coverArt === 'string' ? coverArt : '');
    },
    playbackTime: (current?: number, duration?: number): void => {
      setCurrent(typeof current === 'number' ? current : 0);
      setDuration(typeof duration === 'number' ? duration : 0);
    },
    all: (
      trackMeta?: { name: string; id?: string },
      albumMeta?: { name: string; id?: string },
      artists?: SpotifyUser[],
      coverArt?: string,
      current?: number,
      duration?: number,
      playing?: boolean,
      shuffle?: boolean,
      repeat?: 'off' | 'context' | 'track',
    ): void => {
      setTrack({
        name: typeof trackMeta?.name === 'string' ? trackMeta.name : 'None',
        id: typeof trackMeta?.id === 'string' ? trackMeta.id : undefined,
      });
      setAlbum({
        name: typeof albumMeta?.name === 'string' ? albumMeta.name : 'None',
        id: typeof albumMeta?.id === 'string' ? albumMeta.id : undefined,
      });
      setArtists(Array.isArray(artists) ? artists : [{ name: 'None' }]);
      setCoverArt(typeof coverArt === 'string' ? coverArt : '');
      setCurrent(typeof current === 'number' ? current : 0);
      setDuration(typeof duration === 'number' ? duration : 0);
      setPlaying(typeof playing === 'boolean' ? playing : false);
      setShuffle(typeof shuffle === 'boolean' ? shuffle : false);
      setRepeat(['off', 'context', 'track'].includes(repeat) ? repeat : 'off');
    },
    current: (pos: number | ((prev: number) => number)): void => {
      if ((typeof pos !== 'number' && typeof pos !== 'function') || pos === current) return;
      if (typeof pos === 'number' && pos >= duration) setCurrent(duration);
      else setCurrent(pos);
    },
    duration: (pos: number): void => {
      if (typeof pos !== 'number' || pos === duration) return;
      setDuration(pos);
    },
    playing: (state: boolean | ((previous: boolean) => boolean)): void => {
      if ((typeof state !== 'boolean' && typeof state !== 'function') || state === playing) return;
      setPlaying(state);
    },
    shuffle: (state: boolean | ((previous: boolean) => boolean)): void => {
      if ((typeof state !== 'boolean' && typeof state !== 'function') || state === shuffle) return;
      setShuffle(state);
    },
    shouldShow: (state: boolean | ((previous: boolean) => boolean)): void => {
      if ((typeof state !== 'boolean' && typeof state !== 'function') || state === shouldShow)
        return;
      setShouldShow(state);
    },
    repeat: (
      state: 'off' | 'context' | 'track' | ((previous: 'off' | 'context' | 'track') => boolean),
    ): void => {
      if (
        (!['off', 'context', 'track'].includes(state) || state === repeat) &&
        typeof state !== 'function'
      )
        return;
      setRepeat(state);
    },
  };

  React.useEffect(() => {
    const metadataChangeListener = (
      event: CustomEvent<{
        track?: { name: string; id?: string };
        album?: { name: string; id?: string };
        artists?: SpotifyUser[];
        coverArt?: string;
      }>,
    ): void =>
      modify.metadata(
        event.detail?.track,
        event.detail?.album,
        event.detail?.artists,
        event.detail?.coverArt,
      );

    const playbackTimeChangeListener = (
      event: CustomEvent<{
        current?: number;
        duration?: number;
      }>,
    ): void => modify.playbackTime(event.detail?.current, event.detail?.duration);

    const allChangeListener = (
      event: CustomEvent<{
        track?: { name: string; id?: string };
        album?: { name: string; id?: string };
        artists?: SpotifyUser[];
        coverArt?: string;
        current?: number;
        duration?: number;
        playing?: boolean;
        shuffle?: boolean;
        repeat?: 'off' | 'context' | 'track';
      }>,
    ): void =>
      modify.all(
        event.detail?.track,
        event.detail?.album,
        event.detail?.artists,
        event.detail?.coverArt,
        event.detail?.current,
        event.detail?.duration,
        event.detail?.playing,
        event.detail?.shuffle,
        event.detail?.repeat,
      );

    const shouldShowListener = (
      event: CustomEvent<boolean | ((previous: boolean) => boolean)>,
    ): void => modify.shouldShow(event.detail);

    componentEventTarget.addEventListener('allChange', allChangeListener);
    componentEventTarget.addEventListener('metadataChange', metadataChangeListener);
    componentEventTarget.addEventListener('playbackTimeChange', playbackTimeChangeListener);
    componentEventTarget.addEventListener('shouldShowChange', shouldShowListener);

    return () => {
      componentEventTarget.removeEventListener('allChange', allChangeListener);
      componentEventTarget.removeEventListener('metadataChange', metadataChangeListener);
      componentEventTarget.removeEventListener('playbackTimeChange', playbackTimeChangeListener);
      componentEventTarget.removeEventListener('shouldShowChange', shouldShowListener);
    };
  }, []);

  return (
    <ModalContext.Provider
      value={{
        header: props.additionalHeaderClasses,
        track,
        album,
        current,
        duration,
        playing,
        shuffle,
        repeat,
        artists,
        coverArt,
        modify,
      }}>
      <Header />
      <div className={`dock${!shouldShow ? ' hidden' : ''}`}>
        <ProgressContainer />
        <Icons />
      </div>
    </ModalContext.Provider>
  );
}

export {
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
