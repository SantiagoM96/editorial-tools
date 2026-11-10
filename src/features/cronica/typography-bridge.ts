import { isTypographyState, type TypographyAlignment, type TypographyState } from './typography-model';

const REQUEST = 'editorial:cronica:typography-request';
const STATE = 'editorial:cronica:typography-state';
const COMMAND = 'editorial:cronica:typography-command';

export function subscribeToTypography(listener: (value: TypographyState) => void): () => void {
  const onState = (event: Event): void => {
    if (!(event instanceof CustomEvent) || !isTypographyState(event.detail)) return;
    listener(event.detail);
  };
  window.addEventListener(STATE, onState);
  window.dispatchEvent(new Event(REQUEST));
  return () => window.removeEventListener(STATE, onState);
}

export function toggleUppercase(): void {
  window.dispatchEvent(new CustomEvent(COMMAND, { detail: { type: 'toggle-uppercase' } }));
}

export function setAlignment(alignment: TypographyAlignment): void {
  window.dispatchEvent(new CustomEvent(COMMAND, {
    detail: { type: 'set-alignment', alignment },
  }));
}
