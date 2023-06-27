import { common, webpack } from 'replugged';
import Seekbar from '@components/Seekbar';
import TrackDetails from '@?components/trackDetails';
import { openControlsContextMenu } from '@components/Controls';
import { config } from '@config';
import {
  AllSettingsUpdate,
  PlayPauseInteraction,
  RepeatInteraction,
  ShuffleInteraction,
  SkipNextInteraction,
  SkipPrevInteraction,
  VolumeInteraction,
} from '@?typings';
import { events, toClassNameString, toggleClass, useGuardedRef, useTrappedRef } from '@?util';

const { React } = common;

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
    type: 'track',
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

  const _forceGuard = React.useRef<boolean>(false);

  const settingsForceUpdate = (callback: () => void): void => {
    _forceGuard.current = true;
    callback();
    _forceGuard.current = false;
  };

  const showSeekbar = useGuardedRef(
    config.get('seekbarVisibilityState') === 'always',
    () => config.get('seekbarVisibilityState') === 'auto' || _forceGuard.current,
  );

  const isDockEmpty = React.useCallback((): boolean => !showSeekbar.current, []);

  const setOptionalComponentsVisibility = React.useCallback((value: boolean) => {
    showSeekbar.current = value;

    events.emit('seekbarVisibility', showSeekbar.current);

    toggleClass(mainRef.current, 'dock-hidden', isDockEmpty());
  }, []);

  React.useEffect(() => {
    const removeStateUpdateListener = events.on<SpotifyApi.CurrentPlaybackResponse>(
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
        }
      },
    );

    const removeShowUpdateListener = events.on<boolean>('showUpdate', (event) => {
      showModal.current = event.detail;

      if (!event.detail) setPlaying(false);
    });

    const removeComponentVisibilityListener = events.on<AllSettingsUpdate>(
      'settingsUpdate',
      (event) => {
        if (event.detail.key === 'seekbarVisibilityState') {
          settingsForceUpdate((): void => {
            showSeekbar.current = event.detail.value === 'always';
          });

          events.emit('seekbarVisibility', showSeekbar.current);
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
      className={toClassNameString(
        'spotify-modal',
        showModal.current ? '' : 'hidden',
        containerClasses.container,
      )}
      /* this is where we do the context menu shenanigans */
      onContextMenu={(ev: React.MouseEvent): void =>
        openControlsContextMenu(ev, {
          forceUpdate: forceUpdateControls,
          onPlayPauseClick: (event: React.MouseEvent): void =>
            events.emit<PlayPauseInteraction>('controlInteraction', {
              event,
              type: 'playPause',
              currentState: playingRef.current,
            }),
          onRepeatClick: (event: React.MouseEvent): void =>
            events.emit<RepeatInteraction>('controlInteraction', {
              event,
              type: 'repeat',
              currentState: repeatRef.current,
            }),
          onShuffleClick: (event: React.MouseEvent): void =>
            events.emit<ShuffleInteraction>('controlInteraction', {
              event,
              type: 'shuffle',
              currentState: shuffleRef.current,
            }),
          onSkipNextClick: (event: React.MouseEvent): void =>
            events.emit<SkipNextInteraction>('controlInteraction', {
              event,
              type: 'skipNext',
            }),
          onSkipPrevClick: (event: React.MouseEvent): void =>
            events.emit<SkipPrevInteraction>('controlInteraction', {
              event,
              type: 'skipPrev',
              currentDuration: durationRef.current,
              currentProgress: progressRef.current,
            }),
          onVolumeChange: (newVolume: number): void =>
            events.emit<VolumeInteraction>('controlInteraction', {
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
      <div className={toClassNameString('main', isDockEmpty() ? 'dock-hidden' : '')} ref={mainRef}>
        <TrackDetails {...track} />
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
