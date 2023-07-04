declare interface Window {
  DiscordNative: {
    app: {
      relaunch(): void;
    };

    clipboard: {
      copy: (content: string) => void;
    };
  };
}
