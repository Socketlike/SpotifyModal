import { Logger, settings } from 'replugged';
import {
  mdiPause as pause,
  mdiPlay as play,
  mdiRepeat as repeatAll,
  mdiRepeatOnce as repeatOne,
  mdiShuffle as shuffle,
  mdiSkipNext as skipNext,
  mdiSkipPrevious as skipPrevious,
} from '@mdi/js';

export const logger = Logger.plugin('SpotifyModal');

export const componentEventTarget = new EventTarget();

/* Functions created purely for convenience */
export const dispatchEvent = <DataType>(name: string, detail?: DataType): void =>
  void componentEventTarget.dispatchEvent(new CustomEvent(name, { detail }));
export const listenToEvent = <DataType>(
  name: string,
  callback: (data: CustomEvent<DataType>) => void,
): (() => void) => {
  componentEventTarget.addEventListener(name, callback as EventListenerOrEventListenerObject);
  return () =>
    componentEventTarget.removeEventListener(name, callback as EventListenerOrEventListenerObject);
};
export const listenToElementEvent = <DataType>(
  element: HTMLElement,
  name: string,
  callback: (data: DataType) => void,
): (() => void) => {
  element.addEventListener(name, callback as EventListenerOrEventListenerObject);
  return () => element.removeEventListener(name, callback as EventListenerOrEventListenerObject);
};

export const config = await settings.init('lib.evelyn.SpotifyModal', {
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
  progressDisplayVisibilityState: 'auto',
  seekbarEnabled: true,
  seekbarVisibilityState: 'always',
  skipPreviousShouldResetProgress: true,
  skipPreviousProgressResetThreshold: 0.15,
});

export const paths = {
  pause,
  play,
  repeatAll,
  repeatOne,
  shuffle,
  skipNext,
  skipPrevious,
};
