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
  const [track, setTrack] = React.useState<
    SpotifyApi.TrackObjectFull | SpotifyApi.EpisodeObjectFull
  >({
    album: { name: 'None', images: [{}] },
    artists: [{ name: 'None' }],
    name: 'None',
  } as SpotifyApi.TrackObjectFull);

  const [duration, setDuration] = React.useState<number>(0);
  const [playing, setPlaying] = React.useState<boolean>(false);
  const [timestamp, setTimestamp] = React.useState<number>(0);
  const [progress, setProgress] = React.useState<number>(0);

  const durationRef = React.useRef<number>(0);
  const forceUpdateControls = React.useRef<() => void>(null);
  const elementRef = React.useRef<HTMLDivElement>(null);
  const mainRef = React.useRef<HTMLDivElement>(null);
  const playingRef = React.useRef<boolean>(false);
  const progressRef = React.useRef<number>(0);
  const repeatRef = React.useRef<'off' | 'context' | 'track'>('off');
  const shuffleRef = React.useRef<boolean>(false);
  const volumeRef = React.useRef<number>(0);

  const showModal = useTrappedRef(false, (newValue) =>
    toggleClass(elementRef.current, 'hidden', !newValue),
  );

  const settingsForceUpdate = React.useRef<boolean>(false);

  const showSeekbar = useGuardedRef(
    config.get('seekbarVisibilityState') === 'always',
    () => config.get('seekbarVisibilityState') === 'auto' || settingsForceUpdate.current,
  );

  const isDockEmpty = React.useCallback((): boolean => !showSeekbar.current, []);

  const setOptionalComponentsVisibility = React.useCallback((value: boolean) => {
    showSeekbar.current = value;

    dispatchEvent<SpotifyModal.Events.ComponentsVisibilityUpdate>('componentsVisibilityUpdate', {
      seekBar: showSeekbar.current,
    });

    toggleClass(mainRef.current, 'dock-hidden', isDockEmpty());

    if (config.get('debuggingLogComponentsUpdates'))
      logger.log('component visibility update (hover):', {
        seekBar: showSeekbar.current,
      });
  }, []);

  React.useEffect(() => {
    const removeStateUpdateListener = listenToEvent<SpotifyApi.CurrentPlaybackResponse>(
      'stateUpdate',
      (event) => {
        if (event.detail.item) {
          showModal.current = true;

          setTrack(event.detail.item);
          setDuration(event.detail.item.duration_ms);
          setProgress(event.detail.progress_ms);
          setTimestamp(event.detail.timestamp);
          setPlaying(event.detail.is_playing);

          durationRef.current = event.detail.item.duration_ms;
          playingRef.current = event.detail.is_playing;
          shuffleRef.current = event.detail.shuffle_state;
          repeatRef.current = event.detail.repeat_state;
          volumeRef.current = event.detail.device?.volume_percent || 0;

          forceUpdateControls.current?.();

          if (config.get('debuggingLogComponentsUpdates'))
            logger.log(
              '(debuggingLogComponentsUpdates)',
              'modal update (new state):',
              _.clone(event.detail),
            );
        }
      },
    );

    const removeShowUpdateListener = listenToEvent<boolean>('showUpdate', (event) => {
      showModal.current = event.detail;

      if (!event.detail) setPlaying(false);

      if (config.get('debuggingLogComponentsUpdates'))
        logger.log('modal visibility update:', _.clone(event.detail));
    });

    const removeComponentVisibilityListener = listenToEvent<SpotifyModal.Events.AllSettingsUpdate>(
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
            case 'seekbarVisibilityState':
              showSeekbar.current = event.detail.value === 'always';
              break;
          }

          settingsForceUpdate.current = false;

          dispatchEvent<SpotifyModal.Events.ComponentsVisibilityUpdate>(
            'componentsVisibilityUpdate',
            {
              seekBar: showSeekbar.current,
            },
          );

          if (config.get('debuggingLogComponentsUpdates'))
            logger.log('component visibility update (settings)', {
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
      onContextMenu={(ev: React.MouseEvent): void =>
        openControlsContextMenu(ev, {
          forceUpdate: forceUpdateControls,
          onPlayPauseClick: (event: React.MouseEvent): void =>
            dispatchEvent<SpotifyModal.Events.PlayPauseInteraction>('controlInteraction', {
              event,
              type: 'playPause',
              currentState: playingRef.current,
            }),
          onRepeatClick: (event: React.MouseEvent): void =>
            dispatchEvent<SpotifyModal.Events.RepeatInteraction>('controlInteraction', {
              event,
              type: 'repeat',
              currentState: repeatRef.current,
            }),
          onShuffleClick: (event: React.MouseEvent): void =>
            dispatchEvent<SpotifyModal.Events.ShuffleInteraction>('controlInteraction', {
              event,
              type: 'shuffle',
              currentState: shuffleRef.current,
            }),
          onSkipNextClick: (event: React.MouseEvent): void =>
            dispatchEvent<SpotifyModal.Events.SkipNextInteraction>('controlInteraction', {
              event,
              type: 'skipNext',
            }),
          onSkipPrevClick: (event: React.MouseEvent): void =>
            dispatchEvent<SpotifyModal.Events.SkipPrevInteraction>('controlInteraction', {
              event,
              type: 'skipPrev',
              currentDuration: durationRef.current,
              currentProgress: progressRef.current,
            }),
          onVolumeChange: (newVolume: number): void =>
            dispatchEvent<SpotifyModal.Events.VolumeInteraction>('controlInteraction', {
              type: 'volume',
              newVolume,
            }),
          playing: playingRef,
          repeat: repeatRef,
          shuffle: shuffleRef,
          volume: volumeRef,
        })
      }
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
