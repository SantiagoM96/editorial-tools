export interface ContentSnapshot {
  readonly headline: string;
  readonly strapText: string;
  readonly showStrap: boolean;
  /** Se conserva como string porque el editor heredado guarda el valor del range. */
  readonly size: string;
}

export type ContentCommand =
  | { readonly field: 'headline'; readonly value: string }
  | { readonly field: 'strapText'; readonly value: string }
  | { readonly field: 'showStrap'; readonly value: boolean }
  | { readonly field: 'size'; readonly value: number };

export const initialContent: ContentSnapshot = {
  headline:
    'Escribí un título claro y directo. *Destacá el dato principal* y dejá los detalles para las siguientes placas.',
  strapText: 'LA CLAVE DE ESTA NOTICIA',
  showStrap: true,
  size: '64',
};

export function isContentSnapshot(input: unknown): input is ContentSnapshot {
  if (typeof input !== 'object' || input === null) return false;
  const value = input as Record<string, unknown>;
  const size = Number(value.size);
  return (
    typeof value.headline === 'string' &&
    typeof value.strapText === 'string' &&
    value.strapText.length <= 140 &&
    typeof value.showStrap === 'boolean' &&
    typeof value.size === 'string' &&
    Number.isInteger(size) &&
    size >= 32 &&
    size <= 95 &&
    String(size) === value.size
  );
}
