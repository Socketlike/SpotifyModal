export class EventEmitter extends EventTarget {
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
}

export const events = new EventEmitter();
