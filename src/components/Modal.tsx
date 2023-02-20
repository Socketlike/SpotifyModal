import { common } from 'replugged';
import { Controls } from './Controls';
import { ProgressContainer } from './ProgressDisplay';
import { TrackInfo } from './TrackInfo';
import { componentEventTarget, config, logger } from './global';
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
  const shouldShowControls = React.useRef<boolean>(
    config.get('controlsVisibilityState', 'auto') === 'always',
  );
  const shouldShowProgressDisplay = React.useRef<boolean>(
    config.get('progressDisplayVisibilityState', 'auto') === 'always',
  );
  const shouldShowSeekbar = React.useRef<boolean>(
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
  const [duration, setDuration] = React.useState<number>(
    typeof props?.state?.item?.duration_ms === 'number' ? props.state.item.duration_ms : 0,
  );
  const [playing, setPlaying] = React.useState<boolean>(
    typeof props?.state?.is_playing === 'boolean' ? props.state.is_playing : false,
  );
  const [timestamp, setTimestamp] = React.useState<number>(
    typeof props?.state?.timestamp === 'number' ? props.state.timestamp : 0,
  );
  const [progress, setProgress] = React.useState<number>(
    typeof props?.state?.progress_ms === 'number' ? props.state.progress_ms : 0,
  );
  const progressRef = React.useRef<number>(
    typeof props?.state?.progress_ms === 'number' ? props.state.progress_ms : 0,
  );
  const [shuffle, setShuffle] = React.useState<boolean>(false);
  const [repeat, setRepeat] = React.useState<'off' | 'context' | 'track'>('off');

  React.useEffect(() => {
    const stateUpdateListener = (event: CustomEvent<SpotifyWebSocketState>): void => {
      if (event.detail.item) {
        if (!shouldShowModal) setShouldShowModal(true);
        setTrack(event.detail.item);
        setDuration(event.detail.item.duration_ms);
        setProgress(event.detail.progress_ms);
        setTimestamp(event.detail.timestamp);
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

  React.useEffect((): (() => void) | void => {
    if (!elementRef?.current) return;

    const hoverListener = () => {
      if (config.get('controlsVisibilityState', 'auto') === 'auto')
        shouldShowControls.current = true;
      if (config.get('progressDisplayVisibilityState', 'auto') === 'auto')
        shouldShowProgressDisplay.current = true;
      if (config.get('seekbarVisibilityState', 'always') === 'auto')
        shouldShowSeekbar.current = true;

      componentEventTarget.dispatchEvent(
        new CustomEvent('componentsVisibilityUpdate', {
          detail: {
            controls: shouldShowControls.current,
            seekBar: shouldShowSeekbar.current,
            progressDisplay: shouldShowProgressDisplay.current,
          },
        }),
      );

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
      if (config.get('controlsVisibilityState', 'auto') === 'auto')
        shouldShowControls.current = false;
      if (config.get('progressDisplayVisibilityState', 'auto') === 'auto')
        shouldShowProgressDisplay.current = false;
      if (config.get('seekbarVisibilityState', 'always') === 'auto')
        shouldShowSeekbar.current = false;

      if (config.get('debuggingLogComponentsUpdates', false))
        logger.log(
          'Component update for modal component visibility:',
          `\n- Controls: ${config.get('controlsVisibilityState', 'auto') === 'always'};`,
          `\n- Progress display: ${
            config.get('progressDisplayVisibilityState', 'auto') === 'always'
          };`,
          `\n- Seek bar: ${config.get('seekbarVisibilityState', 'always') === 'always'};`,
        );

      componentEventTarget.dispatchEvent(
        new CustomEvent('componentsVisibilityUpdate', {
          detail: {
            controls: shouldShowControls.current,
            seekBar: shouldShowSeekbar.current,
            progressDisplay: shouldShowProgressDisplay.current,
          },
        }),
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
        shouldShowControls.current = ev.detail.state === 'always';
      else if (ev.detail.type === 'progressDisplayVisibilityState')
        shouldShowProgressDisplay.current = ev.detail.state === 'always';
      else if (ev.detail.type === 'seekbarVisibilityState')
        shouldShowSeekbar.current = ev.detail.state === 'always';

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

      componentEventTarget.dispatchEvent(
        new CustomEvent('componentsVisibilityUpdate', {
          detail: {
            controls: shouldShowControls.current,
            seekBar: shouldShowSeekbar.current,
            progressDisplay: shouldShowProgressDisplay.current,
          },
        }),
      );
    };

    elementRef.current.addEventListener('mouseenter', hoverListener);
    elementRef.current.addEventListener('mouseleave', leaveListener);
    componentEventTarget.addEventListener(
      'componentVisibilityUpdateSettings',
      componentVisibilityUpdateListener as EventListenerOrEventListenerObject,
    );

    return (): void => {
      if (elementRef?.current) {
        elementRef.current.removeEventListener('mouseenter', hoverListener);
        elementRef.current.removeEventListener('mouseleave', leaveListener);
        componentEventTarget.removeEventListener(
          'componentVisibilityUpdateSettings',
          componentVisibilityUpdateListener as EventListenerOrEventListenerObject,
        );
      }
    };
  }, []);

  return (
    <div
      className={`spotify-modal${shouldShowModal ? '' : ' hidden'}${getCustomThemeType()}`}
      ref={elementRef}>
      <TrackInfo track={track} />
      <div className='dock'>
        <ProgressContainer
          duration={duration}
          playing={playing}
          progress={progress}
          progressRef={progressRef}
          showProgress={shouldShowProgressDisplay}
          showSeekbar={shouldShowSeekbar}
          timestamp={timestamp}
        />
        <Controls
          duration={duration}
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
