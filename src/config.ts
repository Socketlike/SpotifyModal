import { settings } from 'replugged';

export const defaultConfig = {
  automaticReauthentication: true,
  controlsLayout: ['shuffle', 'skip-prev', 'play-pause', 'skip-next', 'repeat'] as Array<
    'shuffle' | 'skip-prev' | 'play-pause' | 'skip-next' | 'repeat' | 'blank'
  >,
  controlsVisibilityState: 'auto',
  debugging: false,
  hyperlinkURI: true,
  pluginStopBehavior: 'ask',
  seekbarEnabled: true,
  seekbarVisibilityState: 'always',
  spotifyAppClientId: '',
  spotifyAppRedirectUri: '',
  spotifyAppOauthTokens: {} as Record<string, string>,
  skipPreviousShouldResetProgress: true,
  skipPreviousProgressResetThreshold: 0.15,
};

export type DefaultConfigType = typeof defaultConfig;
export type DefaultConfigTypeKeys = keyof DefaultConfigType;

export const config = await settings.init('lib.evelyn.SpotifyModal', defaultConfig);
