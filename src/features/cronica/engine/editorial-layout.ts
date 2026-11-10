/**
 * Composición y salto de líneas de Crónica. Sin acceso a DOM, React ni Canvas.
 * La medición de fuentes se inyecta para conservar el measureText del Canvas.
 */

export interface RichPart {
  readonly text: string;
  readonly accent: boolean;
  readonly italic: boolean;
  readonly strike: boolean;
}
export interface MeasuredPart extends RichPart {
  readonly width: number;
}
export type EditorialLine = MeasuredPart[];
export type MeasureText = (font: string, text: string) => number;

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1440;
export const CONTENT_EDGE = 80;

export function parseRich(text: string): RichPart[] {
  const out: RichPart[] = [];
  let state = { accent: false, italic: false, strike: false };
  let buffer = '';
  const flush = () => {
    if (buffer) {
      out.push({ text: buffer, ...state });
      buffer = '';
    }
  };
  for (const c of String(text)) {
    const key = c === '*' ? 'accent' : c === '_' ? 'italic' : c === '~' ? 'strike' : null;
    if (key) {
      flush();
      state = { ...state, [key]: !state[key] };
    } else buffer += c;
  }
  flush();
  return out;
}

export function fontFor(size: number, part: RichPart): string {
  return (part.italic ? 'italic ' : '') + '700 ' + size + 'px Asap,Arial,sans-serif';
}

export function wrappedLines(
  text: string,
  size: number,
  measure: MeasureText,
  width = CANVAS_WIDTH,
  edge = CONTENT_EDGE,
): EditorialLine[] {
  const result: EditorialLine[] = [];
  for (const paragraph of String(text).split('\n')) {
    let line: EditorialLine = [];
    let lineWidth = 0;
    for (const span of parseRich(paragraph)) {
      for (const part of span.text.match(/\S+|\s+/g) || []) {
        const partWidth = measure(fontFor(size, span), part);
        if (lineWidth + partWidth > width - edge * 2 && lineWidth > 0 && part.trim()) {
          result.push(line);
          line = [];
          lineWidth = 0;
        }
        if (!line.length && !part.trim()) continue;
        if (partWidth > width - edge * 2 && part.trim()) {
          for (const char of part) {
            const cw = measure(fontFor(size, span), char);
            if (lineWidth + cw > width - edge * 2 && lineWidth) {
              result.push(line);
              line = [];
              lineWidth = 0;
            }
            line.push({ ...span, text: char, width: cw });
            lineWidth += cw;
          }
        } else {
          line.push({ ...span, text: part, width: partWidth });
          lineWidth += partWidth;
        }
      }
    }
    if (line.length) result.push(line);
  }
  return result;
}

export interface EditorialLayoutInput {
  readonly headline: string;
  readonly requestedSize: number;
  readonly forceUppercase: boolean;
  readonly showStrap: boolean;
  readonly variant: 'cover' | 'internal';
}
export interface EditorialLayout {
  readonly cover: boolean;
  readonly requestedSize: number;
  readonly size: number;
  readonly lines: EditorialLine[];
  readonly baselines: number[];
  readonly top: number;
  readonly panelTop: number;
  readonly barY: number;
  readonly imageBottom: number;
  readonly showBar: boolean;
}

export function calculateEditorialLayout(
  input: EditorialLayoutInput,
  measure: MeasureText,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
  edge = CONTENT_EDGE,
): EditorialLayout {
  const cover = input.variant === 'cover';
  const requestedSize = input.requestedSize;
  const footerBaseline = height - edge;
  const footerTop = footerBaseline - 28;
  const availableBottom = cover ? footerTop - 50 : height - edge;
  const desired = input.forceUppercase
    ? input.headline.toLocaleUpperCase('es-AR')
    : input.headline;
  let size = requestedSize;
  let lines = wrappedLines(desired, size, measure, width, edge);
  const lineHeight = () => Math.round(size * 1.09);
  function textTop() {
    return availableBottom - (lines.length ? size * 0.85 + (lines.length - 1) * lineHeight() : 0);
  }
  const showBar = input.showStrap;
  const barHeight = showBar ? (cover ? 52 : 50) : 0;
  const requiredGap = cover ? 80 : 80;
  while (size > 32 && textTop() - (showBar ? barHeight + requiredGap : 80) < 230) {
    size -= 2;
    lines = wrappedLines(desired, size, measure, width, edge);
  }
  const gap = lineHeight();
  const baselines = lines.map((_, i) => availableBottom - (lines.length - 1 - i) * gap);
  const top = lines.length ? baselines[0]! - size : availableBottom;
  let panelTop: number;
  let barY: number;
  if (cover) {
    panelTop = Math.max(160, top - (showBar ? 76 : 56.5));
    barY = panelTop - 26;
  } else {
    panelTop = Math.max(160, top - 50 - (showBar ? barHeight : 0));
    barY = panelTop;
  }
  const imageBottom = cover ? panelTop : panelTop;
  return { cover, requestedSize, size, lines, baselines, top, panelTop, barY, imageBottom, showBar };
}
