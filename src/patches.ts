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
      {
        match:
          /([^;]{1,3})\.hasConnectedAccount=function\(\)\{.{0,50}return Object\.keys\((.{1,3})\)/,
        replace: '$1.spotifyModalAccounts=$2;$&',
      },
    ],
  },
];

export default patches;
