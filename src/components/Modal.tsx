import { common } from 'replugged';
import { Controls } from './Controls';
import { ProgressContainer } from './ProgressDisplay';
import { TrackInfo } from './TrackInfo';
import {
  config,
  dispatchEvent,
  listenToElementEvent,
  listenToEvent,
  logger,
  toggleClass,
} from './global';

const { React } = common;

function setRef<T>(ref: React.MutableRefObject<T>, value: T, after?: (value: T) => void): void {
  if (ref.current !== value) {
    ref.current = value;
    if (typeof after === 'function') after(value);
  }
}

export function Modal(props: { containerClass: string }): JSX.Element {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const mainRef = React.useRef<HTMLDivElement>(null);

  const shouldShowModal = React.useRef<boolean>(false);
  const setShouldShowModal = (value: boolean) =>
    setRef(shouldShowModal, value, (newValue) => {
      if (newValue && elementRef.current.classList.contains('hidden'))
        elementRef.current.classList.remove('hidden');
      else if (!newValue && !elementRef.current.classList.contains('hidden'))
        elementRef.current.classList.add('hidden');
    });

  const shouldShowControls = React.useRef<boolean>(
    config.get('controlsVisibilityState') === 'always',
  );

  const shouldShowProgressDisplay = React.useRef<boolean>(
    config.get('progressDisplayVisibilityState') === 'always',
  );

  const shouldShowSeekbar = React.useRef<boolean>(
    config.get('seekbarVisibilityState') === 'always',
  );

  const isDockEmpty = (): boolean =>
    !(shouldShowControls.current || shouldShowProgressDisplay.current || shouldShowSeekbar.current);

  const setOptionalComponentsVisibility = (value: boolean) => {
    if (config.get('controlsVisibilityState') === 'auto') setRef(shouldShowControls, value);
    if (config.get('progressDisplayVisibilityState') === 'auto')
      setRef(shouldShowProgressDisplay, value);
    if (config.get('seekbarVisibilityState') === 'auto') setRef(shouldShowSeekbar, value);

    dispatchEvent('componentsVisibilityUpdate', {
      controls: shouldShowControls.current,
      seekBar: shouldShowSeekbar.current,
      progressDisplay: shouldShowProgressDisplay.current,
    });

    toggleClass(mainRef.current, 'dock-hidden', isDockEmpty());

    if (config.get('debuggingLogComponentsUpdates'))
      logger.log('component update for modal component visibility', {
        controls: shouldShowControls.current,
        progressDisplay: shouldShowProgressDisplay.current,
        seekBar: shouldShowSeekbar.current,
      });
  };

  const [track, setTrack] = React.useState<Spotify.Track>({
    album: { name: 'None', images: [{}] },
    artists: [{ name: 'None' }],
    name: 'None',
  } as Spotify.Track);
  const [duration, setDuration] = React.useState<number>(0);
  const [playing, setPlaying] = React.useState<boolean>(false);
  const [timestamp, setTimestamp] = React.useState<number>(0);
  const [progress, setProgress] = React.useState<number>(0);
  const progressRef = React.useRef<number>(0);
  const [shuffle, setShuffle] = React.useState<boolean>(false);
  const [repeat, setRepeat] = React.useState<'off' | 'context' | 'track'>('off');

  React.useEffect(() => {
    const removeStateUpdateListener = listenToEvent<Spotify.State>('stateUpdate', (event) => {
      if (event.detail.item) {
        setShouldShowModal(true);
        setTrack(event.detail.item);
        setDuration(event.detail.item.duration_ms);
        setProgress(event.detail.progress_ms);
        setTimestamp(event.detail.timestamp);
        setPlaying(event.detail.is_playing);
        setShuffle(event.detail.shuffle_state);
        setRepeat(event.detail.repeat_state);

        if (config.get('debuggingLogComponentsUpdates'))
          logger.log('component update for new state', event.detail);
      }
    });

    const removeShouldShowUpdateListener = listenToEvent<boolean>('shouldShowUpdate', (event) => {
      setShouldShowModal(event.detail);
      if (!event.detail) setPlaying(false);

      if (config.get('debuggingLogComponentsUpdates'))
        logger.log('component update for modal visibility', event.detail);
    });

    const removeComponentVisibilityListener = listenToEvent<{
      type: 'controlsVisibilityState' | 'progressDisplayVisibilityState' | 'seekbarVisibilityState';
      state: 'auto' | 'hidden' | 'always';
    }>('componentVisibilityUpdateSettings', (event) => {
      if (event.detail.type === 'controlsVisibilityState')
        setRef(shouldShowControls, event.detail.state === 'always');
      else if (event.detail.type === 'progressDisplayVisibilityState')
        setRef(shouldShowProgressDisplay, event.detail.state === 'always');
      else if (event.detail.type === 'seekbarVisibilityState')
        setRef(shouldShowSeekbar, event.detail.state === 'always');

      dispatchEvent('componentsVisibilityUpdate', {
        controls: shouldShowControls.current,
        seekBar: shouldShowSeekbar.current,
        progressDisplay: shouldShowProgressDisplay.current,
      });

      if (config.get('debuggingLogComponentsUpdates', false))
        logger.log('component update for modal component visibility (set by settings):', {
          [event.detail.type.replace(/VisibilityState/, '')]: event.detail.state === 'always',
        });
    });

    const removeHoverListener = listenToElementEvent(elementRef.current, 'mouseenter', () =>
      setOptionalComponentsVisibility(true),
    );
    const removeLeaveListener = listenToElementEvent(elementRef.current, 'mouseleave', () =>
      setOptionalComponentsVisibility(false),
    );

    return (): void => {
      if (elementRef?.current) {
        removeHoverListener();
        removeLeaveListener();
      }

      removeStateUpdateListener();
      removeShouldShowUpdateListener();
      removeComponentVisibilityListener();
    };
  }, []);

  return (
    <div
      id='spotify-modal'
      className={`spotify-modal${shouldShowModal.current ? '' : ' hidden'}${
        props.containerClass ? ` ${props.containerClass}` : ''
      }`}
      ref={elementRef}>
      <div className={`main${isDockEmpty() ? ' dock-hidden' : ''}`} ref={mainRef}>
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
      <div className='divider' />
    </div>
  );
}
