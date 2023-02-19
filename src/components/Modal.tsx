import { common } from 'replugged';
import { Controls } from './Controls';
import { ProgressContainer } from './ProgressDisplay';
import { TrackInfo } from './TrackInfo';
import { config, componentEventTarget, logger } from './global';
import { ModalDispatchers, SpotifyTrack, SpotifyWebSocketState } from '../types';

const { React } = common;

function getCustomThemeType(): string {
  const html = document.getElementsByTagName('html')[0] as HTMLHtmlElement;

  if (html.classList.contains('theme-custom')) {
    if (html.classList.contains('theme-dark')) return ' custom-dark';
    else if (html.classList.contains('theme-light')) return ' custom-light';
  }

  return '';
}

export function Modal(props: { state?: SpotifyWebSocketState }): JSX.Element {
  const elementRef = React.useRef<HTMLDivElement>(null);

  const [shouldShowModal, setShouldShowModal] = React.useState<boolean>(
    typeof props?.state === 'object',
  );
  const [shouldShowControls, setShouldShowControls] = React.useState<boolean>(
    config.get('controlsVisibilityState', 'auto') === 'always',
  );
  const [shouldShowProgressDisplay, setShouldShowProgressDisplay] = React.useState<boolean>(
    config.get('progressDisplayVisibilityState', 'auto') === 'always',
  );
  const [shouldShowSeekbar, setShouldShowSeekbar] = React.useState<boolean>(
    config.get('seekbarVisibilityState', 'always') === 'always',
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
  const [timestamp, setTimestamp] = React.useState<number>(
    typeof props?.state?.timestamp === 'number' ? props.state.timestamp : 0,
  );
  const [duration, setDuration] = React.useState<number>(
    typeof props?.state?.item?.duration_ms === 'number' ? props.state.item.duration_ms : 0,
  );
  const [playing, setPlaying] = React.useState<boolean>(
    typeof props?.state?.is_playing === 'boolean' ? props.state.is_playing : false,
  );
  const [progress, setProgress] = React.useState<number>(
    typeof props?.state?.progress_ms === 'number' ? props.state.progress_ms : 0,
  );
  const progressRef = React.useRef<number>(
    typeof props?.state?.progress_ms === 'number' ? props.state.progress_ms : 0,
  );
  const [shuffle, setShuffle] = React.useState<boolean>(false);
  const [repeat, setRepeat] = React.useState<'off' | 'context' | 'track'>('off');
  const [dispatchers] = React.useState<ModalDispatchers>(() => ({
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
  }));

  React.useEffect(() => {
    const stateUpdateListener = (event: CustomEvent<SpotifyWebSocketState>): void => {
      if (event.detail.item) {
        if (!shouldShowModal) setShouldShowModal(true);
        setTrack(event.detail.item);
        setTimestamp(event.detail.timestamp);
        setDuration(event.detail.item.duration_ms);
        setProgress(event.detail.progress_ms);
        setPlaying(event.detail.is_playing);
        setShuffle(event.detail.shuffle_state);
        setRepeat(event.detail.repeat_state);

        if (config.get('debuggingLogComponentsUpdates', false))
          logger.log('Component update for new state', event.detail);
      }
    };

    const shouldShowListener = (event: CustomEvent<boolean>): void => {
      setShouldShowModal(event.detail);
      if (!event.detail) setPlaying(false);

      if (config.get('debuggingLogComponentsUpdates', false))
        logger.log('Component update for modal visibility', event.detail);
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

      if (config.get('debuggingLogComponentsUpdates', false))
        logger.log(
          'Component update for modal component visibility:',
          `\n- Controls: ${['auto', 'always'].includes(
            config.get('controlsVisibilityState', 'auto'),
          )};`,
          `\n- Progress display: ${['auto', 'always'].includes(
            config.get('progressDisplayVisibilityState', 'auto'),
          )};`,
          `\n- Seek bar: ${['auto', 'always'].includes(
            config.get('seekbarVisibilityState', 'always'),
          )};`,
        );
    };

    const leaveListener = () => {
      if (config.get('controlsVisibilityState', 'auto') === 'auto') setShouldShowControls(false);
      if (config.get('progressDisplayVisibilityState', 'auto') === 'auto')
        setShouldShowProgressDisplay(false);
      if (config.get('seekbarVisibilityState', 'always') === 'auto') setShouldShowSeekbar(false);

      if (config.get('debuggingLogComponentsUpdates', false))
        logger.log(
          'Component update for modal component visibility:',
          `\n- Controls: ${config.get('controlsVisibilityState', 'auto') === 'always'};`,
          `\n- Progress display: ${
            config.get('progressDisplayVisibilityState', 'auto') === 'always'
          };`,
          `\n- Seek bar: ${config.get('seekbarVisibilityState', 'always') === 'always'};`,
        );
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
      if (ev.detail.type === 'controlsVisibilityState')
        setShouldShowControls(ev.detail.state === 'always');
      else if (ev.detail.type === 'progressDisplayVisibilityState')
        setShouldShowProgressDisplay(ev.detail.state === 'always');
      else if (ev.detail.type === 'seekbarVisibilityState')
        setShouldShowSeekbar(ev.detail.state === 'always');

      if (config.get('debuggingLogComponentsUpdates', false))
        logger.log(
          'Component update for modal component visbility (set by settings):',
          `\n- ${
            {
              controlsVisibilityState: 'Controls',
              progressDisplayVisibilityState: 'Progress display',
              seekbarVisibilityState: 'Seek bar',
            }[ev.detail.type]
          }: ${ev.detail.state === 'always'}`,
        );
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
    <div
      className={`spotify-modal${shouldShowModal ? '' : ' hidden'}${getCustomThemeType()}`}
      ref={elementRef}>
      <TrackInfo dispatchers={dispatchers} track={track} />
      <div className='dock'>
        <ProgressContainer
          duration={duration}
          dispatchers={dispatchers}
          playing={playing}
          progress={progress}
          progressRef={progressRef}
          showProgress={shouldShowProgressDisplay}
          showSeekbar={shouldShowSeekbar}
          timestamp={timestamp}
        />
        <Controls
          duration={duration}
          dispatchers={dispatchers}
          playing={playing}
          progress={progressRef}
          shuffle={shuffle}
          repeat={repeat}
          shouldShow={shouldShowControls}
          track={track}
        />
      </div>
    </div>
  );
}
