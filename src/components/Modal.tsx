import { common } from 'replugged';
import { Controls } from './Controls';
import { ProgressContainer } from './ProgressDisplay';
import { TrackInfo } from './TrackInfo';
import { config, componentEventTarget } from './global';
import { ModalDispatchers, SpotifyTrack, SpotifyWebSocketState } from '../types';

const { React } = common;

export function Modal(props: { state?: SpotifyWebSocketState }): JSX.Element {
  const elementRef = React.useRef<HTMLDivElement>(null);

  const [shouldShowModal, setShouldShowModal] = React.useState<boolean>(
    typeof props?.state === 'object',
  );
  const [shouldShowControls, setShouldShowControls] = React.useState<boolean>(
    !['auto', 'hidden'].includes(config.get('controlsVisibilityState', 'auto')),
  );
  const [shouldShowProgressDisplay, setShouldShowProgressDisplay] = React.useState<boolean>(
    !['auto', 'hidden'].includes(config.get('progressDisplayVisibilityState', 'auto')),
  );
  const [shouldShowSeekbar, setShouldShowSeekbar] = React.useState<boolean>(
    !['auto', 'hidden'].includes(config.get('seekbarVisibilityState', 'always')),
  );
  const [track, setTrack] = React.useState<SpotifyTrack>(
    props?.state?.item
      ? props?.state?.item
      : ({
          album: { name: 'None', images: [{}] },
          artists: [{ name: 'None' }],
          name: 'None',
        } as SpotifyTrack),
  );
  const [duration, setDuration] = React.useState<number>(
    typeof props?.state?.item?.duration_ms === 'number' ? props.state.item.duration_ms : 0,
  );
  const [playing, setPlaying] = React.useState<boolean>(
    typeof props?.state?.is_playing === 'boolean' ? props.state.is_playing : false,
  );
  const progress = React.useRef<number>(
    typeof props?.state?.progress_ms === 'number' ? props.state.progress_ms : 0,
  );
  const [shuffle, setShuffle] = React.useState<boolean>(false);
  const [repeat, setRepeat] = React.useState<'off' | 'context' | 'track'>('off');
  const [dispatchers] = React.useState<ModalDispatchers>(
    () => ({
      artistRightClick: (name: string, id?: string): boolean =>
        componentEventTarget.dispatchEvent(
          new CustomEvent('artistRightClick', { detail: { name, id } }),
        ),
      coverArtRightClick: (name: string, id?: string): boolean =>
        componentEventTarget.dispatchEvent(
          new CustomEvent('coverArtRightClick', { detail: { name, id } }),
        ),
      playPauseClick: (event: React.MouseEvent, currentState: boolean): boolean =>
        componentEventTarget.dispatchEvent(
          new CustomEvent<{ event: React.MouseEvent; currentState: boolean }>('playPauseClick', {
            detail: { event, currentState },
          }),
        ),
      repeatClick: (event: React.MouseEvent, currentState: 'off' | 'context' | 'track'): boolean =>
        componentEventTarget.dispatchEvent(
          new CustomEvent<{ event: React.MouseEvent; currentState: 'off' | 'context' | 'track' }>(
            'repeatClick',
            { detail: { event, currentState } },
          ),
        ),
      seeked: (newProgress: number): boolean =>
        componentEventTarget.dispatchEvent(new CustomEvent('seeked', { detail: newProgress })),
      shuffleClick: (event: React.MouseEvent, currentState: boolean): boolean =>
        componentEventTarget.dispatchEvent(
          new CustomEvent<{ event: React.MouseEvent; currentState: boolean }>('shuffleClick', {
            detail: { event, currentState },
          }),
        ),
      skipNextClick: (event: React.MouseEvent): boolean =>
        componentEventTarget.dispatchEvent(
          new CustomEvent<React.MouseEvent>('skipNextClick', { detail: event }),
        ),
      skipPrevClick: (
        event: React.MouseEvent,
        currentProgress: number,
        currentDuration: number,
      ): boolean =>
        componentEventTarget.dispatchEvent(
          new CustomEvent<{
            currentProgress: number;
            currentDuration: number;
            event: React.MouseEvent;
          }>('skipPrevClick', {
            detail: { currentDuration, currentProgress, event },
          }),
        ),
      titleRightClick: (name: string, id?: string): boolean =>
        componentEventTarget.dispatchEvent(
          new CustomEvent('titleRightClick', { detail: { name, id } }),
        ),
    }),
  );

  React.useEffect(() => {
    const stateUpdateListener = (event: CustomEvent<SpotifyWebSocketState>): void => {
      if (event.detail.item) {
        if (!shouldShowModal) setShouldShowModal(true);
        setTrack(event.detail.item);
        setDuration(event.detail.item.duration_ms);
        progress.current = event.detail.progress_ms;
        setPlaying(event.detail.is_playing);
        setShuffle(event.detail.shuffle_state);
        setRepeat(event.detail.repeat_state);
      }
    };

    const shouldShowListener = (event: CustomEvent<boolean>): void => {
      setShouldShowModal(event.detail);
      if (!event.detail) setPlaying(false);
    };

    componentEventTarget.addEventListener(
      'stateUpdate',
      stateUpdateListener as EventListenerOrEventListenerObject,
    );
    componentEventTarget.addEventListener(
      'shouldShowUpdate',
      shouldShowListener as EventListenerOrEventListenerObject,
    );

    return () => {
      componentEventTarget.removeEventListener(
        'stateUpdate',
        stateUpdateListener as EventListenerOrEventListenerObject,
      );
      componentEventTarget.removeEventListener(
        'shouldShowUpdate',
        shouldShowListener as EventListenerOrEventListenerObject,
      );
    };
  }, []);

  React.useEffect((): (() => void) => {
    if (!elementRef?.current) return;

    const hoverListener = () => {
      if (config.get('controlsVisibilityState', 'auto') === 'auto') setShouldShowControls(true);
      if (config.get('progressDisplayVisibilityState', 'auto') === 'auto')
        setShouldShowProgressDisplay(true);
      if (config.get('seekbarVisibilityState', 'always') === 'auto') setShouldShowSeekbar(true);
    };

    const leaveListener = () => {
      if (config.get('controlsVisibilityState', 'auto') === 'auto') setShouldShowControls(false);
      if (config.get('progressDisplayVisibilityState', 'auto') === 'auto')
        setShouldShowProgressDisplay(false);
      if (config.get('seekbarVisibilityState', 'always') === 'auto') setShouldShowSeekbar(false);
    };

    const componentVisibilityUpdateListener = (
      ev: CustomEvent<{
        type:
          | 'controlsVisibilityState'
          | 'progressDisplayVisibilityState'
          | 'seekbarVisibilityState';
        state: 'auto' | 'hidden' | 'always';
      }>,
    ): void => {
      (() => {
        if (ev.detail.type === 'controlsVisibilityState') return setShouldShowControls;
        else if (ev.detail.type === 'progressDisplayVisibilityState')
          return setShouldShowProgressDisplay;
        else if (ev.detail.type === 'seekbarVisibilityState') return setShouldShowSeekbar;
      })()(!['auto', 'hidden'].includes(ev.detail.state));
    };

    elementRef.current.addEventListener('mouseenter', hoverListener);
    elementRef.current.addEventListener('mouseleave', leaveListener);
    componentEventTarget.addEventListener(
      'componentVisibilityUpdate',
      componentVisibilityUpdateListener as EventListenerOrEventListenerObject,
    );

    return (): void => {
      if (elementRef?.current) {
        elementRef.current.removeEventListener('mouseenter', hoverListener);
        elementRef.current.removeEventListener('mouseleave', leaveListener);
        componentEventTarget.removeEventListener(
          'componentVisibilityUpdate',
          componentVisibilityUpdateListener as EventListenerOrEventListenerObject,
        );
      }
    };
  }, [elementRef]);

  return (
    <div className={`spotify-modal${shouldShowModal ? '' : ' hidden'}`} ref={elementRef}>
      <TrackInfo dispatchers={dispatchers} track={track} />
      <div className='dock'>
        <ProgressContainer
          duration={duration}
          dispatchers={dispatchers}
          playing={playing}
          progress={progress}
          showProgress={shouldShowProgressDisplay}
          showSeekbar={shouldShowSeekbar}
        />
        <Controls
          duration={duration}
          dispatchers={dispatchers}
          playing={playing}
          progress={progress}
          shuffle={shuffle}
          repeat={repeat}
          shouldShow={shouldShowControls}
          track={track}
        />
      </div>
    </div>
  );
}
