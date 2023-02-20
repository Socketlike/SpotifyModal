import { common, components } from 'replugged';
import { ModalDispatchers, SpotifyTrack } from '../types';
import { componentEventTarget, paths } from './global';

const { React } = common;

function Icon(props: {
  className?: string;
  fill?: string;
  onClick?: (mouseEvent: React.MouseEvent) => unknown;
  title?: string;
  path: string;
}): JSX.Element {
  return (
    <svg
      className={typeof props.className === 'string' ? props.className : ''}
      onClick={typeof props.onClick === 'function' ? props.onClick : null}
      viewBox='0 0 24 24'>
      <title>{typeof props.title === 'string' ? props.title : ''}</title>
      <path fill={typeof props.fill === 'string' ? props.fill : 'currentColor'} d={props.path} />
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
  track: SpotifyTrack;
}): JSX.Element {
  const controlsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect((): (() => void) | void => {
    if (!controlsRef?.current) return;

    const updateListener = (
      ev: CustomEvent<{ controls: boolean; seekBar: boolean; progressDisplay: boolean }>,
    ) => {
      if (!ev.detail.controls !== controlsRef.current.classList.contains('hidden')) {
        if (ev.detail.controls) controlsRef.current.classList.remove('hidden');
        else controlsRef.current.classList.add('hidden');
      }
    };

    componentEventTarget.addEventListener(
      'componentsVisibilityUpdate',
      updateListener as EventListenerOrEventListenerObject,
    );

    return (): void =>
      componentEventTarget.removeEventListener(
        'componentsVisibilityUpdate',
        updateListener as EventListenerOrEventListenerObject,
      );
  }, []);

  return (
    <div className={`controls${props.shouldShow.current ? '' : ' hidden'}`} ref={controlsRef}>
      <Icon
        className={`shuffle${props.shuffle ? ' active' : ''}`}
        onClick={(event: React.MouseEvent): boolean =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('shuffleClick', {
              detail: {
                event,
                currentState: props.shuffle,
              },
            }),
          )
        }
        path={paths.shuffle}
        title={`Shuffle ${props.shuffle ? 'on' : 'off'}`}
      />
      <Icon
        className='skip-prev'
        onClick={(event: React.MouseEvent): boolean =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('skipPrevClick', {
              detail: {
                event,
                currentProgress: props.progress.current,
                currentDuration: props.duration,
              },
            }),
          )
        }
        path={paths.skipPrevious}
        title='Skip to previous track'
      />
      <Icon
        className='play-pause'
        onClick={(event: React.MouseEvent): boolean =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('playPauseClick', {
              detail: {
                event,
                currentState: props.playing,
              },
            }),
          )
        }
        path={props.playing ? paths.pause : paths.play}
        title={`${props.playing ? 'Pause' : 'Resume'} track`}
      />
      <Icon
        className='skip-next'
        onClick={(event: React.MouseEvent): boolean =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('skipNextClick', {
              detail: event,
            }),
          )
        }
        path={paths.skipNext}
        title='Skip to next track'
      />
      <Icon
        className={`repeat${props.repeat !== 'off' ? ' active' : ''}`}
        onClick={(event: React.MouseEvent): boolean =>
          componentEventTarget.dispatchEvent(
            new CustomEvent('repeatClick', {
              detail: {
                event,
                currentState: props.repeat,
              },
            }),
          )
        }
        path={props.repeat !== 'track' ? paths.repeatAll : paths.repeatOne}
        title={`Repeat ${props.repeat !== 'context' ? props.repeat : 'all'}`}
      />
    </div>
  );
}
