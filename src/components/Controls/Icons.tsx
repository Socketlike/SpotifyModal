import {
  mdiPause,
  mdiPlay,
  mdiRepeat,
  mdiRepeatOff,
  mdiRepeatOnce,
  mdiShuffle,
  mdiShuffleDisabled,
  mdiSkipNext,
  mdiSkipPrevious,
} from '@mdi/js';
import { toClassNameString } from '@util';
import { Icon } from '@components/Icon';
import { common } from 'replugged';
import { Components } from '@typings';

const { React } = common;

export const RepeatIcon = ({
  onClick,
  onContextMenu,
  state,
}: Components.Props.InteractableWithState<'context' | 'track' | 'off'>): JSX.Element => (
  <Icon
    className={toClassNameString(
      `repeat-${state === 'context' ? 'all' : state}-icon`,
      state !== 'off' ? 'active' : '',
    )}
    path={state === 'off' ? mdiRepeatOff : state === 'track' ? mdiRepeatOnce : mdiRepeat}
    onContextMenu={onContextMenu}
    onClick={onClick}
  />
);

export const SkipPrevIcon = ({
  onContextMenu,
  onClick,
}: Components.Props.Interactable): JSX.Element => (
  <Icon
    className='skip-prev-icon'
    path={mdiSkipPrevious}
    onContextMenu={onContextMenu}
    onClick={onClick}
  />
);

export const PlayPauseIcon = ({
  onClick,
  onContextMenu,
  state,
}: Components.Props.InteractableWithState<boolean>): JSX.Element => (
  <Icon
    className={`${state ? 'pause' : 'play'}-icon`}
    path={state ? mdiPause : mdiPlay}
    onContextMenu={onContextMenu}
    onClick={onClick}
  />
);

export const SkipNextIcon = ({
  onClick,
  onContextMenu,
}: Components.Props.Interactable): JSX.Element => (
  <Icon
    className='skip-next-icon'
    path={mdiSkipNext}
    onContextMenu={onContextMenu}
    onClick={onClick}
  />
);

export const ShuffleIcon = ({
  onClick,
  onContextMenu,
  state,
}: Components.Props.InteractableWithState<boolean>): JSX.Element => (
  <Icon
    className={toClassNameString(`shuffle-${state ? 'on' : 'off'}-icon`, state ? 'active' : '')}
    path={state ? mdiShuffle : mdiShuffleDisabled}
    onContextMenu={onContextMenu}
    onClick={onClick}
  />
);

export const NoIcon = ({ onClick, onContextMenu }: Components.Props.Interactable) => (
  <Icon className='no-icon' path='' onContextMenu={onContextMenu} onClick={onClick} />
);
