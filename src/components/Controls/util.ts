import { events } from '@util';
import { ControlInteractions } from '@typings';

export const emitRepeat = (
  event: React.MouseEvent,
  state: 'off' | 'context' | 'track',
  nextState: 'off' | 'context' | 'track',
): void =>
  events.emit<ControlInteractions.Repeat>('controlInteraction', {
    event,
    type: 'repeat',
    state: [state, nextState],
  });

export const emitSkipPrev = (event: React.MouseEvent, duration: number, progress: number): void =>
  events.emit<ControlInteractions.SkipPrev>('controlInteraction', {
    event,
    type: 'skipPrev',
    state: [duration, progress],
  });

export const emitPlayPause = (event: React.MouseEvent, state: boolean): void =>
  events.emit<ControlInteractions.PlayPause>('controlInteraction', {
    event,
    type: 'playPause',
    state,
  });

export const emitSkipNext = (event: React.MouseEvent): void =>
  events.emit<ControlInteractions.SkipNext>('controlInteraction', {
    event,
    type: 'skipNext',
  });

export const emitShuffle = (event: React.MouseEvent, state: boolean): void =>
  events.emit<ControlInteractions.Shuffle>('controlInteraction', {
    event,
    type: 'shuffle',
    state,
  });

export const emitVolume = (state: number): void =>
  events.emit<ControlInteractions.Volume>('controlInteraction', {
    type: 'volume',
    state,
  });
