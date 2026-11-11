import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { CollapsiblePanel } from './CollapsiblePanel';

afterEach(cleanup);

describe('Paneles plegables de Crónica', () => {
  it('expone estado y controles accesibles sin desmontar contenido', () => {
    function DraftField() {
      const [value, setValue] = useState('Titular inicial');
      return <input aria-label="Titular" value={value} onChange={(event) => setValue(event.target.value)} />;
    }

    const { container } = render(
      <CollapsiblePanel title="Textos">
        <DraftField />
      </CollapsiblePanel>,
    );
    const toggle = screen.getByRole('button', { name: 'Textos' });
    const field = screen.getByRole('textbox', { name: 'Titular' }) as HTMLInputElement;
    const body = container.querySelector('.modern-body');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe(body?.id);
    fireEvent.change(field, { target: { value: 'Texto guardado' } });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(body?.hasAttribute('hidden')).toBe(true);
    expect(field.isConnected).toBe(true);
    fireEvent.click(toggle);
    expect(body?.hasAttribute('hidden')).toBe(false);
    expect(field.value).toBe('Texto guardado');
  });
});
