import { common } from 'replugged';
import { ControlContext, Controls } from './Controls';
import { ProgressContainer, ProgressContext } from './ProgressDisplay';
import { TrackInfo, TrackInfoContext } from './TrackInfo';
import { componentEventTarget } from './global';
import { SpotifyTrack, SpotifyWebSocketState } from '../types';

const { React } = common;

export function Modal(props: { state?: SpotifyWebSocketState }): JSX.Element {
  // TrackInfo context
  const [track, setTrack] = React.useState<SpotifyTrack>(
    props?.state?.item
      ? props?.state?.item
      : ({
          album: { name: 'None', images: [{}] },
          artists: [{ name: 'None' }],
          name: 'None',
        } as SpotifyTrack),
  );

  // ProgressDisplay context
  const [duration, setDuration] = React.useState<number>(
    typeof props?.state?.item?.duration_ms === 'number' ? props?.state?.item?.duration_ms : 0,
  );
  const [playing, setPlaying] = React.useState<boolean>(Boolean(props?.state?.is_playing));
  const [progress, setProgress] = React.useState<number>(
    typeof props?.state?.progress_ms === 'number' ? props?.state?.progress_ms : 0,
  );

  const [shouldShowModal, setShouldShowModal] = React.useState<boolean>(
    typeof props?.state === 'object',
  );
  const [shouldShowControls, setShouldShowControls] = React.useState<boolean>(false);

  // Controls context
  const [shuffle, setShuffle] = React.useState<boolean>(false);
  const [repeat, setRepeat] = React.useState<'off' | 'context' | 'track'>('off');
  const controlListeners = React.useMemo<{
    playPauseClick: (mouseEvent: React.MouseEvent, currentState: boolean) => boolean;
    repeatClick: (
      mouseEvent: React.MouseEvent,
      currentState: 'off' | 'context' | 'track',
    ) => boolean;
    shuffleClick: (mouseEvent: React.MouseEvent, currentState: boolean) => boolean;
    skipNextClick: (mouseEvent: React.MouseEvent) => boolean;
    skipPrevClick: (mouseEvent: React.MouseEvent, currentProgress: number) => boolean;
  }>(
    () => ({
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
      skipPrevClick: (event: React.MouseEvent, currentProgress: number): boolean =>
        componentEventTarget.dispatchEvent(
          new CustomEvent<{ currentProgress: number; event: React.MouseEvent }>('skipPrevClick', {
            detail: { currentProgress, event },
          }),
        ),
    }),
    [],
  );
  const modifyControls = {
    playing: (newPlaying: boolean | ((previousPlaying: boolean) => boolean)): void => {
      if (
        newPlaying === playing ||
        typeof newPlaying !== 'boolean' ||
        typeof newPlaying !== 'function'
      )
        return;
      setPlaying(newPlaying);
    },
    repeat: (
      newRepeat:
        | 'off'
        | 'context'
        | 'track'
        | ((previousRepeat: 'off' | 'context' | 'track') => 'off' | 'context' | 'track'),
    ): void => {
      if (newRepeat === repeat || typeof newRepeat !== 'string' || typeof newRepeat !== 'function')
        return;
      setRepeat(newRepeat);
    },
    shuffle: (newShuffle: boolean | ((previousShuffle: boolean) => boolean)): void => {
      if (
        newShuffle === shuffle ||
        typeof newShuffle !== 'boolean' ||
        typeof newShuffle !== 'function'
      )
        return;
      setShuffle(newShuffle);
    },
  };

  const elementRef = React.useRef<HTMLDivElement>(null);
  const onProgressModified = React.useCallback<(newProgress: number) => boolean>(
    (newProgress: number): boolean =>
      componentEventTarget.dispatchEvent(
        new CustomEvent('progressUpdate', { detail: newProgress }),
      ),
    [],
  );
  const artistRightClick = React.useCallback<(name: string, id?: string) => boolean>(
    (name: string, id?: string): boolean =>
      componentEventTarget.dispatchEvent(
        new CustomEvent('artistRightClick', { detail: { name, id } }),
      ),
    [],
  );
  const titleRightClick = React.useCallback<(name: string, id?: string) => boolean>(
    (name: string, id?: string): boolean =>
      componentEventTarget.dispatchEvent(
        new CustomEvent('titleRightClick', { detail: { name, id } }),
      ),
    [],
  );
  const coverArtRightClick = React.useCallback<(name: string, id?: string) => boolean>(
    (name: string, id?: string): boolean =>
      componentEventTarget.dispatchEvent(
        new CustomEvent('coverArtRightClick', { detail: { name, id } }),
      ),
    [],
  );
  const modifyProgress = React.useCallback<
    (newProgress: number | ((previousProgress: number) => number)) => void
  >(
    (newProgress: number | ((previousProgress: number) => number)): void =>
      setProgress(newProgress),
    [progress],
  );

  React.useEffect(() => {
    const stateUpdateListener = (event: CustomEvent<SpotifyWebSocketState>): void => {
      if (event.detail.item) {
        if (!shouldShowModal) setShouldShowModal(true);
        setTrack(event.detail.item);
        setDuration(event.detail.item.duration_ms);
        setProgress(event.detail.progress_ms);
        setPlaying(event.detail.is_playing);
        setShuffle(event.detail.shuffle_state);
        setRepeat(event.detail.repeat_state);
      }
    };

    const shouldShowListener = (event: CustomEvent<boolean>): void => {
      if (event.detail === shouldShowModal) return;
      setShouldShowModal(event.detail);
    };

    // @ts-expect-error - Oh please it's a valid listener
    componentEventTarget.addEventListener('stateUpdate', stateUpdateListener);
    // @ts-expect-error - Oh please it's a valid listener
    componentEventTarget.addEventListener('shouldShowUpdate', shouldShowListener);

    return () => {
      // @ts-expect-error - Oh please it's a valid listener
      componentEventTarget.removeEventListener('stateUpdate', stateUpdateListener);
      // @ts-expect-error - Oh please it's a valid listener
      componentEventTarget.removeEventListener('shouldShowUpdate', shouldShowListener);
    };
  }, []);

  React.useEffect((): (() => void) => {
    if (!elementRef?.current) return;

    const hoverListener = () => {
      setShouldShowControls(true);
    };

    const leaveListener = () => {
      setShouldShowControls(false);
    };

    elementRef.current.addEventListener('mouseenter', hoverListener);
    elementRef.current.addEventListener('mouseleave', leaveListener);

    // eslint-disable-next-line consistent-return ---- This function can return a destructor
    return (): void => {
      if (elementRef?.current) {
        // @ts-expect-error - Oh please it's a valid listener
        elementRef.removeEventListener('mouseenter', hoverListener);
        // @ts-expect-error - Oh please it's a valid listener
        elementRef.removeEventListener('mouseleave', leaveListener);
      }
    };
  }, [elementRef]);

  return (
    <div className={`spotify-modal${shouldShowModal ? '' : ' hidden'}`} ref={elementRef}>
      <TrackInfoContext.Provider
        value={{ track, artistRightClick, titleRightClick, coverArtRightClick }}>
        <TrackInfo />
      </TrackInfoContext.Provider>
      <div className='dock'>
        <ProgressContext.Provider
          value={{ duration, playing, progress, modifyProgress, onProgressModified }}>
          <ProgressContainer />
        </ProgressContext.Provider>
        <ControlContext.Provider
          value={{
            currentProgress: progress,
            shouldShow: shouldShowControls,
            on: controlListeners,
            modify: modifyControls,
            playing,
            repeat,
            shuffle,
          }}>
          <Controls />
        </ControlContext.Provider>
      </div>
    </div>
  );
}
