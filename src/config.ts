import { settings } from 'replugged';

export type ControlButtonKinds =
  | 'shuffle'
  | 'skip-prev'
  | 'play-pause'
  | 'skip-next'
  | 'repeat'
  | 'blank';

export const defaultConfig = {
  automaticReauthentication: true,
  controlsLayout: ['shuffle', 'skip-prev', 'play-pause', 'skip-next', 'repeat'] as [
    ControlButtonKinds,
    ControlButtonKinds,
    ControlButtonKinds,
    ControlButtonKinds,
    ControlButtonKinds,
  ],
  controlsVisibilityState: 'auto',
  debugging: false,
  hyperlinkURI: true,
  pluginStopBehavior: 'ask',
  seekbarEnabled: true,
  seekbarVisibilityState: 'always',
  spotifyAppClientId: '',
  spotifyAppRedirectURI: '',
  spotifyAppOauthTokens: {} as Record<string, string>,
  skipPreviousShouldResetProgress: true,
  skipPreviousProgressResetThreshold: 0.15,
};

export type DefaultConfig = typeof defaultConfig;
export type DefaultConfigKeys = keyof DefaultConfig;

export const config = await settings.init('lib.evelyn.SpotifyModal', defaultConfig);
