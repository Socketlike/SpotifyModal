import { common, logger, webpack } from "replugged";

import {
  _dockIconsElement,
  _metadataElement,
  _playbackTimeDisplayElement,
  _timebarElement,
  artistsElement,
  coverArtElement,
  dockAnimations,
  dockElement,
  modalAnimations,
  modalElement,
  parseArtists,
  playbackTimeCurrentElement,
  playbackTimeDurationElement,
  timebarInnerElement,
  titleElement,
} from "./modal";
import {
  pausePath,
  playPath,
  playPauseIcon,
  repeatAllPath,
  repeatIcon,
  repeatIconTitle,
  repeatOnePath,
  shuffleIcon,
  shuffleIconTitle,
  skipNextIcon,
  skipPreviousIcon,
} from "./icons";

const timebarUpdateRate = 500;

const modalManager = new ModalManager();

// Register anchorlike href for cover art image
coverArtElement.onclick = () => {
  if (!modalManager.playerState.trackState.albumUrl) return;
  window.open(modalManager.playerState.trackState.albumUrl, "_blank");
};

// Register controls
playPauseIcon.onclick = () => {
  controls.togglePlaybackState();
};

repeatIcon.onclick = () => {
  let nextMode = 0;
  if (modalManager.playerState.repeatMode === "off") nextMode = 1;
  else if (modalManager.playerState.repeatMode === "context") nextMode = 2;
  else if (modalManager.playerState.repeatMode === "track") nextMode = 0;
  controls.toggleRepeatState(nextMode);
};

repeatIcon.onmouseenter = () => {
  repeatIcon.style.color = "var(--brand-experiment-400)";
};

repeatIcon.onmouseleave = () => {
  repeatIcon.style.color =
    modalManager.playerState.repeatMode === "off"
      ? "var(--text-normal)"
      : "var(--brand-experiment-500)";
};

shuffleIcon.onclick = () => {
  controls.togglePlaybackShuffle(!modalManager.playerState.shuffleOn);
};

shuffleIcon.onmouseenter = () => {
  shuffleIcon.style.color = "var(--brand-experiment-400)";
};

shuffleIcon.onmouseleave = () => {
  shuffleIcon.style.color = modalManager.playerState.shuffleOn
    ? "var(--brand-experiment-500)"
    : "var(--text-normal)";
};

skipPreviousIcon.onclick = () => {
  controls.skipToPreviousOrNext(false);
};

skipNextIcon.onclick = () => {
  controls.skipToPreviousOrNext();
};

// @ts-expect-error - We are doing mutations
window.SpotifyModal = {
  components: {
    _dockIconsElement,
    _metadataElement,
    _playbackTimeDisplayElement,
    _timebarElement,
    artistsElement,
    coverArtElement,
    dockAnimations,
    dockElement,
    modalAnimations,
    modalElement,
    parseArtists,
    playbackTimeCurrentElement,
    playbackTimeDurationElement,
    timebarInnerElement,
    titleElement,
  },
  icons: {
    pausePath,
    playPath,
    playPauseIcon,
    repeatIcon,
    repeatAllPath,
    repeatOnePath,
    repeatIconTitle,
    shuffleIcon,
    shuffleIconTitle,
    skipNextIcon,
    skipPreviousIcon,
  },
  controls,
  modalManager,
};

export async function start(): Promise<void> {
  await modalManager.getClasses();
  modalManager.registerFluxSubscription();
}

export function stop(): void {
  modalManager.uninjectModal();
  if (typeof modalManager.timebarSetIntervalId === "number")
    clearInterval(modalManager.timebarSetIntervalId);
  modalManager.unregisterFluxSubscription();
}
