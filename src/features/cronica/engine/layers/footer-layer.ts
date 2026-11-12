import { CANVAS_WIDTH, CANVAS_HEIGHT, CONTENT_EDGE } from '../editorial-layout';
import { CRONICA_RED } from '../canvas-tokens';
import type { EditorialFooterStyle } from '../document-model';

/** Pie de portada, nunca visible en páginas interiores. */
export function drawCoverFooterLayer(
  ctx: CanvasRenderingContext2D,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
  edge = CONTENT_EDGE,
  style: EditorialFooterStyle = 'carousel',
): void {
  const footerCenterY = canvasHeight - edge - 16;
  ctx.save();
  ctx.fillStyle = CRONICA_RED;
  ctx.textBaseline = 'middle';
  ctx.font = '500 30px Inter,Arial,sans-serif';
  ctx.textAlign = style === 'center' ? 'center' : 'left';
  ctx.fillText('cronica.com.ar', style === 'center' ? canvasWidth / 2 : edge, footerCenterY);
  if (style === 'carousel') {
    ctx.font = '54px "Material Icons"';
    ctx.textAlign = 'right';
    ctx.fillText('arrow_forward', canvasWidth - edge, footerCenterY);
  }
  ctx.restore();
}
