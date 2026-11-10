import type { CarouselCommand, CarouselSnapshot } from './carousel-model';
import { isCarouselSnapshot } from './carousel-model';

const STATE = 'editorial:cronica:state';
const COMMAND = 'editorial:cronica:command';
const REQUEST = 'editorial:cronica:request-state';

export function issueCarouselCommand(command: CarouselCommand): void {
  window.dispatchEvent(new CustomEvent(COMMAND, { detail: command }));
}

export function subscribeToCarouselState(listener: (state: CarouselSnapshot) => void): () => void {
  const onState = (event: Event): void => {
    if (!(event instanceof CustomEvent) || !isCarouselSnapshot(event.detail)) return;
    listener(event.detail);
  };
  window.addEventListener(STATE, onState);
  // No importa si la carga del script heredado terminó antes o después de React.
  window.dispatchEvent(new Event(REQUEST));
  return () => window.removeEventListener(STATE, onState);
}
