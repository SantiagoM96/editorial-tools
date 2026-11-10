import { describe, expect, it } from 'vitest';
import { createDefaultPage } from './document-model';
import { EditorialCarouselStore } from './carousel-store';

describe('Estado canónico del carrusel Crónica', () => {
  it('inicia con portada y conserva la identidad de fotografía en el snapshot', () => {
    const first = createDefaultPage('cover');
    const image = document.createElement('img');
    first.image = image;
    const store = new EditorialCarouselStore(first);
    expect(store.activeIndex).toBe(0);
    expect(store.pageCount).toBe(1);
    expect(store.snapshot).toEqual({ pages: ['cover'], activePage: 0, variant: 'cover' });
    expect(store.activePage.image).toBe(image);
    expect(store.getPage(5)).toBeNull();
  });

  it('inserta página a continuación y conserva la edición por página', () => {
    const store = new EditorialCarouselStore(createDefaultPage('cover'));
    const first = { ...store.activePage, headline: 'Portada independiente' };
    store.insertAfterActive(first);
    expect(store.activeIndex).toBe(1);
    expect(store.activePage.variant).toBe('internal');
    store.insertAfterActive({ ...store.activePage, headline: 'Segunda' });
    expect(store.pageCount).toBe(3);
    expect(store.activeIndex).toBe(2);
    expect(store.select(0, { ...store.activePage, headline: 'Tercera' })?.headline).toBe('Portada independiente');
    expect(store.getPage(1)?.headline).toBe('Segunda');
    expect(store.getPage(2)?.headline).toBe('Tercera');
  });

  it('rechaza índices inválidos y no elimina la portada', () => {
    const store = new EditorialCarouselStore(createDefaultPage('cover'));
    expect(store.select(-1, store.activePage)).toBeNull();
    expect(store.select(1, store.activePage)).toBeNull();
    expect(store.select(NaN, store.activePage)).toBeNull();
    expect(store.removeActive()).toBeNull();
    expect(store.pageCount).toBe(1);
    expect(() => store.visitForExport(2)).toThrow(RangeError);
    expect(store.activeIndex).toBe(0);
  });

  it('quita una página intermedia y selecciona la siguiente sin copiar su imagen', () => {
    const store = new EditorialCarouselStore(createDefaultPage('cover'));
    store.insertAfterActive(store.activePage);
    const secondImage = document.createElement('img');
    store.insertAfterActive({ ...store.activePage, headline: 'Segunda', image: secondImage });
    store.select(1, { ...store.activePage, headline: 'Tercera' });
    expect(store.removeActive()?.headline).toBe('Tercera');
    expect(store.activeIndex).toBe(1);
    expect(store.pageCount).toBe(2);
  });

  it('cambia variante, preserva la edición y permite visitar y restaurar tras exportar', () => {
    const store = new EditorialCarouselStore(createDefaultPage('cover'));
    store.insertAfterActive(store.activePage);
    const edited = { ...store.activePage, headline: 'Interior modificado' };
    expect(store.setActiveVariant('cover', edited)).toBe(true);
    expect(store.snapshot).toEqual({ pages: ['cover', 'cover'], activePage: 1, variant: 'cover' });
    expect(store.setActiveVariant('cover', edited)).toBe(false);
    store.visitForExport(0);
    expect(store.activePage.variant).toBe('cover');
    store.visitForExport(1);
    expect(store.activePage.headline).toBe('Interior modificado');
    expect(store.activeIndex).toBe(1);
  });
});

describe('identidad estable de páginas durante cargas asíncronas', () => {
  it('mantiene la identidad aunque se guarde un nuevo objeto y cambie el índice', () => {
    const carousel = new EditorialCarouselStore(createDefaultPage('cover'));
    const coverId = carousel.activePageId;
    carousel.insertAfterActive(carousel.activePage);
    const secondId = carousel.activePageId;
    const photo = document.createElement('img');
    carousel.saveActive({ ...carousel.activePage, headline: 'Edición', image: photo });
    expect(carousel.activePageId).toBe(secondId);
    expect(carousel.getPageById(secondId)?.image).toBe(photo);
    carousel.insertAfterActive(carousel.activePage);
    const thirdId = carousel.activePageId;
    expect(new Set([coverId, secondId, thirdId]).size).toBe(3);
    carousel.select(1, carousel.activePage);
    expect(carousel.activePageId).toBe(secondId);
    expect(carousel.getPageById(thirdId)).not.toBeNull();
    carousel.removeActive();
    expect(carousel.getPageById(secondId)).toBeNull();
    expect(carousel.activePageId).toBe(thirdId);
    expect(carousel.getPageById(coverId)?.variant).toBe('cover');
  });
});
