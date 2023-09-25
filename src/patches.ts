import { Logger, types } from 'replugged';

const logger = Logger.plugin('SpotifyModal');

const patches: types.PlaintextPatch[] = [
  {
    /* https://github.com/Vendicated/Vencord/blob/main/src/plugins/spotifyControls/index.tsx#L49-L57 */
    find: 'showTaglessAccountPanel:',
    replacements: [
      {
        match: /return?\s?(.{0,30}\(.{1,3},\{[^}]+?,showTaglessAccountPanel:.+?\}\))/s,
        replace:
          'return [window.replugged.plugins.getExports("lib.evelyn.SpotifyModal")?.renderModal?.(),$1]',
      },
    ],
  },
  {
    find: 'dealer.spotify.com',
    replacements: [
      {
        match: /(\.handleMessage=function\((.{1,3})\)){/,
        replace:
          '$1{window.replugged.plugins.getExports("lib.evelyn.SpotifyModal")?.emitMessage?.($2, this);',
      },
      (source: string): string => {
        const storePrototypeVar = source.match(/([^;]{1,3})\.hasConnectedAccount/)[1];

        if (!storePrototypeVar)
          logger.error(
            "couldn't get variable name for SpotifyStore's prototype. please report this on GitHub.",
          );

        const accountListVar = source.match(
          new RegExp(
            `${storePrototypeVar}\\.hasConnectedAccount=function\\(\\)\\{.{0,30}return Object\\.keys\\((.{1,3})\\)`,
          ),
        )[1];

        if (!accountListVar)
          logger.error(
            "couldn't get variable name for the Spotify account list. please report this on GitHub.",
          );

        return storePrototypeVar && accountListVar
          ? source.replace(
              new RegExp(`${storePrototypeVar}=.{1,3}.prototype;`),
              `$&${storePrototypeVar}.spotifyModalAccounts=${accountListVar};`,
            )
          : source;
      },
    ],
  },
];

export default patches;
