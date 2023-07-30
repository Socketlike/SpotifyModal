import { DefaultConfigTypeKeys } from '@config';

export interface DebugEvent {
  tag: string;
  message: unknown | unknown[];
}

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
    newState: 'off' | 'context' | 'track';
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

export interface SettingsUpdate<T extends DefaultConfigTypeKeys, D> {
  key: T;
  value: D;
}

export type AllSettingsUpdate =
  | SettingsUpdate<
      'seekbarVisibilityState' | 'controlsVisibilityState',
      'always' | 'hidden' | 'auto'
    >
  | SettingsUpdate<'pluginStopBehavior', 'ask' | 'restartDiscord' | 'doNotRestartDiscord'>
  | SettingsUpdate<
      | 'automaticReauthentication'
      | 'debugging'
      | 'hyperlinkURI'
      | 'seekbarEnabled'
      | 'skipPreviousShouldResetProgress',
      boolean
    >
  | SettingsUpdate<'spotifyAppClientId' | 'spotifyAppRedirectUri', string>
  | SettingsUpdate<'spotifyAppOauthTokens', Record<string, string>>
  | SettingsUpdate<'skipPreviousProgressResetThreshold', number>;
