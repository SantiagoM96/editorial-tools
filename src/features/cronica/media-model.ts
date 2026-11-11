export type BrandLogo = 'none' | 'primary' | 'secondary' | 'white';

export interface MediaSnapshot {
  readonly logo: BrandLogo;
  /** Igual que el rango original: porcentaje entero de 100 a 300 en pasos de 5. */
  readonly zoomPercent: number;
  readonly hasImage: boolean;
  /** Campo opcional para mantener compatibilidad con eventos anteriores. */
  readonly photoName?: string | null;
}

export type MediaCommand =
  | { readonly type: 'set-logo'; readonly logo: BrandLogo }
  | { readonly type: 'set-zoom'; readonly percent: number }
  | { readonly type: 'upload-photo'; readonly file: File };

export const initialMedia: MediaSnapshot = {
  logo: 'primary',
  zoomPercent: 100,
  hasImage: false,
  photoName: null,
};

export function isBrandLogo(value: unknown): value is BrandLogo {
  return value === 'none' || value === 'primary' || value === 'secondary' || value === 'white';
}

export function isZoomPercent(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) &&
    value >= 100 && value <= 300 && value % 5 === 0;
}

export function isMediaSnapshot(value: unknown): value is MediaSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const snapshot = value as Record<string, unknown>;
  return isBrandLogo(snapshot.logo) &&
    isZoomPercent(snapshot.zoomPercent) &&
    typeof snapshot.hasImage === 'boolean' &&
    (snapshot.photoName === undefined || snapshot.photoName === null || typeof snapshot.photoName === 'string');
}
