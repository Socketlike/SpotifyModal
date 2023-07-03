import { common, components } from 'replugged';
import { calculatePercentage, events, parseTime, toClassNameString, toggleClass } from '@util';

const { React } = common;
const { Slider } = components;

export default (props: {
  duration: number;
  playing: boolean;
  progress: number;
  progressRef: React.MutableRefObject<number>;
  shouldShow: React.MutableRefObject<boolean>;
  timestamp: number;
}): JSX.Element => {
  const isUpdating = React.useRef<boolean>(false);

  const interval = React.useRef<number>(null);

  const progressTimestampRef = React.useRef<number>(0);
  const durationTimestampRef = React.useRef<number>(0);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const seekbarInnerRef = React.useRef<HTMLDivElement>(null);
  const seekbarGrabberRef = React.useRef<HTMLDivElement>(null);

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

    seekbarInnerRef.current = document.querySelector('#spotify-modal .seekbar [class^=barFill-]');
    seekbarGrabberRef.current = document.querySelector('#spotify-modal .seekbar .grabber');

    interval.current = setInterval((): void => {
      const now = Date.now();
      if (!durationTimestampRef.current)
        durationTimestampRef.current = now + props.duration - props.progress;
      progressTimestampRef.current = now;

      const currentPercentage = calculatePercentage(
        getProgressMS(props.playing, props.duration, props.progress),
        props.duration,
      );

      if (seekbarInnerRef.current && seekbarInnerRef.current.style.width !== currentPercentage)
        seekbarInnerRef.current.style.width = currentPercentage;
      if (seekbarGrabberRef.current && seekbarGrabberRef.current.style.left !== currentPercentage)
        seekbarGrabberRef.current.style.left = currentPercentage;

      if (
        props.progressRef.current !== getProgressMS(props.playing, props.duration, props.progress)
      )
        props.progressRef.current = getProgressMS(props.playing, props.duration, props.progress);

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
      events.on<boolean>('seekbarVisibility', (event): void =>
        toggleClass(containerRef.current, 'hidden', !event.detail),
      ),
    [],
  );

  return (
    <div
      className={toClassNameString('seekbar-container', !props.shouldShow.current ? 'hidden' : '')}
      ref={containerRef}>
      <div className='seekbar-timestamps'>
        <span ref={currentRef} className='current'>
          {parseTime(props.progress)}
        </span>
        <span ref={durationRef} className='duration'>
          {parseTime(props.duration)}
        </span>
      </div>
      <Slider
        className='seekbar'
        barClassName='inner'
        grabberClassName='grabber'
        mini={true}
        minValue={0}
        maxValue={props.duration}
        value={props.progress}
        onChange={(newValue: number): void => {
          if (isUpdating.current) return;

          isUpdating.current = true;

          events.emit('controlInteraction', {
            type: 'seek',
            newProgress: Math.round(newValue),
          });

          isUpdating.current = false;
        }}
        onValueRender={parseTime}
      />
    </div>
  );
};
