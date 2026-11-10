import { isContentSnapshot, type ContentCommand, type ContentSnapshot } from './content-model';

const STATE = 'editorial:cronica:content-state';
const COMMAND = 'editorial:cronica:content-command';
const REQUEST = 'editorial:cronica:content-request';

export function issueContentCommand(command: ContentCommand): void {
  window.dispatchEvent(new CustomEvent(COMMAND, { detail: command }));
}

export function subscribeToContent(listener: (value: ContentSnapshot) => void): () => void {
  const onState = (event: Event): void => {
    if (!(event instanceof CustomEvent) || !isContentSnapshot(event.detail)) return;
    listener(event.detail);
  };
  window.addEventListener(STATE, onState);
  // El editor Canvas puede inicializarse antes de montar React.
  window.dispatchEvent(new Event(REQUEST));
  return () => window.removeEventListener(STATE, onState);
}
