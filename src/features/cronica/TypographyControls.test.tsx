import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TypographyControls } from './TypographyControls';
import { editFormattedSelection, initialTypography, isTypographyState } from './typography-model';

afterEach(cleanup);

describe('operaciones puras del editor', () => {
  it('inserta marcas preservando la selección y los fragmentos vecinos', () => {
    expect(editFormattedSelection('Hola mundo', 5, 10, 'accent')).toEqual({
      text: 'Hola *mundo*', start: 6, end: 11,
    });
    expect(editFormattedSelection('Hola mundo', 5, 10, 'italic')).toEqual({
      text: 'Hola _mundo_', start: 6, end: 11,
    });
    expect(editFormattedSelection('Hola mundo', 5, 10, 'strike')).toEqual({
      text: 'Hola ~mundo~', start: 6, end: 11,
    });
  });

  it('quita marcas internas y pares externos, igual que el editor original', () => {
    expect(editFormattedSelection('Hola *mundo*', 6, 11, 'clear')).toEqual({
      text: 'Hola mundo', start: 5, end: 10,
    });
    expect(editFormattedSelection('a *hola* _mundo_', 2, 16, 'clear')).toEqual({
      text: 'a hola mundo', start: 2, end: 12,
    });
    expect(editFormattedSelection('Hola', 0, 0, 'accent')).toBeNull();
    expect(editFormattedSelection('Hola', 0, 6, 'clear')).toBeNull();
  });

  it('valida snapshots de tipografía recibidos del motor heredado', () => {
    expect(isTypographyState({ uppercase: false, alignment: 'center' })).toBe(true);
    expect(isTypographyState({ uppercase: true, alignment: 'left' })).toBe(true);
    expect(isTypographyState({ uppercase: 'yes', alignment: 'left' })).toBe(false);
    expect(isTypographyState({ uppercase: false, alignment: 'justify' })).toBe(false);
  });
});

describe('controles de tipografía React', () => {
  it('delega el formato a ContentEditor en lugar de modificar el DOM por sí mismo', () => {
    const onFormat = vi.fn();
    render(<TypographyControls typography={initialTypography} onFormat={onFormat} />);
    fireEvent.click(screen.getByRole('button', { name: 'Destacar selección' }));
    fireEvent.click(screen.getByRole('button', { name: 'Quitar formato de la selección' }));
    expect(onFormat.mock.calls).toEqual([['accent'], ['clear']]);
  });

  it('representa el estado recibido y despacha comandos de alineación y mayúsculas', () => {
    const commands: unknown[] = [];
    const onCommand = (event: Event) => {
      if (event instanceof CustomEvent) commands.push(event.detail);
    };
    window.addEventListener('editorial:cronica:typography-command', onCommand);
    try {
      render(<TypographyControls typography={{ uppercase: true, alignment: 'left' }} onFormat={() => {}} />);
      expect(screen.getByRole('button', { name: 'Mostrar todo el texto en mayúsculas' }).getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('button', { name: 'Alinear a la izquierda' }).getAttribute('aria-pressed')).toBe('true');
      fireEvent.click(screen.getByRole('button', { name: 'Alinear al centro' }));
      fireEvent.click(screen.getByRole('button', { name: 'Mostrar todo el texto en mayúsculas' }));
      expect(commands).toEqual([
        { type: 'set-alignment', alignment: 'center' },
        { type: 'toggle-uppercase' },
      ]);
    } finally {
      window.removeEventListener('editorial:cronica:typography-command', onCommand);
    }
  });
});
