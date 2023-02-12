import { ModalDispatchers, SpotifyTrack } from '../types';
import { paths } from './global';

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
  dispatchers: ModalDispatchers;
  playing: boolean;
  progress: React.MutableRefObject<number>;
  shuffle: boolean;
  repeat: 'off' | 'context' | 'track';
  shouldShow: boolean;
  track: SpotifyTrack;
}): JSX.Element {
  return (
    <div className={`controls${props.shouldShow ? '' : ' hidden'}`}>
      <Icon
        className={`shuffle${props.shuffle ? ' active' : ''}`}
        onClick={(e: React.MouseEvent): boolean => props.dispatchers.shuffleClick(e, props.shuffle)}
        path={paths.shuffle}
        title={`Shuffle ${props.shuffle ? 'on' : 'off'}`}
      />
      <Icon
        className='skip-prev'
        onClick={(e: React.MouseEvent): boolean =>
          props.dispatchers.skipPrevClick(e, props.progress.current, props.duration)
        }
        path={paths.skipPrevious}
        title='Skip to previous track'
      />
      <Icon
        className='play-pause'
        onClick={(e: React.MouseEvent): boolean =>
          props.dispatchers.playPauseClick(e, props.playing)
        }
        path={props.playing ? paths.pause : paths.play}
        title={`${props.playing ? 'Pause' : 'Resume'} track`}
      />
      <Icon
        className='skip-next'
        onClick={props.dispatchers.skipNextClick}
        path={paths.skipNext}
        title='Skip to next track'
      />
      <Icon
        className={`repeat${props.repeat !== 'off' ? ' active' : ''}`}
        onClick={(e: React.MouseEvent): boolean => props.dispatchers.repeatClick(e, props.repeat)}
        path={props.repeat !== 'track' ? paths.repeatAll : paths.repeatOne}
        title={`Repeat ${props.repeat !== 'context' ? props.repeat : 'all'}`}
      />
    </div>
  );
}
