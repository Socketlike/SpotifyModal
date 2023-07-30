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
  const containerElementRef = React.useRef<HTMLDivElement>(null);

  const seekbarInnerElementRef = React.useRef<HTMLDivElement>(null);
  const seekbarGrabberElementRef = React.useRef<HTMLDivElement>(null);

  const progressTimeElementRef = React.useRef<HTMLSpanElement>(null);
  const durationTimeElementRef = React.useRef<HTMLSpanElement>(null);

  const isSliderChanging = React.useRef<boolean>(false);
  const isUpdating = React.useRef<boolean>(false);

  const interval = React.useRef<NodeJS.Timer>(null);

  const progressTimestampRef = React.useRef<number>(0);
  const durationTimestampRef = React.useRef<number>(0);

  const getProgressMS = React.useCallback(
    (): number =>
      props.playing
        ? progressTimestampRef.current >= durationTimestampRef.current
          ? props.duration
          : props.duration - (durationTimestampRef.current - progressTimestampRef.current)
        : props.progress,
    [props.playing, props.duration, props.progress],
  );

  React.useEffect((): VoidFunction => {
    if (!props.timestamp) return () => {};

    seekbarInnerElementRef.current = document.querySelector(
      '#spotify-modal .seekbar [class^=barFill-]',
    );
    seekbarGrabberElementRef.current = document.querySelector('#spotify-modal .seekbar .grabber');

    interval.current = setInterval((): void => {
      const now = Date.now();
      if (!durationTimestampRef.current)
        durationTimestampRef.current = now + props.duration - props.progress;
      progressTimestampRef.current = now;

      const progressMS = getProgressMS();
      const progressTime = parseTime(progressMS);
      const durationTime = parseTime(props.duration);
      const percentage = calculatePercentage(progressMS, props.duration);

      props.progressRef.current = progressMS;

      if (!isSliderChanging.current) {
        if (
          seekbarInnerElementRef.current &&
          seekbarInnerElementRef.current.style.width !== percentage
        )
          seekbarInnerElementRef.current.style.width = percentage;
        if (
          seekbarGrabberElementRef.current &&
          seekbarGrabberElementRef.current.style.left !== percentage
        )
          seekbarGrabberElementRef.current.style.left = percentage;
      }

      if (
        progressTimeElementRef.current &&
        progressTimeElementRef.current.innerText !== progressTime
      )
        progressTimeElementRef.current.innerText = progressTime;
      if (
        durationTimeElementRef.current &&
        durationTimeElementRef.current.innerText !== durationTime
      )
        durationTimeElementRef.current.innerText = durationTime;
    }, 500);

    return () => {
      clearInterval(interval.current);
      durationTimestampRef.current = 0;
    };
  }, [props.timestamp]);

  React.useEffect(
    (): VoidFunction =>
      events.on<boolean>('seekbarVisibility', (event): void =>
        toggleClass(containerElementRef.current, 'hidden', !event.detail),
      ),
    [],
  );

  return (
    <div
      className={toClassNameString('seekbar-container', !props.shouldShow.current ? 'hidden' : '')}
      ref={containerElementRef}>
      <div className='seekbar-timestamps'>
        <span ref={progressTimeElementRef} className='progress'>
          {parseTime(props.progress)}
        </span>
        <span ref={durationTimeElementRef} className='duration'>
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
        asValueChanges={(): void => {
          if (!isSliderChanging.current) isSliderChanging.current = true;
        }}
        onChange={(newValue: number): void => {
          if (isUpdating.current) return;

          isUpdating.current = true;

          events.emit('controlInteraction', {
            type: 'seek',
            newProgress: Math.round(newValue),
          });

          isUpdating.current = false;
          isSliderChanging.current = false;
        }}
        onValueRender={parseTime}
      />
    </div>
  );
};
