import { common } from 'replugged';
import { ModalDispatchers } from '../types';
const { React } = common;

function calculatePercentage(current: number, end: number): string {
  if (!end) return '0%';
  return `${((current / end) * 100).toFixed(4)}%`;
}

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
  dispatchers: ModalDispatchers;
  playing: boolean;
  progress: React.MutableRefObject<number>;
  showProgress: boolean;
  showSeekbar: boolean;
}): JSX.Element {
  const interval = React.useRef<number>(null);
  const seekBarRef = React.useRef<HTMLDivElement>(null);
  const seekBarInnerRef = React.useRef<HTMLDivElement>(null);
  const currentRef = React.useRef<HTMLSpanElement>(null);
  const durationRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect((): (() => void) => {
    interval.current = setInterval((): void => {
      if (props.playing)
        props.progress.current =
          props.progress.current >= props.duration ? props.duration : props.progress.current + 500;
      if (
        seekBarInnerRef.current &&
        seekBarInnerRef.current.style.width !==
          calculatePercentage(props.progress.current, props.duration)
      )
        seekBarInnerRef.current.style.width = calculatePercentage(
          props.progress.current,
          props.duration,
        );
      if (currentRef.current && currentRef.current.innerText !== parseTime(props.progress.current))
        currentRef.current.innerText = parseTime(props.progress.current);
    }, 500) as unknown as number;

    return () => clearInterval(interval.current);
  }, [props.playing]);

  return (
    <>
      <div className={`progress-display${!props.showProgress ? ' hidden' : ''}`}>
        <span ref={currentRef} className='current'>
          {parseTime(props.progress.current)}
        </span>
        <span ref={durationRef} className='duration'>
          {parseTime(props.duration)}
        </span>
      </div>
      <div
        className={`seek-bar${!props.showSeekbar ? ' hidden' : ''}`}
        ref={seekBarRef}
        onClick={(event: React.MouseEvent) =>
          props.dispatchers.seeked(
            Math.round(
              props.duration *
                (event.nativeEvent.offsetX / (seekBarRef.current as HTMLDivElement).offsetWidth),
            ),
          )
        }>
        <div
          className='inner'
          ref={seekBarInnerRef}
          style={{ width: calculatePercentage(props.progress.current, props.duration) }}
        />
      </div>
    </>
  );
}
