import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../editorial-layout';
import { CRONICA_RED } from '../canvas-tokens';

export function prepareCanvasSurface(
  ctx: CanvasRenderingContext2D,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

/** La línea roja se dibuja después de foto/logo, antes de volanta y titulares. */
export function drawTextPanelLayer(
  ctx: CanvasRenderingContext2D,
  panelTop: number,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, panelTop, canvasWidth, canvasHeight - panelTop);
  ctx.fillStyle = CRONICA_RED;
  ctx.fillRect(0, panelTop - 6.5, canvasWidth, 13);
}
