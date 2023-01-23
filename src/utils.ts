/* eslint-disable
  @typescript-eslint/no-floating-promises,
  @typescript-eslint/require-await
*/

import { Logger, common, webpack } from 'replugged';
import { SpotifyAPI, SpotifySocketFunctions } from './common';
import {
  SpotifyDevice,
  SpotifySocket,
  SpotifyWebSocketDevices,
  SpotifyWebSocketRawMessage,
  SpotifyWebSocketRawParsedMessage,
  SpotifyWebSocketState,
} from './types';
import { components } from './components';

declare const DiscordNative: {
  clipboard: {
    copy: (content: string) => void;
  };
};
