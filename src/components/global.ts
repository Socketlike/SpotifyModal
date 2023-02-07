import { settings } from 'replugged';
export const componentEventTarget = new EventTarget();

export const config = await replugged.settings.init('lib.evelyn.SpotifyModal', {
  automaticReauthentication: false,
  controlsVisibilityState: 0,
  copyingArtistURLEnabled: true,
  copyingAlbumURLEnabled: true,
  copyingTrackURLEnabled: true,
  hyperlinkArtistEnabled: true,
  hyperlinkAlbumEnabled: true,
  hyperlinkTrackEnabled: true,
  hyperlinkURI: true,
  progressDisplayVisibilityState: 0,
  seekbarEnabled: true,
  seekbarVisibilityState: 2,
  skipPreviousShouldResetProgress: true,
  skipPreviousResetProgressDuration: 0.15,
});

export const paths = {
  pause: 'M14,19H18V5H14M6,19H10V5H6V19Z',
  play: 'M8,5.14V19.14L19,12.14L8,5.14Z',
  repeatAll: 'M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z',
  repeatOne:
    'M13,15V9H12L10,10V11H11.5V15M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z',
  shuffle:
    'M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z',
  skipNext: 'M16,18H18V6H16M6,18L14.5,12L6,6V18Z',
  skipPrevious: 'M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z',
};
