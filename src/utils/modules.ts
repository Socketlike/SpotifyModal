import { types, webpack } from 'replugged';

export let store = (await webpack.waitForModule(
  webpack.filters.byProps('getActiveSocketAndDevice'),
)) as unknown as SpotifyStore.Store;

export let discordAnalytics = await webpack.waitForModule<{
  default: { track: (name: string) => unknown };
}>(webpack.filters.byProps('track', 'isThrottled'));

export let autoPauseModule = {} as { raw: Record<string, types.AnyFunction>; key: string };

autoPauseModule.raw = await webpack.waitForModule<Record<string, types.AnyFunction>>(
  webpack.filters.bySource(/\.PLAYER_PAUSE/),
);
autoPauseModule.key = webpack.getFunctionKeyBySource(autoPauseModule.raw, /\.PLAYER_PAUSE/);

export const getStore = async (): Promise<SpotifyStore.Store> => {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps('getActiveSocketAndDevice'),
    )) as unknown as SpotifyStore.Store;
  return store;
};

export const getDiscordAnalytics = async (): Promise<{
  default: { track: (name: string) => unknown };
}> => {
  if (!discordAnalytics)
    discordAnalytics = await webpack.waitForModule<{
      default: { track: (name: string) => unknown };
    }>(webpack.filters.byProps('track', 'isThrottled'));
  return discordAnalytics;
};

export const getAutoPauseModule = async (): Promise<{
  raw: Record<string, types.AnyFunction>;
  key: string;
}> => {
  if (!autoPauseModule.raw || !autoPauseModule.key) {
    autoPauseModule.raw = await webpack.waitForModule<Record<string, types.AnyFunction>>(
      webpack.filters.bySource(/\.PLAYER_PAUSE/),
    );
    autoPauseModule.key = webpack.getFunctionKeyBySource(autoPauseModule.raw, /\.PLAYER_PAUSE/);
  }

  return autoPauseModule;
};

export const getAllSpotifyAccounts = async (): Promise<Record<string, SpotifyStore.Socket>> => {
  if (!store)
    store = (await webpack.waitForModule(
      webpack.filters.byProps('getActiveSocketAndDevice'),
    )) as unknown as SpotifyStore.Store;
  return store.__getLocalVars().accounts;
};
