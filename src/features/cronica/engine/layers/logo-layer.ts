import type { EditorialLogo, EditorialLogoPosition } from '../document-model';
import { CANVAS_WIDTH, CONTENT_EDGE } from '../editorial-layout';

const LOGO_WIDTH = 75 * 1.25 * 1.15;
const LOGO_HEIGHT = LOGO_WIDTH * 191 / 175;

export function drawLogoLayer(
  ctx: CanvasRenderingContext2D,
  selected: EditorialLogo,
  images: Partial<Record<Exclude<EditorialLogo, 'none'>, HTMLImageElement>>,
  canvasWidth = CANVAS_WIDTH,
  edge = CONTENT_EDGE,
  position: EditorialLogoPosition = 'right',
): void {
  if (selected === 'none') return;
  const img = images[selected];
  if (!img || !img.complete || !img.naturalWidth) return;
  ctx.drawImage(img, position === 'left' ? edge : canvasWidth - edge - LOGO_WIDTH, edge, LOGO_WIDTH, LOGO_HEIGHT);
}
