import { settings } from 'replugged';

export const defaultConfig = {
  automaticReauthentication: true,
  controlsVisibilityState: 'auto',
  debugging: false,
  disabled: false,
  hyperlinkURI: true,
  pluginStopBehavior: 'ask',
  seekbarEnabled: true,
  seekbarVisibilityState: 'always',
  spotifyAppClientId: '',
  spotifyAppRedirectUri: '',
  spotifyAppOauthToken: '',
  skipPreviousShouldResetProgress: true,
  skipPreviousProgressResetThreshold: 0.15,
};

export type DefaultConfigType = typeof defaultConfig;
export type DefaultConfigTypeKeys = keyof DefaultConfigType;

export const config = await settings.init('lib.evelyn.SpotifyModal', defaultConfig);
