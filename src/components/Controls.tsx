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
import {
  ControlContextMenuProps,
  ControlsComponentProps,
  MenuSliderControlType,
  PlayPauseInteraction,
  RepeatInteraction,
  ShuffleInteraction,
  SkipNextInteraction,
  SkipPrevInteraction,
  VolumeInteraction,
} from '@typings';
import { events, toClassNameString, toggleClass } from '@util';

const { React, contextMenu } = common;
const { ContextMenu } = components;

export const { MenuSliderControl } = await webpack.waitForModule<{
  MenuSliderControl: MenuSliderControlType;
}>(webpack.filters.byProps('Slider', 'Spinner'));

export function Icon(props: {
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  path: string;
}): JSX.Element {
  return (
    <svg
      className={toClassNameString('icon', props.className)}
      viewBox='0 0 24 24'
      onClick={props.onClick}
      onContextMenu={props.onContextMenu}>
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
            icon={() => (
              <Icon
                className='shuffle-icon'
                path={props.shuffle.current ? mdiShuffleDisabled : mdiShuffle}
              />
            )}
            action={(event: React.MouseEvent): void =>
              events.emit<ShuffleInteraction>('controlInteraction', {
                event,
                type: 'shuffle',
                currentState: props.shuffle.current,
              })
            }
          />
          <ContextMenu.MenuItem
            label='Skip to previous track'
            id='skip-previous'
            icon={() => <Icon className='skip-prev-icon' path={mdiSkipPrevious} />}
            action={(event: React.MouseEvent): void =>
              events.emit<SkipPrevInteraction>('controlInteraction', {
                event,
                type: 'skipPrev',
                currentDuration: props.duration.current,
                currentProgress: props.progress.current,
              })
            }
          />
          <ContextMenu.MenuItem
            label={`${props.playing.current ? 'Pause' : 'Resume'} playback`}
            id='play-pause'
            icon={() => (
              <Icon className='play-pause-icon' path={props.playing.current ? mdiPause : mdiPlay} />
            )}
            action={(event: React.MouseEvent): void =>
              events.emit<PlayPauseInteraction>('controlInteraction', {
                event,
                type: 'playPause',
                currentState: props.playing.current,
              })
            }
          />
          <ContextMenu.MenuItem
            label='Skip to next track'
            id='skip-next'
            icon={() => <Icon className='skip-next-icon' path={mdiSkipNext} />}
            action={(event: React.MouseEvent) =>
              events.emit<SkipNextInteraction>('controlInteraction', {
                event,
                type: 'skipNext',
              })
            }
          />
          <ContextMenu.MenuItem label='Toggle repeat' id='repeat'>
            <ContextMenu.MenuItem
              label='Off'
              id='repeat-off'
              disabled={props.repeat.current === 'off'}
              icon={() => <Icon className='repeat-off-icon' path={mdiRepeatOff} />}
              action={(event: React.MouseEvent): void =>
                events.emit<RepeatInteraction>('controlInteraction', {
                  event,
                  type: 'repeat',
                  currentState: props.repeat.current,
                  newState: 'off',
                })
              }
            />
            <ContextMenu.MenuItem
              label='All'
              id='repeat-all'
              disabled={props.repeat.current === 'context'}
              icon={() => <Icon className='repeat-all-icon' path={mdiRepeat} />}
              action={(event: React.MouseEvent): void =>
                events.emit<RepeatInteraction>('controlInteraction', {
                  event,
                  type: 'repeat',
                  currentState: props.repeat.current,
                  newState: 'context',
                })
              }
            />
            <ContextMenu.MenuItem
              label='Track'
              id='repeat-track'
              disabled={props.repeat.current === 'track'}
              icon={() => <Icon className='repeat-track-icon' path={mdiRepeatOnce} />}
              action={(event: React.MouseEvent): void =>
                events.emit<RepeatInteraction>('controlInteraction', {
                  event,
                  type: 'repeat',
                  currentState: props.repeat.current,
                  newState: 'track',
                })
              }
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
                onChange={(newVolume: number): void =>
                  events.emit<VolumeInteraction>('controlInteraction', {
                    type: 'volume',
                    newVolume,
                  })
                }
                {...data}
                ref={ref}
              />
            )}
          />
        </ContextMenu.MenuGroup>
      </ContextMenu.ContextMenu>
    );
  });

export const Controls = (props: ControlsComponentProps): JSX.Element => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const switchNextRepeatMode = React.useCallback(
    // eslint-disable-next-line consistent-return --- this rule is ridiculous
    (mode: 'off' | 'context' | 'track'): 'off' | 'context' | 'track' => {
      if (mode === 'off') return 'context';
      if (mode === 'context') return 'track';
      if (mode === 'track') return 'off';
    },
    [],
  );

  React.useEffect(
    events.on<boolean>('controlsVisibility', (event): void =>
      toggleClass(containerRef.current, 'hidden', !event.detail),
    ),
    [],
  );

  return (
    <div
      ref={containerRef}
      className={toClassNameString('controls-container', props.shouldShow.current ? '' : 'hidden')}>
      <Icon
        className={toClassNameString('shuffle-icon', props.shuffle ? 'active' : '')}
        path={mdiShuffle}
        onContextMenu={(e: React.MouseEvent): void => e.stopPropagation()}
        onClick={(event: React.MouseEvent): void =>
          events.emit<ShuffleInteraction>('controlInteraction', {
            event,
            currentState: props.shuffle,
            type: 'shuffle',
          })
        }
      />
      <Icon
        className='skip-prev-icon'
        path={mdiSkipPrevious}
        onContextMenu={(e: React.MouseEvent): void => e.stopPropagation()}
        onClick={(event: React.MouseEvent): void =>
          events.emit<SkipPrevInteraction>('controlInteraction', {
            event,
            currentDuration: props.duration,
            currentProgress: props.progress.current,
            type: 'skipPrev',
          })
        }
      />
      <Icon
        className='play-pause-icon'
        path={props.playing ? mdiPause : mdiPlay}
        onContextMenu={(e: React.MouseEvent): void => e.stopPropagation()}
        onClick={(event: React.MouseEvent): void =>
          events.emit<PlayPauseInteraction>('controlInteraction', {
            event,
            currentState: props.playing,
            type: 'playPause',
          })
        }
      />
      <Icon
        className='skip-next-icon'
        path={mdiSkipNext}
        onContextMenu={(e: React.MouseEvent): void => e.stopPropagation()}
        onClick={(event: React.MouseEvent): void =>
          events.emit<SkipNextInteraction>('controlInteraction', { event, type: 'skipNext' })
        }
      />
      <Icon
        className={toClassNameString('repeat-icon', props.repeat !== 'off' ? 'active' : '')}
        path={props.repeat !== 'track' ? mdiRepeat : mdiRepeatOnce}
        onContextMenu={(e: React.MouseEvent): void => e.stopPropagation()}
        onClick={(event: React.MouseEvent): void =>
          events.emit<RepeatInteraction>('controlInteraction', {
            event,
            currentState: props.repeat,
            newState: switchNextRepeatMode(props.repeat),
            type: 'repeat',
          })
        }
      />
    </div>
  );
};
