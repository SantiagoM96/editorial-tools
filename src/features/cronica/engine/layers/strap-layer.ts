import { CANVAS_WIDTH, CONTENT_EDGE } from '../editorial-layout';
import { CRONICA_RED } from '../canvas-tokens';

export interface StrapLayerOptions {
  readonly strapText: string;
  readonly isCover: boolean;
  readonly y: number;
  readonly canvasWidth?: number;
  readonly edge?: number;
}

/** Conserva el orden histórico de measureText, fuentes y baselines. */
export function drawStrapLayer(
  ctx: CanvasRenderingContext2D,
  options: StrapLayerOptions,
): void {
  const {
    strapText, isCover, y,
    canvasWidth = CANVAS_WIDTH,
    edge = CONTENT_EDGE,
  } = options;
  const content = strapText.replace(/\s+/g, ' ').trim().toLocaleUpperCase('es-AR');
  const maxWidth = canvasWidth - edge * 2;
  let size = isCover ? 40 : 38;
  ctx.textBaseline = 'middle';
  while (size > 16) {
    ctx.font = '800 ' + size + 'px Inter,Arial,sans-serif';
    if (ctx.measureText(content).width <= maxWidth - 44) break;
    size--;
  }
  const textWidth = ctx.measureText(content).width;
  const barHeight = isCover ? 68 : 65;
  const width = isCover ? Math.min(maxWidth, Math.ceil(textWidth + 44)) : canvasWidth;
  const left = isCover ? (canvasWidth - width) / 2 : 0;
  ctx.fillStyle = CRONICA_RED;
  ctx.fillRect(left, y, width, barHeight);
  if (content) {
    ctx.font = '800 ' + size + 'px Inter,Arial,sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(content, canvasWidth / 2, y + barHeight / 2, maxWidth - 24);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
