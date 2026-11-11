import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MediaControls, PhotoZoomControls } from './MediaControls';
import { isBrandLogo, isMediaSnapshot, isZoomPercent, initialMedia } from './media-model';

afterEach(cleanup);

describe('Modelo de medios', () => {
  it('valida logos y rango de zoom original', () => {
    expect(['none', 'primary', 'secondary', 'white'].every(isBrandLogo)).toBe(true);
    expect(isBrandLogo('fake')).toBe(false);
    expect([100, 125, 300].every(isZoomPercent)).toBe(true);
    expect([99, 101, 305, 100.5, '150', Infinity].some(isZoomPercent)).toBe(false);
  });

  it('rechaza snapshots incoherentes del renderizador', () => {
    expect(isMediaSnapshot(initialMedia)).toBe(true);
    expect(isMediaSnapshot({ logo: 'secondary', zoomPercent: 200, hasImage: true })).toBe(true);
    expect(isMediaSnapshot({ logo: 'invalid', zoomPercent: 100, hasImage: false })).toBe(false);
    expect(isMediaSnapshot({ logo: 'primary', zoomPercent: 127, hasImage: false })).toBe(false);
    expect(isMediaSnapshot({ logo: 'primary', zoomPercent: 100, hasImage: 'yes' })).toBe(false);
    expect(isMediaSnapshot({ logo: 'primary', zoomPercent: 100, hasImage: true, photoName: 123 })).toBe(false);
    expect(isMediaSnapshot({ logo: 'primary', zoomPercent: 100, hasImage: true, photoName: 'foto.png' })).toBe(true);
  });
});

describe('Controles React de fotografía y logo', () => {
  it('preserva los cuatro logos y emite un comando de selección tipado', () => {
    const commands: unknown[] = [];
    const onCommand = (event: Event) => {
      if (event instanceof CustomEvent) commands.push(event.detail);
    };
    window.addEventListener('editorial:cronica:media-command', onCommand);
    try {
      render(<MediaControls />);
      expect(screen.getAllByRole('button')).toHaveLength(4);
      expect(screen.getByRole('button', { name: 'Primario' }).getAttribute('aria-pressed')).toBe('true');
      fireEvent.click(screen.getByRole('button', { name: 'Secundario' }));
      expect(commands.at(-1)).toEqual({ type: 'set-logo', logo: 'secondary' });
      fireEvent(window, new CustomEvent('editorial:cronica:media-state', {
        detail: { logo: 'secondary', zoomPercent: 100, hasImage: true },
      }));
      expect(screen.getByRole('button', { name: 'Secundario' }).getAttribute('aria-pressed')).toBe('true');
    } finally {
      window.removeEventListener('editorial:cronica:media-command', onCommand);
    }
  });

  it('envía el archivo File real al controlador sin codificarlo en base64', () => {
    const commands: unknown[] = [];
    const onCommand = (event: Event) => {
      if (event instanceof CustomEvent) commands.push(event.detail);
    };
    window.addEventListener('editorial:cronica:media-command', onCommand);
    try {
      render(<MediaControls />);
      const file = new File(['fixture'], 'foto.png', { type: 'image/png' });
      fireEvent.change(screen.getByLabelText('Fotografía'), { target: { files: [file] } });
      expect(commands.at(-1)).toEqual({ type: 'upload-photo', file });
    } finally {
      window.removeEventListener('editorial:cronica:media-command', onCommand);
    }
  });

  it('muestra el archivo confirmado por Canvas y lo restablece al limpiar la página', () => {
    render(<MediaControls />);
    expect(screen.getByText('Seleccioná')).toBeTruthy();
    expect(screen.getByText('una fotografía')).toBeTruthy();
    fireEvent(window, new CustomEvent('editorial:cronica:media-state', {
      detail: { logo: 'primary', zoomPercent: 100, hasImage: true, photoName: 'portada.png' },
    }));
    expect(screen.getByText('Cambiar')).toBeTruthy();
    expect(screen.getByText('portada.png')).toBeTruthy();
    fireEvent(window, new CustomEvent('editorial:cronica:media-state', {
      detail: { logo: 'primary', zoomPercent: 100, hasImage: false, photoName: null },
    }));
    expect(screen.getByText('Seleccioná')).toBeTruthy();
    expect(screen.getByText('una fotografía')).toBeTruthy();
  });

  it('sincroniza zoom y su etiqueta a partir del estado del Canvas', () => {
    const commands: unknown[] = [];
    const onCommand = (event: Event) => {
      if (event instanceof CustomEvent) commands.push(event.detail);
    };
    window.addEventListener('editorial:cronica:media-command', onCommand);
    try {
      render(<PhotoZoomControls />);
      const slider = screen.getByRole('slider');
      expect(slider.getAttribute('value')).toBe('100');
      fireEvent.change(slider, { target: { value: '175' } });
      expect(commands.at(-1)).toEqual({ type: 'set-zoom', percent: 175 });
      fireEvent(window, new CustomEvent('editorial:cronica:media-state', {
        detail: { logo: 'primary', zoomPercent: 175, hasImage: true },
      }));
      expect(slider.getAttribute('value')).toBe('175');
      expect(screen.getByText('175 %')).toBeTruthy();
    } finally {
      window.removeEventListener('editorial:cronica:media-command', onCommand);
    }
  });
});
