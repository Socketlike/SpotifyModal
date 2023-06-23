/* eslint-disable no-implicit-coercion, @typescript-eslint/no-floating-promises */
import { common } from 'replugged';
import { config } from '@utils/config';
import { isModalInjected, rootInjection } from '@utils/injection';
import { logger } from '@utils/misc';
import { currentAccount, getAccessTokenFromAccountId, spotifyAPI } from '@utils/spotify';

const { lodash, toast } = common;

export const eventTarget = new EventTarget();

/**
 * dispatches an event through the plugin's "global" `EventTarget`
 * @function dispatchEvent
 * @arg name - event name
 * @arg [detail] - value to supply for `event.detail`
 */
export const dispatchEvent = <DataType>(name: string, detail?: DataType): void =>
  void eventTarget.dispatchEvent(new CustomEvent(name, { detail }));

/**
 * listens for an event through the plugin's "global" `EventTarget`
 * @function listenToEvent
 * @arg name - event name
 * @arg callback - function to execute on event emit
 * @returns {() => void} a function that removes the listener
 */
export const listenToEvent = <DataType>(
  name: string,
  callback: (data: CustomEvent<DataType>) => void,
): (() => void) => {
  eventTarget.addEventListener(name, callback as EventListenerOrEventListenerObject);
  return () =>
    eventTarget.removeEventListener(name, callback as EventListenerOrEventListenerObject);
};

/**
 * listens for an event through an element's event
 * @function listenToElementEvent
 * @arg element
 * @arg name - event name
 * @arg callback - function to execute on event emit
 * @returns {() => void} a function that removes the listener
 */
export const listenToElementEvent = <DataType>(
  element: HTMLElement,
  name: string,
  callback: (data: DataType) => void,
): (() => void) => {
  element.addEventListener(name, callback as EventListenerOrEventListenerObject);
  return () => element.removeEventListener(name, callback as EventListenerOrEventListenerObject);
};

export const shouldPersist = { value: false };

export const removeWSMessageWatcher = listenToEvent<{
  message: Spotify.WSRawParsed;
  socket: PluginWS;
}>('wsMessage', (event): void => {
  const { message, socket } = event.detail;

  if (message.type === 'pong' || !message?.payloads?.[0]?.events?.[0]) return;

  if (!currentAccount.id) {
    currentAccount.id = socket.account.accountId;
    if (config.get('debuggingLogActiveAccountId'))
      logger.log('(debuggingLogActiveAccountId)', 'new account', currentAccount.id);
  }

  if (currentAccount.id !== socket.account.accountId) return;

  const { event: payloadEvent, type } = message.payloads[0].events[0];

  if (type === 'PLAYER_STATE_CHANGED') {
    if (!isModalInjected()) rootInjection.patchPanel();

    dispatchEvent('stateUpdate', payloadEvent.state);

    if (config.get('debuggingLogState'))
      logger.log(
        '(debuggingLogState)',
        'state update for',
        currentAccount.id,
        lodash.clone(payloadEvent.state),
      );
  } else if (type === 'DEVICE_STATE_CHANGED') {
    if (!shouldPersist.value) {
      if (!payloadEvent.devices?.length) {
        logger.log(
          '(debuggingLogActiveAccountId)',
          'current account id is reset since it is no longer active. was',
          currentAccount.id,
        );
        currentAccount.id = '';
      }

      dispatchEvent('shouldShowUpdate', !!payloadEvent.devices.length);
    } else shouldPersist.value = false;
  } else logger.log('unknown websocket event type received', type);
});

export const controlInteractionErrorHandler = async (
  res: Response,
  ...data: unknown[]
): Promise<Response> => {
  if (config.get('automaticReauthentication')) {
    // Deauthorized
    if (res.status === 401) {
      logger.log('access token deauthorized. attempting reauthentication');

      const newToken = await spotifyAPI.refreshSpotifyAccessToken(currentAccount.id, true);

      if (!newToken.ok)
        toast.toast(
          'An error occurred whilst reauthenticating. Check console for details.',
          toast.Kind.FAILURE,
        );
      else {
        logger.log('retrying action');

        const actionRes = (await spotifyAPI.getActionFromResponse(res)(
          getAccessTokenFromAccountId(currentAccount.id),
          ...data,
        )) as Response;

        if (!actionRes.ok) {
          logger.error('action failed, status', actionRes.status, actionRes);
          toast.toast('Action failed. Check console for details.', toast.Kind.FAILURE);
        }
      }
    }
  } else if (res.status === 401)
    toast.toast('Access token deauthenticated. Please manually update your state.');

  shouldPersist.value = false;
  return res;
};

export const removeControlInteractionListener = listenToEvent<Events.AllControlInteractions>(
  'controlInteraction',
  (ev): void => {
    if (!currentAccount.id) {
      toast.toast('Spotify is inactive', toast.Kind.FAILURE);
      return;
    }

    shouldPersist.value = true;

    switch (ev.detail.type) {
      case 'shuffle': {
        const { currentState } = ev.detail;

        spotifyAPI
          .setShuffleState(getAccessTokenFromAccountId(currentAccount.id), !currentState)
          .then(
            (res: Response): Promise<Response> =>
              controlInteractionErrorHandler(res, !currentState),
          );

        break;
      }
      case 'skipPrev': {
        if (
          ev.detail.currentProgress >=
          ev.detail.currentDuration * config.get('skipPreviousProgressResetThreshold')
        )
          spotifyAPI
            .seekToPosition(getAccessTokenFromAccountId(currentAccount.id), 0)
            .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res, 0));
        else
          spotifyAPI
            .skipNextOrPrevious(getAccessTokenFromAccountId(currentAccount.id), false)
            .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res, false));
        break;
      }
      case 'playPause': {
        const { currentState } = ev.detail;

        spotifyAPI
          .setPlaybackState(getAccessTokenFromAccountId(currentAccount.id), !currentState)
          .then(
            (res: Response): Promise<Response> =>
              controlInteractionErrorHandler(res, !currentState),
          );
        break;
      }
      case 'skipNext': {
        spotifyAPI
          .skipNextOrPrevious(getAccessTokenFromAccountId(currentAccount.id))
          .then((res: Response): Promise<Response> => controlInteractionErrorHandler(res));
        break;
      }
      case 'repeat': {
        const nextState = ((): 'off' | 'context' | 'track' => {
          if (ev.detail.currentState === 'off') return 'context';
          else if (ev.detail.currentState === 'context') return 'track';

          return 'off';
        })();

        if (typeof ev.detail.currentState === 'string')
          spotifyAPI
            .setRepeatState(getAccessTokenFromAccountId(currentAccount.id), nextState)
            .then(
              (res: Response): Promise<Response> => controlInteractionErrorHandler(res, nextState),
            );

        break;
      }
      case 'seek': {
        const { newProgress } = ev.detail;

        spotifyAPI
          .seekToPosition(getAccessTokenFromAccountId(currentAccount.id), newProgress)
          .then(
            (res: Response): Promise<Response> => controlInteractionErrorHandler(res, newProgress),
          );

        break;
      }
      default: {
        shouldPersist.value = false;
        break;
      }
    }
  },
);
