import { Component } from './common';

/*
const a = elementUtilities.attributes;
const e = elementUtilities.element;
const f = elementUtilities.effects;
*/

const pathProps = {
  fill: 'currentColor',
};

const play = new Component('path', 'play-icon-path', {
  svg: true,
  classes: ['spotify-modal-play-icon-path'],
  children: undefined,
  props: { ...pathProps, d: 'M8,5.14V19.14L19,12.14L8,5.14Z' },
});

const pause = new Component('path', 'pause-icon-path', {
  svg: true,
  classes: ['spotify-modal-play-icon-path'],
  children: undefined,
  props: { ...pathProps, d: 'M14,19H18V5H14M6,19H10V5H6V19Z' },
});

/* Play & pause icon */
const play = e('path', 'spotify-modal-play-icon-path', undefined, {
  ...a.path,
  d: 'M8,5.14V19.14L19,12.14L8,5.14Z',
}) as SVGPathElement;
const pause = e('path', 'spotify-modal-pause-icon-path', undefined, {
  ...a.path,
  d: 'M14,19H18V5H14M6,19H10V5H6V19Z',
}) as SVGPathElement;
const playPause = e(
  'svg',
  'spotify-modal-play-pause-icon',
  'color: var(--text-normal); margin: 0px 10px',
  a.svg,
  [play],
) as SVGSVGElement;
f('hover', playPause, {
  hover: { duration: 400, onhover: 'var(--brand-experiment-500)', onleave: 'var(--text-normal)' },
});

/* Repeat icon */
const repeatAll = e('path', 'spotify-modal-repeat-all-path', undefined, {
  ...a.path,
  d: 'M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z',
}) as SVGPathElement;
const repeatOne = e('path', 'spotify-modal-repeat-one-path', undefined, {
  ...a.path,
  d: 'M13,15V9H12L10,10V11H11.5V15M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z',
}) as SVGPathElement;
const repeatTitle = e(
  { name: 'title', svg: true },
  'spotify-modal-repeat-icon-title',
) as SVGTitleElement;
const repeat = e(
  'svg',
  'spotify-modal-repeat-icon',
  'color: var(--text-normal); margin: 0px 10px 0px auto',
  a.svg,
  [repeatTitle, repeatAll],
) as SVGSVGElement;

/* Shuffle icon */
const shuffleTitle = e(
  { name: 'title', svg: true },
  'spotify-modal-shuffle-icon-title',
) as SVGTitleElement;
const shuffle = e('svg', 'spotify-modal-shuffle-icon', 'color: var(--text-normal)', a.svg, [
  shuffleTitle,
  e('path', 'spotify-modal-shuffle-icon-path', undefined, {
    ...a.path,
    d: 'M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z',
  }),
]) as SVGSVGElement;

/* Skip previous icon */
const skipPrevious = e(
  'svg',
  'spotify-modal-skip-previous-icon',
  'color: var(--text-normal); margin-left: auto',
  a.svg,
  [
    e('path', 'spotify-modal-skip-previous-icon-path', undefined, {
      ...a.path,
      d: 'M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z',
    }),
  ],
) as SVGSVGElement;
f('hover', skipPrevious, {
  hover: { duration: 400, onhover: 'var(--brand-experiment-400)', onleave: 'var(--text-normal)' },
});

/* Skip next icon */
const skipNext = e('svg', 'spotify-modal-skip-next-icon', 'color: var(--text-normal)', a.svg, [
  e('path', 'spotify-modal-skip-next-icon-path', undefined, {
    ...a.path,
    d: 'M16,18H18V6H16M6,18L14.5,12L6,6V18Z',
  }),
]) as SVGSVGElement;
f('hover', skipNext, {
  hover: { duration: 400, onhover: 'var(--brand-experiment-400)', onleave: 'var(--text-normal)' },
});

export const icons = {
  play,
  pause,
  playPause,
  repeatTitle,
  repeatAll,
  repeatOne,
  repeat,
  shuffleTitle,
  shuffle,
  skipPrevious,
  skipNext,
};

/* Dock icons container */
const dockIcons = e(
  'div',
  'spotify-modal-dock-icons',
  'padding-top: 5px; ' +
    'padding-left: 5px; ' +
    'height: 24px; ' +
    'width: 100%; ' +
    'display: flex; ' +
    'flex-direction: row',
  undefined,
  [shuffle, skipPrevious, playPause, skipNext, repeat],
) as HTMLDivElement;
const dockIconsFade = f('fade', dockIcons) as FadeAnimations;

