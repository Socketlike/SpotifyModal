import { settings } from 'replugged';

export const defaultConfig = {
  automaticReauthentication: false,
  controlsVisibilityState: 'auto',
  copyingArtistURLEnabled: true,
  copyingAlbumURLEnabled: true,
  copyingTrackURLEnabled: true,
  debuggingLogActiveAccountId: false,
  debuggingLogAccountInjection: false,
  debuggingLogComponentsUpdates: false,
  debuggingLogControls: false,
  debuggingLogNoSpotifyPause: false,
  debuggingLogModalInjection: false,
  debuggingLogState: false,
  hyperlinkArtistEnabled: true,
  hyperlinkAlbumEnabled: true,
  hyperlinkTrackEnabled: true,
  hyperlinkURI: true,
  noSpotifyPause: true,
  seekbarEnabled: true,
  seekbarVisibilityState: 'always',
  skipPreviousShouldResetProgress: true,
  skipPreviousProgressResetThreshold: 0.15,
};

export type defaultConfigType = typeof defaultConfig;

export const config = await settings.init('lib.evelyn.SpotifyModal', defaultConfig);
