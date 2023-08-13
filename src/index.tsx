import { common, components as repluggedComponents } from 'replugged';
import { config } from '@config';
import { Modal } from '@components';
import { events } from '@util';
import { SpotifyAccount, SpotifySocketData } from '@typings';
import * as util from '@util';
import * as components from '@components';
import './style.css';

const { React, modal } = common;
const { Button } = repluggedComponents;

export const renderModal = (): JSX.Element => (
  <div id='spotify-modal-root'>
    <Modal />
  </div>
);

export const emitMessage = (msg: MessageEvent<string>, account: SpotifyAccount): void => {
  const raw = JSON.parse(msg.data) as SpotifySocketData;

  if (raw.type === 'message' && raw.payloads?.[0]?.events?.[0])
    events.emit('message', { accountId: account.accountId, data: raw.payloads[0].events[0] });
};

const postConnectionListener = (): void => {
  common.fluxDispatcher.unsubscribe('POST_CONNECTION_OPEN', postConnectionListener);

  events.debug('start', ['waited for post connection ready']);
  events.emit('ready');
};

export const start = (): void => {
  if (!document.getElementById('spotify-modal-root'))
    common.fluxDispatcher.subscribe('POST_CONNECTION_OPEN', postConnectionListener);
};

export const stop = async (): Promise<void> => {
  const res =
    config.get('pluginStopBehavior') === 'ask'
      ? await modal.confirm({
          title: 'Restart Discord',
          body: 'It is recommended that you restart Discord after reloading / disabling SpotifyModal. Restart now? (Control this behavior in Settings)',
          confirmText: 'Yes',
          cancelText: 'No',
          confirmColor: Button.Colors.RED,
        })
      : config.get('pluginStopBehavior') === 'restartDiscord';

  events.debug('stop', ['restart Discord:', res]);

  if (res) window.DiscordNative.app.relaunch();
};

export { Settings } from '@components';

export const _ = Object.freeze({
  components,
  config,
  util,
});
