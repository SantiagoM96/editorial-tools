export type CrónicaVariant = 'blank' | 'cover' | 'internal';

export interface CarouselSnapshot {
  readonly pages: readonly CrónicaVariant[];
  readonly activePage: number;
  readonly variant: CrónicaVariant;
}

export type CarouselCommand =
  | { readonly type: 'add-page' }
  | { readonly type: 'remove-page' }
  | { readonly type: 'select-page'; readonly index: number }
  | { readonly type: 'set-variant'; readonly variant: CrónicaVariant };

export const initialCarousel: CarouselSnapshot = {
  pages: ['cover'],
  activePage: 0,
  variant: 'cover',
};

function isVariant(value: unknown): value is CrónicaVariant {
  return value === 'blank' || value === 'cover' || value === 'internal';
}

// Se validan snapshots recibidos del código legado antes de guardarlos en React.
export function isCarouselSnapshot(input: unknown): input is CarouselSnapshot {
  if (typeof input !== 'object' || input === null) return false;
  const snapshot = input as Record<string, unknown>;
  if (!Array.isArray(snapshot.pages) || snapshot.pages.length < 1) return false;
  if (!snapshot.pages.every(isVariant)) return false;
  if (
    typeof snapshot.activePage !== 'number' ||
    !Number.isInteger(snapshot.activePage) ||
    snapshot.activePage < 0 ||
    snapshot.activePage >= snapshot.pages.length
  ) {
    return false;
  }
  return (
    isVariant(snapshot.variant) &&
    snapshot.pages[snapshot.activePage] === snapshot.variant
  );
}

export function currentPageLabel(snapshot: CarouselSnapshot): string {
  return `${snapshot.activePage + 1} de ${snapshot.pages.length} · ${snapshot.variant === 'blank' ? 'Sin diseño' : snapshot.variant === 'cover' ? 'Portada' : 'Interior'}`;
}
