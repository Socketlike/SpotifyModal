export interface ControlContextMenuProps {
  forceUpdate: React.MutableRefObject<() => void>;
  onPlayPauseClick?: (ev: React.MouseEvent) => void;
  onRepeatClick?: (ev: React.MouseEvent) => void;
  onShuffleClick?: (ev: React.MouseEvent) => void;
  onSkipPrevClick?: (ev: React.MouseEvent) => void;
  onSkipNextClick?: (ev: React.MouseEvent) => void;
  onVolumeChange?: (newVolume: number) => void;
  playing: React.MutableRefObject<boolean>;
  repeat: React.MutableRefObject<'off' | 'context' | 'track'>;
  shuffle: React.MutableRefObject<boolean>;
  volume: React.MutableRefObject<number>;
}

export interface MenuSliderControlProps {
  'aria-label': string;
  disabled: boolean;
  isFocused: boolean;
  maxValue: number;
  onChange?: (newValue: number) => void;
  onClose: () => void;
  value: number;
  ref: React.Ref<null | {
    activate: () => boolean;
    blur: () => void;
    focus: () => void;
  }>;
}

export type MenuSliderControlType = React.ForwardRefRenderFunction<
  React.Ref<null | {
    activate: () => boolean;
    blur: () => void;
    focus: () => void;
  }>,
  MenuSliderControlProps
>;
