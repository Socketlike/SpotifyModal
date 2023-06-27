import { SpotifyAccount, SpotifySocketData } from '@typings';

export class EventEmitter extends EventTarget {
  public on<T>(event: string, listener: (event: CustomEvent<T>) => void): () => void {
    this.addEventListener(event, listener as EventListener);

    return () => this.removeEventListener(event, listener as EventListener);
  }

  public emit<T>(event: string, data?: T): void {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

export const events = new EventEmitter();

const webSocketListener = (ev: MessageEvent<string>): void => {
  const raw = JSON.parse(ev.data) as SpotifySocketData;

  if (raw.type === 'message' && raw.payloads?.[0])
    events.emit('message', {
      accountId: (ev.target as SpotifyAccount['socket']).account.accountId,
      data: raw.payloads[0].events[0],
    });
};

export const addWebSocketListener = (account: SpotifyAccount): void =>
  account.socket.addEventListener('message', webSocketListener);

export const removeWebSocketListener = (account: SpotifyAccount): void =>
  account.socket.removeEventListener('message', webSocketListener);
