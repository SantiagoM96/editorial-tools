import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ContentEditor } from './ContentEditor';
import { DesignOptions } from './DesignOptions';
import { initialContent, isContentSnapshot } from './content-model';

afterEach(cleanup);

describe('modelo de contenido', () => {
  it('admite estados válidos y rechaza tamaños o volantas inválidas', () => {
    expect(isContentSnapshot(initialContent)).toBe(true);
    expect(isContentSnapshot({ ...initialContent, size: '96' })).toBe(false);
    expect(isContentSnapshot({ ...initialContent, size: '32.1' })).toBe(false);
    expect(isContentSnapshot({ ...initialContent, size: 64 })).toBe(false);
    expect(isContentSnapshot({ ...initialContent, strapText: 'a'.repeat(141) })).toBe(false);
    expect(isContentSnapshot({ ...initialContent, showStrap: 'false' })).toBe(false);
  });
});

describe('campos React de Crónica', () => {
  it('recibe estado del editor y emite comandos sin duplicar el documento', () => {
    const commands: unknown[] = [];
    let current = initialContent;
    const onCommand = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      commands.push(event.detail);
      const update = event.detail as { field: keyof typeof initialContent; value: unknown };
      current = { ...current, [update.field]: update.field === 'size' ? String(update.value) : update.value };
      window.dispatchEvent(new CustomEvent('editorial:cronica:content-state', { detail: current }));
    };
    const onRequest = () =>
      window.dispatchEvent(new CustomEvent('editorial:cronica:content-state', { detail: current }));
    window.addEventListener('editorial:cronica:content-command', onCommand);
    window.addEventListener('editorial:cronica:content-request', onRequest);
    try {
      render(<><DesignOptions variant="cover" /><ContentEditor /></>);
      const headline = screen.getByLabelText('Texto principal') as HTMLTextAreaElement;
      expect(headline.value).toBe(initialContent.headline);

      fireEvent.change(headline, { target: { value: 'Texto de prueba' } });
      expect(commands.at(-1)).toEqual({ field: 'headline', value: 'Texto de prueba' });

      fireEvent.change(screen.getByRole('slider'), { target: { value: '72' } });
      expect(commands.at(-1)).toEqual({ field: 'size', value: 72 });
      expect(screen.getByText('72').textContent).toBe('72');

      fireEvent.click(screen.getByRole('switch', { name: 'Mostrar volanta' }));
      expect(commands.at(-1)).toEqual({ field: 'showStrap', value: false });
      expect(screen.getByLabelText('Texto de la volanta').closest('#strapField')?.hasAttribute('hidden')).toBe(true);
    } finally {
      window.removeEventListener('editorial:cronica:content-command', onCommand);
      window.removeEventListener('editorial:cronica:content-request', onRequest);
    }
  });

  it('aplica formato sobre textarea controlado preservando selección y cursiva', () => {
    let current = { ...initialContent, headline: 'Hola mundo' };
    const onCommand = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const update = event.detail as { field: keyof typeof initialContent; value: string };
      current = { ...current, [update.field]: update.value };
      window.dispatchEvent(new CustomEvent('editorial:cronica:content-state', { detail: current }));
    };
    const onRequest = () =>
      window.dispatchEvent(new CustomEvent('editorial:cronica:content-state', { detail: current }));
    window.addEventListener('editorial:cronica:content-command', onCommand);
    window.addEventListener('editorial:cronica:content-request', onRequest);
    try {
      render(<><DesignOptions variant="cover" /><ContentEditor /></>);
      const textarea = screen.getByLabelText('Texto principal') as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(5, 10);
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar cursiva' }));
      expect(textarea.value).toBe('Hola _mundo_');
      expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([6, 11]);
      fireEvent.click(screen.getByRole('button', { name: 'Quitar formato de la selección' }));
      expect(textarea.value).toBe('Hola mundo');
    } finally {
      window.removeEventListener('editorial:cronica:content-command', onCommand);
      window.removeEventListener('editorial:cronica:content-request', onRequest);
    }
  });

  it('refleja mayúsculas visuales y restaura una página recibida', () => {
    render(<><DesignOptions variant="cover" /><ContentEditor /></>);
    act(() => {
      window.dispatchEvent(new CustomEvent('editorial:cronica:typography-state', {
        detail: { uppercase: true, alignment: 'left' },
      }));
      window.dispatchEvent(new CustomEvent('editorial:cronica:content-state', {
        detail: { headline: 'Otra página', strapText: '', showStrap: false, size: '52' },
      }));
    });
    const headline = screen.getByLabelText('Texto principal') as HTMLTextAreaElement;
    expect(headline.value).toBe('Otra página');
    expect(headline.classList.contains('uppercase-preview')).toBe(true);
    expect(screen.getByRole('slider').getAttribute('value')).toBe('52');
    expect(screen.getByRole('button', { name: 'Alinear a la izquierda' }).getAttribute('aria-pressed')).toBe('true');
  });
});
