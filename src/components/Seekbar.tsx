import { common } from 'replugged';
import { calculatePercentage, events, parseTime, toClassNameString, toggleClass } from '@util';
const { React } = common;

export default (props: {
  duration: number;
  playing: boolean;
  progress: number;
  progressRef: React.MutableRefObject<number>;
  showSeekbar: React.MutableRefObject<boolean>;
  timestamp: number;
}): JSX.Element => {
  const interval = React.useRef<number>(null);

  const progressTimestampRef = React.useRef<number>(0);
  const durationTimestampRef = React.useRef<number>(0);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const seekBarRef = React.useRef<HTMLDivElement>(null);
  const seekBarInnerRef = React.useRef<HTMLDivElement>(null);

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
      events.on<boolean>('seekbarVisibility', (event): void => {
        toggleClass(seekBarRef.current, 'hidden', !event.detail);

        toggleClass(containerRef.current, 'hidden', !props.showSeekbar.current);
      }),
    [],
  );

  return (
    <div
      className={toClassNameString('seekbar-container', !props.showSeekbar.current ? 'hidden' : '')}
      ref={containerRef}>
      <div className='seekbar-timestamps'>
        <span ref={currentRef} className='current'>
          {parseTime(props.progress)}
        </span>
        <span ref={durationRef} className='duration'>
          {parseTime(props.duration)}
        </span>
      </div>
      <div
        className='seekbar'
        ref={seekBarRef}
        onClick={(event: React.MouseEvent) =>
          events.emit('controlInteraction', {
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
};
