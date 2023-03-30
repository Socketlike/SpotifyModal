import { common } from 'replugged';
import { dispatchEvent, listenToEvent, paths } from './global';

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
        controls: boolean;
        seekBar: boolean;
        progressDisplay: boolean;
      }>('componentsVisibilityUpdate', (ev) => {
        if (ev.detail.controls === !controlsRef.current.classList.contains('hidden')) return;

        if (ev.detail.controls) controlsRef.current.classList.remove('hidden');
        else controlsRef.current.classList.add('hidden');
      }),
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
        path={paths.shuffle}
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
        path={paths.skipPrevious}
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
        path={props.playing ? paths.pause : paths.play}
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
        path={paths.skipNext}
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
        path={props.repeat !== 'track' ? paths.repeatAll : paths.repeatOne}
        title={`Repeat ${props.repeat !== 'context' ? props.repeat : 'all'}`}
      />
    </div>
  );
}
