import { common, webpack } from 'replugged';
import { Controls } from '@components/Controls';
import { ProgressContainer } from '@components/ProgressDisplay';
import { TrackInfo } from '@components/TrackInfo';
import {
  config,
  dispatchEvent,
  listenToElementEvent,
  listenToEvent,
  logger,
  mapRefValues,
  toggleClass,
  toClassString,
  useLinkedRefs,
  useRefWithTrigger,
} from '@?utils';

const { React } = common;

const containerClasses = await webpack.waitForModule<{
  container: string;
}>(webpack.filters.byProps('container', 'godlike'));

export function Modal(): JSX.Element {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const mainRef = React.useRef<HTMLDivElement>(null);

  const [shouldShowModal, setShouldShowModal] = useRefWithTrigger(false, (newValue) =>
    toggleClass(elementRef.current, 'hidden', !newValue),
  );

  const [
    [shouldShowControls, setShouldShowControls],
    [shouldShowProgressDisplay, setShouldShowProgressDisplay],
    [shouldShowSeekbar, setShouldShowSeekbar],
  ] = useLinkedRefs([
    [
      React.useRef(config.get('controlsVisibilityState') === 'always'),
      () => config.get('controlsVisibilityState') === 'auto',
    ],
    [
      React.useRef(config.get('progressDisplayVisibilityState') === 'always'),
      () => config.get('progressDisplayVisibilityState') === 'auto',
    ],
    [
      React.useRef(config.get('seekbarVisibilityState') === 'always'),
      () => config.get('seekbarVisibilityState') === 'auto',
    ],
  ]);

  const isDockEmpty = (): boolean =>
    !(shouldShowControls.current || shouldShowProgressDisplay.current || shouldShowSeekbar.current);

  const setOptionalComponentsVisibility = (value: boolean) => {
    setShouldShowControls(value);
    setShouldShowProgressDisplay(value);
    setShouldShowSeekbar(value);

    const mappedRefValues = mapRefValues({
      shouldShowControls,
      shouldShowProgressDisplay,
      shouldShowSeekbar,
    });

    dispatchEvent('componentsVisibilityUpdate', mappedRefValues);

    toggleClass(mainRef.current, 'dock-hidden', isDockEmpty());

    if (config.get('debuggingLogComponentsUpdates'))
      logger.log('modal component visibility update (hover):', mappedRefValues);
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
          logger.log('(debuggingLogComponentsUpdates)', 'modal update (new state):', event.detail);
      }
    });

    const removeShouldShowUpdateListener = listenToEvent<boolean>('shouldShowUpdate', (event) => {
      setShouldShowModal(event.detail);
      if (!event.detail) setPlaying(false);

      if (config.get('debuggingLogComponentsUpdates'))
        logger.log('modal visibility update:', event.detail);
    });

    const removeComponentVisibilityListener = listenToEvent<{
      type: 'controlsVisibilityState' | 'progressDisplayVisibilityState' | 'seekbarVisibilityState';
      state: 'auto' | 'hidden' | 'always';
    }>('componentVisibilityUpdateSettings', (event) => {
      const componentVisibility = {
        controlsVisibilityState: shouldShowControls,
        progressDisplayVisibilityState: shouldShowProgressDisplay,
        seekbarVisibilityState: shouldShowSeekbar,
      };

      componentVisibility[event.detail.type].current = event.detail.state === 'always';

      dispatchEvent(
        'componentsVisibilityUpdate',
        mapRefValues({
          shouldShowControls,
          shouldShowProgressDisplay,
          shouldShowSeekbar,
        }),
      );

      if (config.get('debuggingLogComponentsUpdates', false))
        logger.log(
          'component visibility update (set by settings):',
          event.type,
          event.detail.state,
          event.detail.state === 'always',
        );
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
      className={toClassString(
        'spotify-modal',
        shouldShowModal.current ? '' : 'hidden',
        containerClasses.container,
      )}
      ref={elementRef}>
      <div className={toClassString('main', isDockEmpty() ? 'dock-hidden' : '')} ref={mainRef}>
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
