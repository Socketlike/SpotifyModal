import { common, components, webpack } from 'replugged';
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

import { ControlContextMenuProps, MenuSliderControlType } from '@?typings';

const { React, contextMenu } = common;
const { ContextMenu } = components;

export const { MenuSliderControl } = await webpack.waitForModule<{
  MenuSliderControl: MenuSliderControlType;
}>(webpack.filters.byProps('Slider', 'Spinner'));

export function Icon(props: { className?: string; title?: string; path: string }): JSX.Element {
  return (
    <svg
      className={`icon${typeof props.className === 'string' ? ` ${props.className}` : ''}`}
      viewBox='0 0 24 24'>
      <path fill='currentColor' d={props.path} />
    </svg>
  );
}

const repeatLabels = {
  off: 'all',
  context: 'one',
  track: 'off',
};

const repeatIcons = {
  off: mdiRepeat,
  context: mdiRepeatOnce,
  track: mdiRepeatOff,
};

export const openControlsContextMenu = (
  ev: React.MouseEvent,
  props: ControlContextMenuProps,
): void =>
  contextMenu.open(ev, (): JSX.Element => {
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
    const destroyed = React.useRef<boolean>(false);

    React.useEffect((): VoidFunction => {
      props.forceUpdate.current = () => (destroyed.current ? undefined : forceUpdate());

      return (): void => {
        destroyed.current = true;
      };
    }, []);

    return (
      <ContextMenu.ContextMenu onClose={contextMenu.close} navId='spotify-modal-controls'>
        <ContextMenu.MenuItem
          label={`Toggle shuffle ${props.shuffle.current ? 'off' : 'on'}`}
          id='shuffle'
          icon={() => <Icon path={props.shuffle.current ? mdiShuffleDisabled : mdiShuffle} />}
          action={props.onShuffleClick}
        />
        <ContextMenu.MenuItem
          label='Skip to previous track'
          id='skip-previous'
          icon={() => <Icon path={mdiSkipPrevious} />}
          action={props.onSkipPrevClick}
        />
        <ContextMenu.MenuItem
          label={`${props.playing.current ? 'Pause' : 'Resume'} playback`}
          id='play-pause'
          icon={() => <Icon path={props.playing.current ? mdiPause : mdiPlay} />}
          action={props.onPlayPauseClick}
        />
        <ContextMenu.MenuItem
          label='Skip to next track'
          id='skip-next'
          icon={() => <Icon path={mdiSkipNext} />}
          action={props.onSkipNextClick}
        />
        <ContextMenu.MenuItem
          label={`Toggle repeat ${repeatLabels[props.repeat.current]}`}
          id='repeat'
          icon={() => <Icon path={repeatIcons[props.repeat.current]} />}
          action={props.onRepeatClick}
        />
        <ContextMenu.MenuControlItem
          id='volume'
          label='Player volume'
          control={(data, ref): JSX.Element => (
            <MenuSliderControl
              aria-label='Player volume'
              value={props.volume.current}
              maxValue={100}
              onChange={props.onVolumeChange}
              {...data}
              ref={ref}
            />
          )}
        />
        {/*        <ContextMenu.MenuCheckboxItem
          label='this is a cjheckbox'
          id='cjheckbox'
          checked={cjheckbox}
          action={() => {
            logger.log('(controls)', 'cjheckbox was clicked', !cjheckbox);
            setCjheckbox(!cjheckbox);
          }}
        />
        <ContextMenu.MenuControlItem
          id='sloider'
          label='this is a sloider'
          control={(data, ref): JSX.Element => (
            <MenuSliderControl
              aria-label='sloider'
              value={0}
              maxValue={100}
              onChange={(newValue: number): void =>
                logger.log('(controls)', 'new value from sloider', newValue)
              }
              {...data}
              ref={ref}
            />
          )}
        />*/}
      </ContextMenu.ContextMenu>
    );
  });
