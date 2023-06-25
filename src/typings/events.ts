import { defaultConfigType } from '@?utils';

export type ControlInteraction<T extends string, D extends Record<string, unknown>> = {
  event?: React.MouseEvent;
  type: T;
} & D;

export type ShuffleInteraction = ControlInteraction<'shuffle', { currentState: boolean }>;

export type SkipPrevInteraction = ControlInteraction<
  'skipPrev',
  {
    currentProgress: number;
    currentDuration: number;
  }
>;

export type PlayPauseInteraction = ControlInteraction<
  'playPause',
  {
    currentState: boolean;
  }
>;

export type SkipNextInteraction = ControlInteraction<'skipNext', { _?: void }>;

export type RepeatInteraction = ControlInteraction<
  'repeat',
  {
    currentState: 'off' | 'context' | 'track';
  }
>;

export type SeekInteraction = ControlInteraction<'seek', { newProgress: number }>;

export type VolumeInteraction = ControlInteraction<'volume', { newVolume: number }>;

export type AllControlInteractions =
  | ShuffleInteraction
  | SkipPrevInteraction
  | PlayPauseInteraction
  | SkipNextInteraction
  | RepeatInteraction
  | SeekInteraction
  | VolumeInteraction;

export interface ComponentsVisibilityUpdate {
  seekBar: boolean;
}

export interface SettingsUpdate<T extends keyof defaultConfigType, D> {
  key: T;
  value: D;
}

export type AllSettingsUpdate =
  | SettingsUpdate<'seekbarVisibilityState', 'always' | 'hidden' | 'auto'>
  | SettingsUpdate<
      | 'copyingAlbumURLEnabled'
      | 'copyingTrackURLEnabled'
      | 'hyperlinkArtistEnabled'
      | 'hyperlinkAlbumEnabled'
      | 'hyperlinkTrackEnabled'
      | 'hyperlinkURI'
      | 'debuggingLogActiveAccountId'
      | 'debuggingLogAccountInjection'
      | 'debuggingLogComponentsUpdates'
      | 'debuggingLogControls'
      | 'debuggingLogModalInjection'
      | 'debuggingLogState'
      | 'debuggingLogNoSpotifyPause'
      | 'automaticReauthentication'
      | 'noSpotifyPause'
      | 'seekbarEnabled'
      | 'skipPreviousShouldResetProgress',
      boolean
    >
  | SettingsUpdate<'skipPreviousProgressResetThreshold', number>;
