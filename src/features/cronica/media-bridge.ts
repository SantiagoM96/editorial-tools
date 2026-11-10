import { isMediaSnapshot, type MediaCommand, type MediaSnapshot } from './media-model';

const REQUEST = 'editorial:cronica:media-request';
const STATE = 'editorial:cronica:media-state';
const COMMAND = 'editorial:cronica:media-command';

export function sendMediaCommand(command: MediaCommand): void {
  window.dispatchEvent(new CustomEvent(COMMAND, { detail: command }));
}

export function subscribeToMedia(listener: (value: MediaSnapshot) => void): () => void {
  const onState = (event: Event): void => {
    if (!(event instanceof CustomEvent) || !isMediaSnapshot(event.detail)) return;
    listener(event.detail);
  };
  window.addEventListener(STATE, onState);
  // La carga de app.js es defer; funciona si Canvas se inicializa antes o después.
  window.dispatchEvent(new Event(REQUEST));
  return () => window.removeEventListener(STATE, onState);
}
