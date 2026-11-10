import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TypographyControls } from './TypographyControls';
import { editFormattedSelection, isTypographyState } from './typography-model';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

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
    expect(editFormattedSelection('a *hola* _mundo_', 3, 15, 'clear')).toEqual({
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
  it('aplica marcas al texto real y emite input para redibujar Canvas', () => {
    const area = document.createElement('textarea');
    area.id = 'headline';
    area.value = 'Texto editable';
    document.body.append(area);
    let inputs = 0;
    area.addEventListener('input', () => inputs++);
    render(<TypographyControls />);
    area.setSelectionRange(6, 14);
    fireEvent.click(screen.getByRole('button', { name: 'Destacar selección' }));
    expect(area.value).toBe('Texto *editable*');
    expect([area.selectionStart, area.selectionEnd]).toEqual([7, 15]);
    expect(inputs).toBe(1);
  });

  it('recibe actualizaciones y despacha comandos de alineación y mayúsculas', () => {
    const events: unknown[] = [];
    const onCommand = (event: Event) => {
      if (event instanceof CustomEvent) events.push(event.detail);
    };
    window.addEventListener('editorial:cronica:typography-command', onCommand);
    try {
      render(<TypographyControls />);
      fireEvent(window, new CustomEvent('editorial:cronica:typography-state', {
        detail: { uppercase: true, alignment: 'left' },
      }));
      expect(screen.getByRole('button', { name: 'Mostrar todo el texto en mayúsculas' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Alinear a la izquierda' })).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(screen.getByRole('button', { name: 'Alinear al centro' }));
      fireEvent.click(screen.getByRole('button', { name: 'Mostrar todo el texto en mayúsculas' }));
      expect(events).toEqual([
        { type: 'set-alignment', alignment: 'center' },
        { type: 'toggle-uppercase' },
      ]);
    } finally {
      window.removeEventListener('editorial:cronica:typography-command', onCommand);
    }
  });
});
