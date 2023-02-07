import { common } from 'replugged';
import { ProgressContextInterface } from '../types';
import { componentEventTarget } from './global';
const { React } = common;

export const ProgressContext = React.createContext<ProgressContextInterface>({
  duration: 0,
  modifyProgress: (): void => {},
  onProgressModified: (newProgress: number): boolean =>
    componentEventTarget.dispatchEvent(
      new CustomEvent<number>('progressChange', { detail: newProgress }),
    ),
  playing: false,
  progress: 0,
  shouldShowProgressDisplay: false,
  shouldShowSeekbar: true,
});

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

export function ProgressContainer(): JSX.Element {
  const context = React.useContext<ProgressContextInterface>(ProgressContext);
  const interval = React.useRef<number>(null);
  const seekBarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect((): (() => void) => {
    if (context.playing) {
      interval.current = setInterval(
        () =>
          context.modifyProgress((previous: number): number =>
            previous + 500 >= context.duration ? context.duration : previous + 500,
          ),
        500,
      ) as unknown as number;
    } else clearInterval(interval.current);

    return () => clearInterval(interval.current);
  }, [context.playing]);

  return (
    <>
      <div className={`progress-display${!context.shouldShowProgressDisplay ? ' hidden' : ''}`}>
        <span className='current'>{parseTime(context.progress)}</span>
        <span className='duration'>{parseTime(context.duration)}</span>
      </div>
      <div
        className={`seek-bar${!context.shouldShowSeekbar ? ' hidden' : ''}`}
        ref={seekBarRef}
        onClick={(event: React.MouseEvent) =>
          context.onProgressModified(
            Math.round(
              context.duration *
                (event.nativeEvent.offsetX / (seekBarRef.current as HTMLDivElement).offsetWidth),
            ),
          )
        }>
        <div
          className='inner'
          style={{ width: calculatePercentage(context.progress, context.duration) }}
        />
      </div>
    </>
  );
}
