export namespace ControlInteractions {
  interface Base<T extends string, D = never> {
    event?: React.MouseEvent;
    type: T;
    state: D;
  }

  export type Shuffle = Base<'shuffle', boolean>;

  // [progress, duration]
  export type SkipPrev = Base<'skipPrev', [number, number]>;

  export type PlayPause = Base<'playPause', boolean>;

  export type SkipNext = Omit<Base<'skipNext'>, 'state'>;

  // [current, new]
  export type Repeat = Base<'repeat', ['off' | 'context' | 'track', 'off' | 'context' | 'track']>;

  export type Seek = Base<'seek', number>;

  export type Volume = Base<'volume', number>;

  export type Union = Shuffle | SkipPrev | PlayPause | SkipNext | Repeat | Seek | Volume;
}
