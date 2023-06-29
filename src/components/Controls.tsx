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

import { ControlContextMenuProps, MenuSliderControlType } from '@typings';

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
        <ContextMenu.MenuGroup label='Controls'>
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
          <ContextMenu.MenuItem label='Toggle repeat' id='repeat'>
            <ContextMenu.MenuItem
              label='Off'
              id='repeat-off'
              disabled={props.repeat.current === 'off'}
              icon={() => <Icon path={mdiRepeatOff} />}
              action={(ev: React.MouseEvent): void => props.onRepeatClick(ev, 'off')}
            />
            <ContextMenu.MenuItem
              label='All'
              id='repeat-all'
              disabled={props.repeat.current === 'context'}
              icon={() => <Icon path={mdiRepeat} />}
              action={(ev: React.MouseEvent): void => props.onRepeatClick(ev, 'context')}
            />
            <ContextMenu.MenuItem
              label='Track'
              id='repeat-track'
              disabled={props.repeat.current === 'track'}
              icon={() => <Icon path={mdiRepeatOnce} />}
              action={(ev: React.MouseEvent): void => props.onRepeatClick(ev, 'track')}
            />
          </ContextMenu.MenuItem>
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
        </ContextMenu.MenuGroup>
      </ContextMenu.ContextMenu>
    );
  });
