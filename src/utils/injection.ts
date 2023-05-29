/* eslint-disable no-implicit-coercion, @typescript-eslint/no-dynamic-delete */
import { Injector, util } from 'replugged';
import { config } from '@utils/config';
import { dispatchEvent } from '@utils/events';
import { logWithTag, logger } from '@utils/misc';
import {
  autoPauseModule,
  discordAnalytics,
  getAutoPauseModule,
  getDiscordAnalytics,
  getStore,
  store,
} from '@utils/modules';
import { root } from '@utils/react';
import { accounts, allAccounts } from '@utils/spotify';

export const injector = new Injector();

export const getPanelContainer = (): HTMLDivElement =>
  document.body.querySelector('[class^=panels-] > [class^=container-]');

export const getPanel = (): HTMLTableSectionElement =>
  document.body.querySelector('[class^=panels-]');

export const panelExists = (): boolean => !!getPanelContainer();

export const isModalInjected = (): boolean => !!document.getElementById('spotify-modal-root');

const logModalInjection = logWithTag('(debuggingLogModalInjection)');

const addRoot = (): void => {
  if (!isModalInjected()) {
    const panelContainer = getPanelContainer();

    if (!panelContainer) logModalInjection(logger.warn, 'panel container not found!');
    else {
      panelContainer.insertAdjacentElement('beforebegin', root.element);
      logModalInjection(logger.log, 'modal root added');
    }
  } else logModalInjection(logger.log, 'modal root already added');
};

const removeRoot = (): void => {
  if (isModalInjected()) {
    const panel = getPanel();

    if (!panel) logModalInjection(logger.error, 'panel not found!');
    else {
      panel.removeChild(root.element);
      logModalInjection(logger.log, 'modal root removed');
    }
  } else logModalInjection(logger.log, 'modal root already removed');
};

const patchPanel = (): void => {
  if (!isModalInjected()) {
    const panel = getPanel();

    if (!panel) logModalInjection(logger.error, 'panel not found!');
    else {
      const panelOwnerFiber = util.getOwnerInstance(getPanel());

      if (!panelOwnerFiber)
        logModalInjection(logger.error, "unable to get panel owner's react fiber");
      else {
        injector.after(Object.getPrototypeOf(panelOwnerFiber), 'render', (_, res) => {
          if (!isModalInjected()) addRoot();
          return res;
        });

        panelOwnerFiber.forceUpdate();

        logModalInjection(logger.log, "panel owner's react fiber patched");
      }
    }
  } else
    logModalInjection(logger.log, 'modal root already added, assuming panel render is patched');
};

export const rootInjection = {
  addRoot,
  removeRoot,
  patchPanel,
};

export const wsMessageForwarder = (message: MessageEvent, socket: SpotifyModal.PluginWS) =>
  dispatchEvent('wsMessage', { message: JSON.parse(message.data) as Spotify.WSRawParsed, socket });

export function listenAccountSocket(account: Spotify.Account): void {
  if (!accounts?.[account.accountId]) {
    accounts[account.accountId] = account;

    Object.defineProperty(account.socket, 'account', {
      value: account,
      configurable: true,
    });

    account.socket.addEventListener('message', (message: MessageEvent) =>
      wsMessageForwarder(message, account.socket),
    );

    if (config.get('debuggingLogAccountInjection'))
      logger.log(
        '(debuggingLogAccountInjection)',
        'added ws listener for',
        account.accountId,
        account,
      );
  }
}

export function ceaseListeningAccountSocket(account: Spotify.Account): void {
  if (accounts?.[account.accountId]) {
    delete accounts[account.accountId];
    delete account.socket.account;

    account.socket.removeEventListener('message', wsMessageForwarder);

    if (config.get('debuggingLogAccountInjection'))
      logger.log(
        '(debuggingLogAccountInjection)',
        'removed ws listener for',
        account.accountId,
        account,
      );
  }
}

export const listenAllAccountSockets = async (): Promise<void> => {
  await getStore();

  if (Object.entries(allAccounts).length) {
    for (const account of Object.values(allAccounts))
      if (account?.socket) listenAccountSocket(account);

    // By this time panel is ready - we patch it
    rootInjection.patchPanel();
  }
};

export const ceaseListeningAllAccountSockets = (): void => {
  for (const account of Object.values(accounts)) ceaseListeningAccountSocket(account);
};

export const patchStoreLogger = async (): Promise<void> => {
  await getStore();

  injector.instead(
    store.__getLocalVars().logger,
    'info',
    (args: unknown[], orig: (...data: unknown[]) => void): void => {
      if (
        args[0] === 'WS Connected' ||
        (typeof args[0] === 'string' && args[0].match(/^Added account: .*/))
      )
        for (const account of Object.values(allAccounts)) {
          if (account?.socket) listenAccountSocket(account);
        }
      else if (
        typeof args[0] === 'string' &&
        args[0].match(/auto paused/i) &&
        config.get('noSpotifyPause')
      ) {
        if (config.get('debuggingLogNoSpotifyPause'))
          logger.log('(debuggingLogNoSpotifyPause)', 'auto Spotify pause stopped');
        return;
      }

      return orig(...args);
    },
  );
};

export const patchDiscordAnalytics = async (): Promise<void> => {
  await getDiscordAnalytics();

  injector.instead(
    discordAnalytics.default,
    'track',
    (args: [string], orig: (name: string) => void): void => {
      if (
        typeof args[0] === 'string' &&
        args[0].match(/spotify_auto_paused/i) &&
        config.get('noSpotifyPause')
      )
        return;

      return orig(...args);
    },
  );
};

export const patchSpotifyAutoPause = async (): Promise<void> => {
  await getStore();
  await getAutoPauseModule();

  injector.instead(autoPauseModule.raw, autoPauseModule.key, (args, orig) => {
    if (config.get('noSpotifyPause')) return Promise.resolve(null);

    return orig(...args);
  });

  injector.instead(store, 'wasAutoPaused', (args, orig) => {
    if (config.get('noSpotifyPause')) return false;

    return orig(...args);
  });
};
