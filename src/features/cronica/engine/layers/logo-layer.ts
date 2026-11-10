import type { EditorialLogo } from '../document-model';
import { CANVAS_WIDTH, CONTENT_EDGE } from '../editorial-layout';

const LOGO_WIDTH = 75 * 1.25 * 1.15;
const LOGO_HEIGHT = LOGO_WIDTH * 191 / 175;

export function drawLogoLayer(
  ctx: CanvasRenderingContext2D,
  selected: EditorialLogo,
  images: Partial<Record<Exclude<EditorialLogo, 'none'>, HTMLImageElement>>,
  canvasWidth = CANVAS_WIDTH,
  edge = CONTENT_EDGE,
): void {
  if (selected === 'none') return;
  const img = images[selected];
  if (!img || !img.complete || !img.naturalWidth) return;
  ctx.drawImage(img, canvasWidth - edge - LOGO_WIDTH, edge, LOGO_WIDTH, LOGO_HEIGHT);
}
