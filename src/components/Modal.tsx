import { common, webpack } from 'replugged';
import Seekbar from '@components/Seekbar';
import TrackDetails from '@?components/trackDetails';
import { openControlsContextMenu } from '@components/Controls';
import {
  config,
  dispatchEvent,
  listenToEvent,
  logger,
  toggleClass,
  toClassString,
  useGuardedRef,
  useTrappedRef,
} from '@?utils';

const { React, lodash: _ } = common;

const containerClasses = await webpack.waitForModule<{
  container: string;
}>(webpack.filters.byProps('container', 'godlike'));

export const Modal = (): JSX.Element => {
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

  const elementRef = React.useRef<HTMLDivElement>(null);
  const mainRef = React.useRef<HTMLDivElement>(null);

  const showModal = useTrappedRef(false, (newValue) =>
    toggleClass(elementRef.current, 'hidden', !newValue),
  );

  const settingsForceUpdate = React.useRef<boolean>(false);

  const showControls = useGuardedRef(
    config.get('controlsVisibilityState') === 'always',
    () => config.get('controlsVisibilityState') === 'auto' || settingsForceUpdate.current,
  );

  const showSeekbar = useGuardedRef(
    config.get('seekbarVisibilityState') === 'always',
    () => config.get('seekbarVisibilityState') === 'auto' || settingsForceUpdate.current,
  );

  const isDockEmpty = React.useCallback(
    (): boolean => !(showControls.current || showSeekbar.current),
    [],
  );

  const setOptionalComponentsVisibility = React.useCallback((value: boolean) => {
    showControls.current = value;
    showSeekbar.current = value;

    dispatchEvent<Events.ComponentsVisibilityUpdate>('componentsVisibilityUpdate', {
      controls: showControls.current,
      seekBar: showSeekbar.current,
    });

    toggleClass(mainRef.current, 'dock-hidden', isDockEmpty());

    if (config.get('debuggingLogComponentsUpdates'))
      logger.log('component visibility update (hover):', {
        controls: showControls.current,
        seekBar: showSeekbar.current,
      });
  }, []);

  React.useEffect(() => {
    const removeStateUpdateListener = listenToEvent<Spotify.State>('stateUpdate', (event) => {
      if (event.detail.item) {
        showModal.current = true;

        setTrack(event.detail.item);
        setDuration(event.detail.item.duration_ms);
        setProgress(event.detail.progress_ms);
        setTimestamp(event.detail.timestamp);
        setPlaying(event.detail.is_playing);
        setShuffle(event.detail.shuffle_state);
        setRepeat(event.detail.repeat_state);

        if (config.get('debuggingLogComponentsUpdates'))
          logger.log(
            '(debuggingLogComponentsUpdates)',
            'modal update (new state):',
            _.clone(event.detail),
          );
      }
    });

    const removeShowUpdateListener = listenToEvent<boolean>('showUpdate', (event) => {
      showModal.current = event.detail;

      if (!event.detail) setPlaying(false);

      if (config.get('debuggingLogComponentsUpdates'))
        logger.log('modal visibility update:', _.clone(event.detail));
    });

    const removeComponentVisibilityListener = listenToEvent<Events.AllSettingsUpdate>(
      'settingsUpdate',
      (event) => {
        if (
          [
            'controlsVisibilityState',
            'progressDisplayVisibilityState',
            'seekbarVisibilityState',
          ].includes(event.detail.key)
        ) {
          settingsForceUpdate.current = true;

          switch (event.detail.key) {
            case 'controlsVisibilityState':
              showControls.current = event.detail.value === 'always';
              break;
            case 'seekbarVisibilityState':
              showSeekbar.current = event.detail.value === 'always';
              break;
          }

          settingsForceUpdate.current = false;

          dispatchEvent<Events.ComponentsVisibilityUpdate>('componentsVisibilityUpdate', {
            controls: showControls.current,
            seekBar: showSeekbar.current,
          });

          if (config.get('debuggingLogComponentsUpdates'))
            logger.log('component visibility update (settings)', {
              controls: showControls.current,
              seekBar: showSeekbar.current,
            });
        }
      },
    );

    return (): void => {
      removeStateUpdateListener();
      removeShowUpdateListener();
      removeComponentVisibilityListener();
    };
  }, []);

  return (
    <div
      id='spotify-modal'
      className={toClassString(
        'spotify-modal',
        showModal.current ? '' : 'hidden',
        containerClasses.container,
      )}
      /* this is where we do the context menu shenanigans */
      onContextMenu={openControlsContextMenu}
      onMouseEnter={() => setOptionalComponentsVisibility(true)}
      onMouseLeave={() => setOptionalComponentsVisibility(false)}
      ref={elementRef}>
      <div className={toClassString('main', isDockEmpty() ? 'dock-hidden' : '')} ref={mainRef}>
        <TrackDetails track={track} />
        <div className='dock'>
          <Seekbar
            duration={duration}
            playing={playing}
            progress={progress}
            progressRef={progressRef}
            showSeekbar={showSeekbar}
            timestamp={timestamp}
          />
        </div>
      </div>
      <div className='divider' />
    </div>
  );
};

/*
          <Controls
            duration={duration}
            playing={playing}
            progress={progressRef}
            shuffle={shuffle}
            repeat={repeat}
            show={showControls}
            track={track}
          />

 */
