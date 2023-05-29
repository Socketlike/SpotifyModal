import { common } from 'replugged';
import { dispatchEvent, listenToEvent, toggleClass } from '@?utils';
import {
  mdiPause,
  mdiPlay,
  mdiRepeat,
  mdiRepeatOnce,
  mdiShuffle,
  mdiSkipNext,
  mdiSkipPrevious,
} from '@mdi/js';

const { React } = common;

function ControlButton(props: {
  className?: string;
  onClick?: (mouseEvent: React.MouseEvent) => unknown;
  title?: string;
  path: string;
}): JSX.Element {
  return (
    <svg
      className={`icon${typeof props.className === 'string' ? ` ${props.className}` : ''}`}
      onClick={typeof props.onClick === 'function' ? props.onClick : null}
      viewBox='0 0 24 24'>
      <title>{typeof props.title === 'string' ? props.title : ''}</title>
      <path fill='currentColor' d={props.path} />
    </svg>
  );
}

export function Controls(props: {
  duration: number;
  playing: boolean;
  progress: React.MutableRefObject<number>;
  shuffle: boolean;
  repeat: 'off' | 'context' | 'track';
  shouldShow: React.MutableRefObject<boolean>;
  track: Spotify.Track;
}): JSX.Element {
  const controlsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(
    (): (() => void) =>
      listenToEvent<{
        shouldShowControls: boolean;
      }>('componentsVisibilityUpdate', (ev) =>
        /* We invert event.detail.<element> here because true is show and false is hidden;
           The toggleClass function takes true as add and false as remove */
        toggleClass(controlsRef.current, 'hidden', !ev.detail.shouldShowControls),
      ),
    [],
  );

  return (
    <div className={`controls${props.shouldShow.current ? '' : ' hidden'}`} ref={controlsRef}>
      <ControlButton
        className={`shuffle${props.shuffle ? ' active' : ''}`}
        onClick={(event: React.MouseEvent): void =>
          dispatchEvent('controlInteraction', {
            event,
            type: 'shuffle',
            currentState: props.shuffle,
          })
        }
        path={mdiShuffle}
        title={`Shuffle ${props.shuffle ? 'on' : 'off'}`}
      />
      <ControlButton
        className='skip-prev'
        onClick={(event: React.MouseEvent): void =>
          dispatchEvent('controlInteraction', {
            event,
            type: 'skipPrev',
            currentProgress: props.progress.current,
            currentDuration: props.duration,
          })
        }
        path={mdiSkipPrevious}
        title='Skip to previous track'
      />
      <ControlButton
        className='play-pause'
        onClick={(event: React.MouseEvent): void =>
          dispatchEvent('controlInteraction', {
            event,
            type: 'playPause',
            currentState: props.playing,
          })
        }
        path={props.playing ? mdiPause : mdiPlay}
        title={`${props.playing ? 'Pause' : 'Resume'} track`}
      />
      <ControlButton
        className='skip-next'
        onClick={(event: React.MouseEvent): void =>
          dispatchEvent('controlInteraction', {
            event,
            type: 'skipNext',
          })
        }
        path={mdiSkipNext}
        title='Skip to next track'
      />
      <ControlButton
        className={`repeat${props.repeat !== 'off' ? ' active' : ''}`}
        onClick={(event: React.MouseEvent): void =>
          dispatchEvent('controlInteraction', {
            event,
            type: 'repeat',
            currentState: props.repeat,
          })
        }
        path={props.repeat !== 'track' ? mdiRepeat : mdiRepeatOnce}
        title={`Repeat ${props.repeat !== 'context' ? props.repeat : 'all'}`}
      />
    </div>
  );
}
