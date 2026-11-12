import { describe, expect, it } from 'vitest';
import {
  COVER_HEADLINE, COVER_STRAP, INTERNAL_HEADLINE,
  createCoverContent, createClearedPage, createDefaultPage, snapshotEditorialPage,
} from './document-model';

describe('modelo de documento Crónica', () => {
  it('conserva los valores originales de portada y de página interior', () => {
    const cover = createDefaultPage('cover');
    expect(cover).toMatchObject({
      headline: COVER_HEADLINE, strapText: COVER_STRAP, showStrap: true, size: '64',
      alignment: 'center', logo: 'primary', zoom: 1, offsetX: 0, offsetY: 0,
      image: null, variant: 'cover', forceUppercase: false,
    });
    const interior = createDefaultPage('internal');
    expect(interior).toMatchObject({
      headline: INTERNAL_HEADLINE, strapText: '', showStrap: false, size: '52',
      alignment: 'left', logo: 'primary', zoom: 1, offsetX: 0, offsetY: 0,
      image: null, variant: 'internal', forceUppercase: false,
    });
    expect(createCoverContent()).toEqual({
      headline: COVER_HEADLINE, strapText: COVER_STRAP, showStrap: true, size: '64',
    });
  });

  it('la variante Sin diseño es neutra y mantiene el contrato de página', () => {
    const blank = createDefaultPage('blank');
    expect(blank).toMatchObject({ variant: 'blank', image: null, showStrap: false, logo: 'primary' });
    expect(blank.headline).toBe(INTERNAL_HEADLINE);
  });

  it('no comparte objetos entre páginas y respeta el origen de Limpiar', () => {
    const one = createDefaultPage('internal'), two = createDefaultPage('internal');
    one.headline = 'Modificado';
    expect(two.headline).toBe(INTERNAL_HEADLINE);
    expect(createClearedPage(0, 'internal')).toMatchObject({
      headline: COVER_HEADLINE, strapText: COVER_STRAP,
      alignment: 'center', variant: 'internal',
    });
    expect(createClearedPage(3, 'cover')).toMatchObject({
      headline: INTERNAL_HEADLINE, alignment: 'left', variant: 'cover',
    });
  });

  it('preserva referencias a fotografías y offsets exactos en el snapshot', () => {
    const image = document.createElement('img');
    const current = createDefaultPage('internal');
    const snapshot = snapshotEditorialPage(
      { headline: 'Actual', strapText: 'VOLANTA', showStrap: true, size: '61' },
      {
        alignment: 'left', forceUppercase: true, logo: 'secondary', image,
        photoName: 'nota-principal.png', zoom: 1.35, offsetX: -45.25, offsetY: 72.5, variant: 'internal',
      },
    );
    expect(snapshot.image).toBe(image);
    expect(snapshot.zoom).toBe(1.35);
    expect(snapshot.offsetX).toBe(-45.25);
    expect(snapshot.headline).toBe('Actual');
    expect(current.image).toBeNull();
  });
});
