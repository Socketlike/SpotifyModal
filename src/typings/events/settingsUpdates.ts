import { ControlButtonKinds, DefaultConfig, DefaultConfigKeys } from '@config';

export namespace SettingUpdates {
  interface Base<T extends DefaultConfigKeys, D extends DefaultConfig[T]> {
    key: T;
    value: D;
  }

  export type AutomaticReauthentication = Base<'automaticReauthentication', boolean>;

  export type ControlsLayout = Base<
    'controlsLayout',
    [
      ControlButtonKinds,
      ControlButtonKinds,
      ControlButtonKinds,
      ControlButtonKinds,
      ControlButtonKinds,
    ]
  >;

  export type ControlsVisibilityState = Base<
    'controlsVisibilityState',
    'always' | 'hidden' | 'auto'
  >;

  export type Debugging = Base<'debugging', boolean>;

  export type HyperlinkURI = Base<'hyperlinkURI', boolean>;

  export type PluginStopBehavior = Base<'pluginStopBehavior', 'ask' | 'restartDiscord'>;

  export type SeekbarEnabled = Base<'seekbarEnabled', boolean>;

  export type SeekbarVisibilityState = Base<'seekbarVisibilityState', 'always' | 'hidden' | 'auto'>;

  export type SpotifyAppClientId = Base<'spotifyAppClientId', string>;

  export type SpotifyAppRedirectURI = Base<'spotifyAppRedirectURI', string>;

  export type SpotifyAppOauthTokens = Base<'spotifyAppOauthTokens', Record<string, string>>;

  export type SkipPreviousShouldResetProgress = Base<'skipPreviousShouldResetProgress', boolean>;

  export type SkipPreviousProgressResetThreshold = Base<
    'skipPreviousProgressResetThreshold',
    number
  >;

  export type Union =
    | AutomaticReauthentication
    | ControlsLayout
    | ControlsVisibilityState
    | Debugging
    | HyperlinkURI
    | PluginStopBehavior
    | SeekbarEnabled
    | SeekbarVisibilityState
    | SpotifyAppClientId
    | SpotifyAppRedirectURI
    | SpotifyAppOauthTokens
    | SkipPreviousShouldResetProgress
    | SkipPreviousProgressResetThreshold;
}
