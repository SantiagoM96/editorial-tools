import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CarouselControls } from './CarouselControls';
import { currentPageLabel, initialCarousel, isCarouselSnapshot } from './carousel-model';

afterEach(cleanup);

describe('Contrato del carrusel de Crónica', () => {
  it('rechaza snapshots incoherentes o sin páginas', () => {
    expect(isCarouselSnapshot({ pages: [], activePage: 0, variant: 'cover' })).toBe(false);
    expect(isCarouselSnapshot({ pages: ['cover'], activePage: 1, variant: 'cover' })).toBe(false);
    expect(isCarouselSnapshot({ pages: ['cover'], activePage: 0, variant: 'internal' })).toBe(false);
    expect(isCarouselSnapshot({ pages: ['cover'], activePage: 0, variant: 'cover' })).toBe(true);
    expect(currentPageLabel(initialCarousel)).toBe('1 de 1 · Portada');
    expect(isCarouselSnapshot({ pages: ['blank'], activePage: 0, variant: 'blank' })).toBe(true);
    expect(currentPageLabel({ pages: ['blank'], activePage: 0, variant: 'blank' })).toBe('1 de 1 · Sin diseño');
  });

  it('emite comandos tipados y presenta el estado de página recibido', () => {
    const sent: unknown[] = [];
    const onCommand = (event: Event) => {
      if (event instanceof CustomEvent) sent.push(event.detail);
    };
    window.addEventListener('editorial:cronica:command', onCommand);
    try {
      render(<CarouselControls />);
      expect(screen.getByRole('status').textContent).toBe('1 de 1 · Portada');
      expect(screen.getByRole('button', { name: 'Eliminar página seleccionada' })).toHaveProperty('disabled', true);
      fireEvent.click(screen.getByRole('button', { name: 'Agregar página interna' }));
      expect(sent.at(-1)).toEqual({ type: 'add-page' });

      fireEvent(window, new CustomEvent('editorial:cronica:state', {
        detail: { pages: ['cover', 'internal'], activePage: 1, variant: 'internal' },
      }));
      expect(screen.getByRole('status').textContent).toBe('2 de 2 · Interior');
      expect(screen.getByRole('button', { name: 'Página 2, interior' }).getAttribute('aria-current')).toBe('page');
      fireEvent.click(screen.getByRole('button', { name: 'Página 1, portada' }));
      expect(sent.at(-1)).toEqual({ type: 'select-page', index: 0 });
      fireEvent.click(screen.getByRole('button', { name: 'Portada' }));
      expect(sent.at(-1)).toEqual({ type: 'set-variant', variant: 'cover' });
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar página seleccionada' }));
      expect(sent.at(-1)).toEqual({ type: 'remove-page' });
    } finally {
      window.removeEventListener('editorial:cronica:command', onCommand);
    }
  });
});
