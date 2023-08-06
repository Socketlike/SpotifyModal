export namespace Components {
  export namespace Props {
    export interface ControlsComponent {
      duration: number;
      playing: boolean;
      progress: React.MutableRefObject<number>;
      repeat: 'off' | 'context' | 'track';
      shouldShow: React.MutableRefObject<boolean>;
      shuffle: boolean;
    }

    export interface ControlsContextMenu {
      duration: React.MutableRefObject<number>;
      forceUpdate: React.MutableRefObject<() => void>;
      playing: React.MutableRefObject<boolean>;
      progress: React.MutableRefObject<number>;
      repeat: React.MutableRefObject<'off' | 'context' | 'track'>;
      shuffle: React.MutableRefObject<boolean>;
      volume: React.MutableRefObject<number>;
    }

    export interface Modal {
      transitionState: 0 | 1 | 2 | 3 | 4;
      onClose(): Promise<void>;
    }

    export interface MenuSliderControl {
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

    export interface Interactable {
      onContextMenu?: (event: React.MouseEvent) => void;
      onClick?: (event: React.MouseEvent) => void;
    }

    export interface InteractableWithState<T> extends Interactable {
      state: T;
    }
  }

  export type MenuSliderControl = React.ForwardRefRenderFunction<
    React.Ref<null | {
      activate: () => boolean;
      blur: () => void;
      focus: () => void;
    }>,
    Props.MenuSliderControl
  >;
}
