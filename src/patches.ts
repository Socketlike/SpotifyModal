import { types } from 'replugged';

/* https://github.com/Vendicated/Vencord/blob/main/src/plugins/spotifyControls/index.tsx#L49-L57 */
const patches: types.PlaintextPatch[] = [
  {
    find: /showTaglessAccountPanel:/,
    replacements: [
      {
        match: /return ?(.{0,30}\(.{1,3},\{[^}]+?,showTaglessAccountPanel:.+?\}\))/,
        replace:
          'return [window.replugged.plugins.getExports("lib.evelyn.SpotifyModal").renderModal(),$1]',
      },
    ],
  },
];

export default patches;
