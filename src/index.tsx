import { common } from 'replugged';
import { Modal } from '@components';
import { events } from '@util';
import { SpotifyAccount, SpotifySocketData } from '@typings';
import './style.css';

const { React } = common;

export const initialized: string[] = [];

export const renderModal = (): JSX.Element => (
  <div id='spotify-modal-root'>
    <Modal />
  </div>
);

export const emitMessage = (msg: MessageEvent<string>, account: SpotifyAccount): void => {
  const raw = JSON.parse(msg.data) as SpotifySocketData;

  if (raw.type === 'message' && raw.payloads?.[0])
    events.emit('message', { accountId: account.accountId, data: raw.payloads[0].events[0] });
};

export const postConnectionListener = (): void => {
  common.fluxDispatcher.unsubscribe('POST_CONNECTION_OPEN', postConnectionListener);
  events.emit('ready');
};

export const start = (): void => {
  if (!document.querySelector('#spotify-modal-root'))
    common.fluxDispatcher.subscribe('POST_CONNECTION_OPEN', postConnectionListener);
};

export * as util from '@util';
export { events } from '@util';
export { config } from '@config';
export { Settings } from '@components';
