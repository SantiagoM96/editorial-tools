export type TypographyAlignment = 'left' | 'center';
export type TypographyFormat = 'accent' | 'italic' | 'strike' | 'clear';

export interface TypographyState {
  readonly uppercase: boolean;
  readonly alignment: TypographyAlignment;
}

export const initialTypography: TypographyState = {
  uppercase: false,
  alignment: 'center',
};

export function isTypographyState(value: unknown): value is TypographyState {
  if (typeof value !== 'object' || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.uppercase === 'boolean' &&
    (data.alignment === 'left' || data.alignment === 'center')
  );
}

export interface TextSelectionEdit {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

/**
 * Operaciones editoriales puras. Preserva los marcadores y la selección del
 * editor original, pero ya no depende del DOM, React o Canvas.
 */
export function editFormattedSelection(
  value: string,
  start: number,
  end: number,
  format: TypographyFormat,
): TextSelectionEdit | null {
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end > value.length ||
    start >= end
  ) {
    return null;
  }

  if (format === 'clear') {
    const markers = new Set(['*', '_', '~']);
    let left = start;
    let right = end;
    while (
      left > 0 &&
      right < value.length &&
      markers.has(value[left - 1] ?? '') &&
      value[left - 1] === value[right]
    ) {
      left--;
      right++;
    }
    const cleaned = value.slice(left, right).replace(/[*_~]/g, '');
    return {
      text: value.slice(0, left) + cleaned + value.slice(right),
      start: left,
      end: left + cleaned.length,
    };
  }

  const marker = { accent: '*', italic: '_', strike: '~' }[format];
  if (!marker) return null;
  const selected = value.slice(start, end);
  return {
    text: value.slice(0, start) + marker + selected + marker + value.slice(end),
    start: start + 1,
    end: end + 1,
  };
}
