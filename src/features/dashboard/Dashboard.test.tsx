import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { editorialTools } from '../../domain/editorial-tools';

afterEach(cleanup);

describe('Dashboard', () => {
  it('muestra exactamente los tres productos actuales', () => {
    render(<Dashboard />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Elegí el producto que vas a editar',
    );
    for (const product of editorialTools) {
      const link = screen.getByRole('link', { name: product.accessibleLabel });
      expect(link.getAttribute('href')).toBe(product.href);
      expect(link.querySelector('img')?.getAttribute('src')).toBe(product.logoPath);
    }
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('mantiene la descripción y las etiquetas accesibles de cada generador', () => {
    render(<Dashboard />);
    for (const product of editorialTools) {
      const link = screen.getByRole('link', { name: product.accessibleLabel });
      expect(link.textContent).toContain(product.title);
      expect(link.textContent).toContain(product.description);
      expect(link.querySelector('img')?.getAttribute('alt')).toBe(product.logoAlt);
    }
  });
});
