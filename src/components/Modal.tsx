import { common, webpack } from 'replugged';
import Seekbar from '@components/Seekbar';
import TrackDetails from '@components/trackDetails';
import { Controls, openControlsContextMenu } from '@components/Controls';
import { config } from '@config';
import {
  AllSettingsUpdate,
  PlayPauseInteraction,
  RepeatInteraction,
  ShuffleInteraction,
  SkipNextInteraction,
  SkipPrevInteraction,
  VolumeInteraction,
} from '@typings';
import { events, toClassNameString, toggleClass, useGuardedRef, useTrappedRef } from '@util';

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
  const [progress, setProgress] = React.useState<number>(0);
  const [timestamp, setTimestamp] = React.useState<number>(0);
  const [repeat, setRepeat] = React.useState<'off' | 'context' | 'track'>('off');
  const [shuffle, setShuffle] = React.useState<boolean>(false);

  const durationRef = React.useRef<number>(0);
  const forceUpdateControls = React.useRef<() => void>(null);
  const elementRef = React.useRef<HTMLDivElement>(null);
  const playingRef = React.useRef<boolean>(false);
  const progressRef = React.useRef<number>(0);
  const repeatRef = React.useRef<'off' | 'context' | 'track'>('off');
  const shuffleRef = React.useRef<boolean>(false);
  const volumeRef = React.useRef<number>(0);

  const showModal = useTrappedRef(false, (newValue) =>
    toggleClass(elementRef.current, 'hidden', !newValue),
  );

  const _forceGuard = React.useRef<boolean>(false);

  const settingsForceUpdate = React.useCallback((callback: () => void): void => {
    _forceGuard.current = true;
    callback();
    _forceGuard.current = false;
  }, []);

  const showSeekbar = useGuardedRef(
    config.get('seekbarVisibilityState') === 'always',
    () => config.get('seekbarVisibilityState') === 'auto' || _forceGuard.current,
  );

  const showControls = useGuardedRef(
    config.get('controlsVisibilityState') === 'always',
    () => config.get('controlsVisibilityState') === 'auto' || _forceGuard.current,
  );

  const updateOptionalComponentsVisibility = React.useCallback((state: boolean): void => {
    showSeekbar.current = state;
    showControls.current = state;
    events.emit('seekbarVisibility', showSeekbar.current);
    events.emit('controlsVisibility', showControls.current);
  }, []);

  React.useEffect(() => {
    const removeStateUpdateListener = events.on<SpotifyApi.CurrentPlaybackResponse>(
      'stateUpdate',
      (event): void => {
        if (event.detail.item) {
          showModal.current = true;

          setTrack(event.detail.item);
          setDuration(event.detail.item.duration_ms);
          setProgress(event.detail.progress_ms);
          setPlaying(event.detail.is_playing);
          setTimestamp(event.detail.timestamp);
          setRepeat(event.detail.repeat_state);
          setShuffle(event.detail.shuffle_state);

          durationRef.current = event.detail.item.duration_ms;
          playingRef.current = event.detail.is_playing;
          shuffleRef.current = event.detail.shuffle_state;
          repeatRef.current = event.detail.repeat_state;
          volumeRef.current = event.detail.device?.volume_percent || 0;

          forceUpdateControls.current?.();
        }
      },
    );

    const removeShowUpdateListener = events.on<boolean>('showUpdate', (event): void => {
      showModal.current = event.detail;

      if (!event.detail) setPlaying(false);
    });

    const removeSettingsUpdateListener = events.on<AllSettingsUpdate>(
      'settingsUpdate',
      (event): void => {
        if (event.detail.key === 'seekbarVisibilityState')
          settingsForceUpdate((): void => {
            showSeekbar.current = event.detail.value === 'always';
            events.emit('seekbarVisibility', showSeekbar.current);
          });
        else if (event.detail.key === 'controlsVisibilityState')
          settingsForceUpdate((): void => {
            showControls.current = event.detail.value === 'always';
            events.emit('controlsVisibility', showControls.current);
          });
      },
    );

    return (): void => {
      removeStateUpdateListener();
      removeShowUpdateListener();
      removeSettingsUpdateListener();
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
      onContextMenu={(ev: React.MouseEvent): void =>
        openControlsContextMenu(ev, {
          forceUpdate: forceUpdateControls,
          duration: durationRef,
          playing: playingRef,
          progress: progressRef,
          repeat: repeatRef,
          shuffle: shuffleRef,
          volume: volumeRef,
        })
      }
      onMouseEnter={(): void => updateOptionalComponentsVisibility(true)}
      onMouseLeave={(): void => updateOptionalComponentsVisibility(false)}
      ref={elementRef}>
      <div className='main'>
        <TrackDetails {...track} />
        <Seekbar
          duration={duration}
          playing={playing}
          progress={progress}
          progressRef={progressRef}
          shouldShow={showSeekbar}
          timestamp={timestamp}
        />
        <Controls
          duration={duration}
          playing={playing}
          progress={progressRef}
          shouldShow={showControls}
          repeat={repeat}
          shuffle={shuffle}
        />
      </div>
      <div className='divider' />
    </div>
  );
};
