import { common } from 'replugged';
import { Controls } from './Controls';
import { ProgressContainer } from './ProgressDisplay';
import { TrackInfo } from './TrackInfo';
import { componentEventTarget, config, defaultConfig, logger } from './global';
import { SpotifyTrack, SpotifyWebSocketState } from '../types';

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
  const persistRef = React.useRef<{ value: boolean }>(null);

  const shouldShowModal = React.useRef<boolean>(typeof props?.state === 'object');
  const setShouldShowModal = React.useMemo<(newState: boolean) => void>((): ((
    newValue: boolean,
  ) => void) => {
    return (newState: boolean): void => {
      if (shouldShowModal.current === newState) return;

      shouldShowModal.current = newState;
      if (shouldShowModal.current !== !elementRef.current.classList.contains('hidden')) {
        if (shouldShowModal.current) elementRef.current.classList.remove('hidden');
        else elementRef.current.classList.add('hidden');
      }
    };
  }, []);

  const shouldShowControls = React.useRef<boolean>(
    config.get('controlsVisibilityState', defaultConfig.controlsVisibilityState) === 'always',
  );
  const setShouldShowControls = React.useMemo<(newState: boolean) => void>((): ((
    newState: boolean,
  ) => void) => {
    return (newState: boolean): void => {
      if (shouldShowControls.current !== newState) shouldShowControls.current = newState;
    };
  }, []);

  const shouldShowProgressDisplay = React.useRef<boolean>(
    config.get('progressDisplayVisibilityState', defaultConfig.progressDisplayVisibilityState) ===
      'always',
  );
  const setShouldShowProgressDisplay = React.useMemo<(newState: boolean) => void>((): ((
    newState: boolean,
  ) => void) => {
    return (newState: boolean): void => {
      if (shouldShowProgressDisplay.current !== newState)
        shouldShowProgressDisplay.current = newState;
    };
  }, []);

  const shouldShowSeekbar = React.useRef<boolean>(
    config.get('seekbarVisibilityState', defaultConfig.seekbarVisibilityState) === 'always',
  );
  const setShouldShowSeekbar = React.useMemo<(newState: boolean) => void>((): ((
    newState: boolean,
  ) => void) => {
    return (newState: boolean): void => {
      if (shouldShowSeekbar.current !== newState) shouldShowSeekbar.current = newState;
    };
  }, []);

  const setOptionalComponentsVisibility = React.useMemo<(newState: boolean) => void>((): ((
    newState: boolean,
  ) => void) => {
    return (newState: boolean): void => {
      if (config.get('controlsVisibilityState', defaultConfig.controlsVisibilityState) === 'auto')
        setShouldShowControls(newState);

      if (
        config.get(
          'progressDisplayVisibilityState',
          defaultConfig.progressDisplayVisibilityState,
        ) === 'auto'
      )
        setShouldShowProgressDisplay(newState);

      if (config.get('seekbarVisibilityState', defaultConfig.seekbarVisibilityState) === 'auto')
        setShouldShowSeekbar(newState);

      componentEventTarget.dispatchEvent(
        new CustomEvent('componentsVisibilityUpdate', {
          detail: {
            controls: shouldShowControls.current,
            seekBar: shouldShowSeekbar.current,
            progressDisplay: shouldShowProgressDisplay.current,
          },
        }),
      );

      if (config.get('debuggingLogComponentsUpdates', defaultConfig.debuggingLogComponentsUpdates))
        logger.log(
          'Component update for modal component visibility:',
          `\n- Controls: ${shouldShowControls.current};`,
          `\n- Progress display: ${shouldShowProgressDisplay.current};`,
          `\n- Seek bar: ${shouldShowSeekbar.current};`,
        );
    };
  }, []);

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
        setShouldShowModal(true);
        setTrack(event.detail.item);
        setDuration(event.detail.item.duration_ms);
        setProgress(event.detail.progress_ms);
        setTimestamp(event.detail.timestamp);
        setPlaying(event.detail.is_playing);
        setShuffle(event.detail.shuffle_state);
        setRepeat(event.detail.repeat_state);

        if (
          config.get('debuggingLogComponentsUpdates', defaultConfig.debuggingLogComponentsUpdates)
        )
          logger.log('Component update for new state', event.detail);
      }
    };

    const shouldShowListener = (event: CustomEvent<boolean>): void => {
      if (!persistRef.current?.value) {
        setShouldShowModal(event.detail);
        if (!event.detail) setPlaying(false);

        if (
          config.get('debuggingLogComponentsUpdates', defaultConfig.debuggingLogComponentsUpdates)
        )
          logger.log('Component update for modal visibility', event.detail);
      } else {
        persistRef.current.value = false;

        if (
          config.get('debuggingLogComponentsUpdates', defaultConfig.debuggingLogComponentsUpdates)
        )
          logger.log(
            'Component update for modal visibility was overridden since visibility was persisted',
          );
      }
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
    if (!elementRef?.current) return (): void => {};

    const hoverListener = (): void => setOptionalComponentsVisibility(true);
    const leaveListener = (): void => setOptionalComponentsVisibility(false);

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
          'Component update for modal component visibility (set by settings):',
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

  React.useEffect((): (() => void) => {
    const getPersistRefListener = (ev: CustomEvent<{ value: boolean }>): void => {
      persistRef.current = ev.detail;
    };

    componentEventTarget.addEventListener(
      'persistRef',
      getPersistRefListener as EventListenerOrEventListenerObject,
    );

    componentEventTarget.dispatchEvent(new CustomEvent('getPersistRef'));

    return (): void =>
      componentEventTarget.removeEventListener(
        'persistRef',
        getPersistRefListener as EventListenerOrEventListenerObject,
      );
  }, []);

  return (
    <div
      className={`spotify-modal${shouldShowModal.current ? '' : ' hidden'}${getCustomThemeType()}`}
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
