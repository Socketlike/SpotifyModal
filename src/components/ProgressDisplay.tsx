import { common } from 'replugged';
import { dispatchEvent, listenToEvent } from './global';
const { React } = common;

function calculatePercentage(current: number, end: number): string {
  if (!end) return '0%';
  return `${((current / end) * 100).toFixed(4)}%`;
}

// This is the best solution so far though not quite performant (I tried moment.js)
function parseTime(ms: number): string {
  if (typeof ms !== 'number') return '';
  const dateObject = new Date(ms);
  const raw = {
    month: dateObject.getUTCMonth(),
    day: dateObject.getUTCDate(),
    hours: dateObject.getUTCHours(),
    minutes: dateObject.getUTCMinutes(),
    seconds: dateObject.getUTCSeconds(),
  };
  const parsedHours = raw.hours + (raw.day - 1) * 24 + raw.month * 30 * 24;

  return `${parsedHours > 0 ? `${parsedHours}:` : ''}${
    raw.minutes < 10 && parsedHours > 0 ? `0${raw.minutes}` : raw.minutes
  }:${raw.seconds < 10 ? `0${raw.seconds}` : raw.seconds}`;
}

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

  React.useEffect((): (() => void) => {
    const removeUpdateListener = listenToEvent<{ progressDisplay: boolean; seekBar: boolean }>(
      'componentsVisibilityUpdate',
      (event): void => {
        if (event.detail.seekBar && seekBarRef.current.classList.contains('hidden'))
          seekBarRef.current.classList.remove('hidden');
        else if (!event.detail.seekBar && !seekBarRef.current.classList.contains('hidden'))
          seekBarRef.current.classList.add('hidden');

        if (event.detail.progressDisplay && progressDisplayRef.current.classList.contains('hidden'))
          progressDisplayRef.current.classList.remove('hidden');
        else if (
          !event.detail.progressDisplay &&
          !progressDisplayRef.current.classList.contains('hidden')
        )
          progressDisplayRef.current.classList.add('hidden');
      },
    );

    return removeUpdateListener;
  }, []);

  return (
    <>
      <div
        className={`progress-display${!props.showProgress.current ? ' hidden' : ''}`}
        ref={progressDisplayRef}>
        <span ref={currentRef} className='current'>
          {parseTime(props.progress)}
        </span>
        <span ref={durationRef} className='duration'>
          {parseTime(props.duration)}
        </span>
      </div>
      <div
        className={`seek-bar${!props.showSeekbar.current ? ' hidden' : ''}`}
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
    </>
  );
}
