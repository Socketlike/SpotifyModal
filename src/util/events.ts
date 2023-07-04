import { DebugEvent } from '@typings';
import { logger } from '@util';
import { config } from '@config';

export class EventEmitter extends EventTarget {
  public constructor() {
    super();

    this.on<DebugEvent>('debug', (event): void => {
      if (!config.get('debugging')) return;

      let message = [event.detail.message].flat();

      logger.log(`(${event.detail.tag || 'unknown'})`, ...message);
    });
  }

  public on<T>(event: string, listener: (event: CustomEvent<T>) => void): () => void {
    this.addEventListener(event, listener as EventListener);

    return () => this.removeEventListener(event, listener as EventListener);
  }

  public off<T>(event: string, listener: (event: CustomEvent<T>) => void): void {
    this.removeEventListener(event, listener as EventListener);
  }

  public emit<T>(event: string, data?: T): void {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  public debug(tag: string, message: unknown | unknown[]): void {
    this.emit('debug', { tag, message });
  }
}

export const events = new EventEmitter();
