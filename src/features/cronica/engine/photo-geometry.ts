/** Cálculos puros para reencuadrar la fotografía sin dependencia de React ni Canvas. */
export interface PhotoGeometryInput {
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly canvasWidth: number;
  readonly photoBottom: number;
  readonly zoom: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export interface PhotoPlacement {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export function calculatePhotoPlacement(input: PhotoGeometryInput): PhotoPlacement {
  const {
    imageWidth, imageHeight, canvasWidth, photoBottom, zoom, offsetX, offsetY,
  } = input;
  // Mantener exactamente el orden de cálculo original para conservar
  // los píxeles del Canvas y la exportación PNG de 1080 × 1440.
  const scale = Math.max(canvasWidth / imageWidth, photoBottom / imageHeight) * zoom;
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const maxX = Math.max(0, (width - canvasWidth) / 2);
  const maxY = Math.max(0, (height - photoBottom) / 2);
  const limitedX = Math.max(-maxX, Math.min(maxX, offsetX));
  const limitedY = Math.max(-maxY, Math.min(maxY, offsetY));
  return {
    x: (canvasWidth - width) / 2 + limitedX,
    y: (photoBottom - height) / 2 + limitedY,
    width,
    height,
    offsetX: limitedX,
    offsetY: limitedY,
  };
}

export interface PointerMovement {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly canvasWidth: number;
  readonly viewportWidth: number;
}

export function panByPointerDelta(input: PointerMovement): { offsetX: number; offsetY: number } {
  const ratio = input.canvasWidth / input.viewportWidth;
  return {
    offsetX: input.offsetX + input.deltaX * ratio,
    offsetY: input.offsetY + input.deltaY * ratio,
  };
}
