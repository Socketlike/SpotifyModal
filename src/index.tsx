import { common, components } from 'replugged';
import { config } from '@config';
import { Modal } from '@components';
import { events } from '@util';
import { SpotifyAccount, SpotifySocketData } from '@typings';
import './style.css';

const { React, modal } = common;
const { Button } = components;

export const initialized: string[] = [];

export const renderModal = (): JSX.Element => (
  <div id='spotify-modal-root'>
    <Modal />
  </div>
);

export const emitMessage = (msg: MessageEvent<string>, account: SpotifyAccount): void => {
  if (config.get('disabled')) return;

  const raw = JSON.parse(msg.data) as SpotifySocketData;

  if (raw.type === 'message' && raw.payloads?.[0]?.events?.[0])
    events.emit('message', { accountId: account.accountId, data: raw.payloads[0].events[0] });
};

export const postConnectionListener = (): void => {
  common.fluxDispatcher.unsubscribe('POST_CONNECTION_OPEN', postConnectionListener);

  events.emit('ready');
  events.debug('start', ['awaited post connection ready']);
};

export const start = (): void => {
  if (!document.querySelector('#spotify-modal-root'))
    common.fluxDispatcher.subscribe('POST_CONNECTION_OPEN', postConnectionListener);
};

export const stop = async (): Promise<void> => {
  const res =
    config.get('pluginStopBehavior') === 'ask'
      ? await modal.confirm({
          title: 'Restart Discord',
          body: 'It is recommended that you restart Discord after reloading / disabling SpotifyModal. Restart now?',
          confirmText: 'Yes',
          cancelText: 'No',
          confirmColor: Button.Colors.RED,
        })
      : config.get('pluginStopBehavior') === 'restartDiscord';

  events.emit('debug', { type: 'stop', message: ['restart Discord:', res] });

  if (res) window.DiscordNative.app.relaunch();
};

export * as util from '@util';
export * as components from '@components';
export { events } from '@util';
export { config } from '@config';
export { Settings } from '@components';
