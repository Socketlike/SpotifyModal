declare namespace SpotifyStore {
  type Socket = import('@typings/spotify').Socket;
  type Payload = import('@typings/spotify').Payload;
  type WSRawData = import('@typings/spotify').WSRawData;
  type Store = import('@typings/spotify').Store;
  type StoreVariables = import('@typings/spotify').StoreVariables;
}

declare namespace SpotifyModal {
  type WS = import('@typings/spotify').PluginWS;

  type DefaultConfig = import('@?utils').defaultConfigType;
  type ConfigKeys = keyof import('@?utils').defaultConfigType;

  namespace Components {
    type ControlContextMenuProps = import('@typings/components').ControlContextMenuProps;
    type MenuSliderControl = import('@typings/components').MenuSliderControl;
    type MenuSliderControlProps = import('@typings/components').MenuSliderControlProps;
  }

  namespace Events {
    type ControlInteraction<
      T extends string,
      D extends Record<string, unknown>,
    > = import('@typings/events').ControlInteraction<T, D>;
    type ShuffleInteraction = import('@typings/events').ShuffleInteraction;
    type SkipPrevInteraction = import('@typings/events').SkipPrevInteraction;
    type PlayPauseInteraction = import('@typings/events').PlayPauseInteraction;
    type SkipNextInteraction = import('@typings/events').SkipNextInteraction;
    type RepeatInteraction = import('@typings/events').RepeatInteraction;
    type SeekInteraction = import('@typings/events').SeekInteraction;
    type VolumeInteraction = import('@typings/events').VolumeInteraction;
    type ComponentsVisibilityUpdate = import('@typings/events').ComponentsVisibilityUpdate;
    type SettingsUpdate<
      T extends keyof defaultConfigType,
      D,
    > = import('@typings/events').SettingsUpdate<T, D>;
    type AllControlInteractions = import('@typings/events').AllControlInteractions;
    type AllSettingsUpdate = import('@typings/events').AllSettingsUpdate;
  }
}

declare type VoidFunction = () => void;

declare const DiscordNative: {
  clipboard: {
    copy: (content: string) => void;
  };
};
