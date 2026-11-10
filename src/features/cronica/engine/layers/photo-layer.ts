import { calculatePhotoPlacement } from '../photo-geometry';
import { CANVAS_WIDTH } from '../editorial-layout';

export interface PhotoLayerOptions {
  readonly image: HTMLImageElement | null;
  readonly photoBottom: number;
  readonly zoom: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly photoHover: boolean;
  readonly includeHover: boolean;
  readonly canvasWidth?: number;
}

export interface PhotoLayerResult {
  readonly offsetX: number;
  readonly offsetY: number;
}

/** Pinta solo el área de fotografía y comunica los offsets limitados al motor. */
export function drawPhotoLayer(
  ctx: CanvasRenderingContext2D,
  options: PhotoLayerOptions,
): PhotoLayerResult {
  const {
    image, photoBottom, zoom, offsetX, offsetY, photoHover, includeHover,
    canvasWidth = CANVAS_WIDTH,
  } = options;
  ctx.fillStyle = '#aeb4bc';
  ctx.fillRect(0, 0, canvasWidth, photoBottom);
  if (image) {
    const placement = calculatePhotoPlacement({
      imageWidth: image.width, imageHeight: image.height,
      canvasWidth, photoBottom, zoom, offsetX, offsetY,
    });
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvasWidth, photoBottom);
    ctx.clip();
    ctx.drawImage(image, placement.x, placement.y, placement.width, placement.height);
    ctx.restore();
    return { offsetX: placement.offsetX, offsetY: placement.offsetY };
  }
  // La zona para subir fotografías es DOM, nunca se exporta dentro del PNG.
  if (includeHover && photoHover) {
    ctx.fillStyle = 'rgba(0,0,0,.11)';
    ctx.fillRect(0, 0, canvasWidth, photoBottom);
  }
  return { offsetX, offsetY };
}
