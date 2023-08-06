import {
  NoIcon,
  PlayPauseIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipNextIcon,
  SkipPrevIcon,
} from './Icons';
import { emitPlayPause, emitRepeat, emitShuffle, emitSkipNext, emitSkipPrev } from './util';
import { common } from 'replugged';

const { React } = common;

export const RepeatButton = ({ state }: { state: 'context' | 'track' | 'off' }): JSX.Element => {
  const nextState = React.useMemo((): 'off' | 'context' | 'track' => {
    if (state === 'off') return 'context';
    else if (state === 'context') return 'track';
    else return 'off';
  }, [state]);

  return (
    <RepeatIcon
      onContextMenu={(e: React.MouseEvent): void => e.stopPropagation()}
      onClick={(e: React.MouseEvent): void => emitRepeat(e, state, nextState)}
      state={state}
    />
  );
};

export const SkipPrevButton = ({
  duration,
  progress,
}: {
  duration: number;
  progress: React.MutableRefObject<number>;
}): JSX.Element => (
  <SkipPrevIcon
    onContextMenu={(e: React.MouseEvent): void => e.stopPropagation()}
    onClick={(e: React.MouseEvent): void => emitSkipPrev(e, duration, progress.current)}
  />
);

export const PlayPauseButton = ({ state }: { state: boolean }): JSX.Element => (
  <PlayPauseIcon
    onContextMenu={(e: React.MouseEvent): void => e.stopPropagation()}
    onClick={(e: React.MouseEvent): void => emitPlayPause(e, state)}
    state={state}
  />
);

export const SkipNextButton = (): JSX.Element => (
  <SkipNextIcon
    onContextMenu={(e: React.MouseEvent): void => e.stopPropagation()}
    onClick={(e: React.MouseEvent): void => emitSkipNext(e)}
  />
);

export const ShuffleButton = ({ state }: { state: boolean }) => (
  <ShuffleIcon
    onContextMenu={(e: React.MouseEvent): void => e.stopPropagation()}
    onClick={(e: React.MouseEvent): void => emitShuffle(e, state)}
    state={state}
  />
);

export const NoButton = (): JSX.Element => (
  <NoIcon onContextMenu={(e: React.MouseEvent): void => e.stopPropagation()} />
);
