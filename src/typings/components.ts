export interface ControlsComponentProps {
  duration: number;
  playing: boolean;
  progress: React.MutableRefObject<number>;
  repeat: 'off' | 'context' | 'track';
  shouldShow: React.MutableRefObject<boolean>;
  shuffle: boolean;
}

export interface ControlContextMenuProps {
  duration: React.MutableRefObject<number>;
  forceUpdate: React.MutableRefObject<() => void>;
  playing: React.MutableRefObject<boolean>;
  progress: React.MutableRefObject<number>;
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

export interface ModalProps {
  transitionState: 0 | 1 | 2 | 3 | 4;
  onClose(): Promise<void>;
}
