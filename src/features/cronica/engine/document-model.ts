/**
 * Modelo de documento Crónica desacoplado de React, formularios y Canvas.
 * Estos valores conservan los defaults de la versión editorial original.
 */
export type EditorialVariant = 'blank' | 'cover' | 'internal';
export type EditorialLogo = 'none' | 'primary' | 'secondary' | 'white';
export type EditorialAlignment = 'left' | 'center';

export interface EditorialContent {
  headline: string;
  strapText: string;
  showStrap: boolean;
  size: string;
}

export interface EditorialPage extends EditorialContent {
  alignment: EditorialAlignment;
  forceUppercase: boolean;
  logo: EditorialLogo;
  image: HTMLImageElement | null;
  /** Nombre informativo de la fotografía por página; nunca interviene en Canvas. */
  photoName: string | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
  variant: EditorialVariant;
}

export const COVER_STRAP = 'RESUMÍ ACÁ EL TEMA';
export const COVER_HEADLINE = 'Escribí un título claro y directo. *Destacá el dato principal* y dejá los detalles para las siguientes placas.';
export const INTERNAL_HEADLINE = 'En esta placa podés ampliar la información. Explicá qué pasó, quiénes están involucrados y por qué es importante. Usá frases cortas y una idea por vez para facilitar la lectura.';

export function createCoverContent(): EditorialContent {
  return { headline: COVER_HEADLINE, strapText: COVER_STRAP, showStrap: true, size: '64' };
}

export function createDefaultPage(variant: EditorialVariant): EditorialPage {
  if (variant === 'cover') {
    return {
      ...createCoverContent(),
      alignment: 'center',
      forceUppercase: false,
      logo: 'primary',
      image: null,
      photoName: null,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      variant,
    };
  }
  return {
    headline: INTERNAL_HEADLINE,
    strapText: '',
    showStrap: false,
    size: '52',
    alignment: 'left',
    forceUppercase: false,
    logo: 'primary',
    image: null,
    photoName: null,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    variant,
  };
}

/** Crea el snapshot completo sin clonar la imagen ni perder precisión del zoom/offset. */
export function snapshotEditorialPage(
  content: EditorialContent,
  controls: Omit<EditorialPage, keyof EditorialContent>,
): EditorialPage {
  return { ...content, ...controls };
}

/**
 * Mantiene el comportamiento de Limpiar existente: la primera página recupera
 * el contenido de portada incluso si se cambió su variante; las otras
 * recuperan los textos de interior conservando la variante seleccionada.
 */
export function createClearedPage(activeIndex: number, variant: EditorialVariant): EditorialPage {
  const page = activeIndex === 0 ? createDefaultPage('cover') : createDefaultPage('internal');
  page.variant = variant;
  return page;
}
