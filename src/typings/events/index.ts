export * from './controlInteractions';
export * from './settingsUpdates';

export interface DebugEvent {
  tag: string;
  message: unknown | unknown[];
}
