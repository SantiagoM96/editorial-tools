import { createDefaultPage, type EditorialPage, type EditorialVariant } from './document-model';
import type { CarouselSnapshot } from '../carousel-model';

/**
 * Única fuente de verdad de páginas y página activa.
 *
 * El motor de Canvas conserva los campos de la placa activa como proyección
 * durante la edición, pero todas las páginas guardadas viven en este store.
 * Las imágenes se mantienen por referencia, sin clonarlas o serializarlas.
 */
export class EditorialCarouselStore {
  private readonly pages: EditorialPage[];
  private index = 0;

  constructor(firstPage: EditorialPage) {
    this.pages = [firstPage];
  }

  get activeIndex(): number {
    return this.index;
  }

  get pageCount(): number {
    return this.pages.length;
  }

  get activePage(): EditorialPage {
    return this.pages[this.index]!;
  }

  getPage(index: number): EditorialPage | null {
    return Number.isInteger(index) ? (this.pages[index] ?? null) : null;
  }

  get snapshot(): CarouselSnapshot {
    return {
      pages: this.pages.map(page => page.variant),
      activePage: this.index,
      variant: this.activePage.variant,
    };
  }

  saveActive(page: EditorialPage): void {
    this.pages[this.index] = page;
  }

  select(index: number, editedPage: EditorialPage): EditorialPage | null {
    if (!Number.isInteger(index) || index === this.index || index < 0 || index >= this.pages.length) {
      return null;
    }
    this.saveActive(editedPage);
    this.index = index;
    return this.activePage;
  }

  insertAfterActive(editedPage: EditorialPage): EditorialPage {
    this.saveActive(editedPage);
    this.index++;
    this.pages.splice(this.index, 0, createDefaultPage('internal'));
    return this.activePage;
  }

  removeActive(): EditorialPage | null {
    // La portada no se elimina y siempre debe existir una página.
    if (this.index === 0) return null;
    this.pages.splice(this.index, 1);
    this.index = Math.min(this.index, this.pages.length - 1);
    return this.activePage;
  }

  setActiveVariant(variant: EditorialVariant, editedPage: EditorialPage): boolean {
    if (this.activePage.variant === variant) return false;
    this.saveActive({ ...editedPage, variant });
    return true;
  }

  /**
   * Solo se utiliza durante la exportación. No guarda el documento activo:
   * quien exporta ya lo guardó antes de recorrer todas las páginas.
   */
  visitForExport(index: number): EditorialPage {
    const page = this.getPage(index);
    if (!page) throw new RangeError('Página de exportación fuera de rango: ' + index);
    this.index = index;
    return page;
  }
}