/* Song title */
const title = e('a', 'spotify-modal-song-title', 'font-size: 14px', {
  target: '_blank',
}) as HTMLAnchorElement;

/* Artist list */
const artists = e(
  'div',
  'spotify-modal-song-artists',
  'color: var(--header-secondary); font-size: 13px',
) as HTMLDivElement;

/* Song title & Artists container */
const metadata = e(
  'div',
  'spotify-modal-metadata',
  'margin: 10px; ' +
    'display: flex; ' +
    'flex-direction: column; ' +
    'max-width: 145px; ' +
    'overflow: hidden; ' +
    'white-space: nowrap',
  undefined,
  [title, artists],
) as HTMLDivElement;
const metadataFade = f('fade', metadata) as FadeAnimations;

/* Current playback time element */
const playbackTimeCurrent = e('span', 'spotify-modal-playback-time-current') as HTMLSpanElement;

/* Playback duration element */
const playbackTimeDuration = e(
  'span',
  'spotify-modal-playback-time-duration',
  'margin-left: auto; margin-right: 16px',
) as HTMLSpanElement;

/* Playback time display container */
const playbackTimeDisplay = e(
  'div',
  'spotify-modal-playback-time',
  'display: flex; ' +
    'position: relative; ' +
    'top: -7px; ' +
    'left: 8px; ' +
    'height: 16px; ' +
    'color: var(--text-normal); ' +
    'font-size: 12px',
  undefined,
  [playbackTimeCurrent, playbackTimeDuration],
) as HTMLDivElement;
const playbackTimeDisplayFade = f('fade', playbackTimeDisplay) as FadeAnimations;

/* Progress bar inner */
const progressBarInner = e(
  'div',
  'spotify-modal-progressbar-inner',
  'background-color: var(--text-normal); ' +
    'height: 4px; ' +
    'width: 0%; ' +
    'max-width: 100%; ' +
    'border-radius: 8px',
) as HTMLDivElement;

/* Progress bar */
const progressBar = e(
  'div',
  'spotify-modal-progressbar',
  'height: 4px; ' +
    'border-radius: 8px; ' +
    'background-color: var(--background-modifier-accent); ' +
    'width: calc(100% - 10px); ' +
    'position: relative; ' +
    'left: 5px; ' +
    'top: -5px; ' +
    'margin: 0px',
  undefined,
  [progressBarInner],
) as HTMLDivElement;
const progressBarFade = f('fade', progressBar) as FadeAnimations;

/* Cover art */
const coverArt = e(
  'image',
  'spotify-modal-cover-art',
  'max-height: 80%; max-width: 80%; border-radius: 8px; object-fit: contain',
) as HTMLImageElement;
const coverArtFade = f('fade', coverArt) as FadeAnimations;

/* Playback time & Icons container */
const dock = e(
  'div',
  'spotify-modal-dock',
  'display: flex; flex-direction: column; padding-bottom: 4px',
  undefined,
  [playbackTimeDisplay, progressBar, dockIcons],
) as HTMLDivElement;
const dockFade = f('fade', dock) as FadeAnimations;

/* Main modal */
const modal = e(
  'div',
  'spotify-modal',
  'display: flex; height: 60px; padding-bottom: 8px; padding-top: 4px',
  undefined,
  [coverArt, metadata],
) as HTMLDivElement;
const modalFade = f('fade', modal) as FadeAnimations;

/* Modal container */
const modalContainer = e(
  'div',
  'spotify-modal-container',
  'display: flex; flex-direction: column',
  undefined,
  [modal, dock],
) as HTMLDivElement;
const modalContainerFade = f('fade', modalContainer) as FadeAnimations;

export const components = {
  artists,
  coverArt,
  dock,
  dockIcons,
  metadata,
  modal,
  modalContainer,
  playbackTimeCurrent,
  playbackTimeDuration,
  playbackTimeDisplay,
  progressBarInner,
  progressBar,
  title,
};

export const animations = {
  coverArt: coverArtFade,
  dock: dockFade,
  dockIcons: dockIconsFade,
  metadata: metadataFade,
  modal: modalFade,
  modalContainer: modalContainerFade,
  playbackTimeDisplay: playbackTimeDisplayFade,
  progressBar: progressBarFade,
};
