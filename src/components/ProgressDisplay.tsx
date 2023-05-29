import { common } from 'replugged';
import {
  calculatePercentage,
  dispatchEvent,
  listenToEvent,
  parseTime,
  toggleClass,
  toClassString,
} from '@?utils';
const { React } = common;

export function ProgressContainer(props: {
  duration: number;
  playing: boolean;
  progress: number;
  progressRef: React.MutableRefObject<number>;
  showProgress: React.MutableRefObject<boolean>;
  showSeekbar: React.MutableRefObject<boolean>;
  timestamp: number;
}): JSX.Element {
  const interval = React.useRef<number>(null);

  const progressTimestampRef = React.useRef<number>(0);
  const durationTimestampRef = React.useRef<number>(0);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const seekBarRef = React.useRef<HTMLDivElement>(null);
  const seekBarInnerRef = React.useRef<HTMLDivElement>(null);
  const progressDisplayRef = React.useRef<HTMLDivElement>(null);
  const currentRef = React.useRef<HTMLSpanElement>(null);
  const durationRef = React.useRef<HTMLSpanElement>(null);

  const getProgressMS = React.useCallback<
    (playing: boolean, duration: number, progress: number) => number
  >(
    (playing: boolean, duration: number, progress: number): number =>
      playing
        ? progressTimestampRef.current >= durationTimestampRef.current
          ? duration
          : duration - (durationTimestampRef.current - progressTimestampRef.current)
        : progress,
    [],
  );

  React.useEffect(() => {
    if (!props.timestamp) return () => {};

    interval.current = setInterval((): void => {
      const now = Date.now();
      if (!durationTimestampRef.current)
        durationTimestampRef.current = now + props.duration - props.progress;
      progressTimestampRef.current = now;

      if (
        props.progressRef.current !== getProgressMS(props.playing, props.duration, props.progress)
      )
        props.progressRef.current = getProgressMS(props.playing, props.duration, props.progress);

      if (
        seekBarInnerRef.current &&
        seekBarInnerRef.current.style.width !==
          calculatePercentage(
            getProgressMS(props.playing, props.duration, props.progress),
            props.duration,
          )
      )
        seekBarInnerRef.current.style.width = calculatePercentage(
          getProgressMS(props.playing, props.duration, props.progress),
          props.duration,
        );

      if (
        currentRef.current &&
        currentRef.current.innerText !==
          parseTime(getProgressMS(props.playing, props.duration, props.progress))
      )
        currentRef.current.innerText = parseTime(
          getProgressMS(props.playing, props.duration, props.progress),
        );

      if (durationRef.current && durationRef.current.innerText !== parseTime(props.duration))
        durationRef.current.innerText = parseTime(props.duration);
    }, 500) as unknown as number;

    return () => {
      clearInterval(interval.current);
      durationTimestampRef.current = 0;
    };
  }, [props.timestamp]);

  React.useEffect(
    (): (() => void) =>
      listenToEvent<{ shouldShowProgressDisplay: boolean; shouldShowSeekbar: boolean }>(
        'componentsVisibilityUpdate',
        (event): void => {
          /* We invert event.detail.<element> here because true is show and false is hidden;
            The toggleClass function takes true as add and false as remove */

          toggleClass(seekBarRef.current, 'hidden', !event.detail.shouldShowSeekbar);
          toggleClass(
            progressDisplayRef.current,
            'hidden',
            !event.detail.shouldShowProgressDisplay,
          );
          toggleClass(
            containerRef.current,
            'hidden',
            !(props.showProgress.current || props.showSeekbar.current),
          );
        },
      ),
    [],
  );

  return (
    <div
      className={toClassString(
        'progress-container',
        !(props.showProgress.current || props.showSeekbar.current) ? 'hidden' : '',
      )}
      ref={containerRef}>
      <div
        className={toClassString('progress-display', !props.showProgress.current ? 'hidden' : '')}
        ref={progressDisplayRef}>
        <span ref={currentRef} className='current'>
          {parseTime(props.progress)}
        </span>
        <span ref={durationRef} className='duration'>
          {parseTime(props.duration)}
        </span>
      </div>
      <div
        className={toClassString('seek-bar', !props.showSeekbar.current ? 'hidden' : '')}
        ref={seekBarRef}
        onClick={(event: React.MouseEvent) =>
          dispatchEvent('controlInteraction', {
            type: 'seek',
            newProgress: Math.round(
              props.duration *
                (event.nativeEvent.offsetX / (seekBarRef.current as HTMLDivElement).offsetWidth),
            ),
          })
        }>
        <div
          className='inner'
          ref={seekBarInnerRef}
          style={{ width: calculatePercentage(props.progress, props.duration) }}
        />
      </div>
    </div>
  );
}
