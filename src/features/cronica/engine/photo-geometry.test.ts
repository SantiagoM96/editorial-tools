import { describe, expect, it } from 'vitest';
import { calculatePhotoPlacement, panByPointerDelta } from './photo-geometry';

describe('reencuadre de imágenes con matemáticas originales', () => {
  it('cubre horizontalmente el área visible y centra el recorte inicial', () => {
    const value = calculatePhotoPlacement({
      imageWidth: 540, imageHeight: 720, canvasWidth: 1080,
      photoBottom: 820, zoom: 1, offsetX: 0, offsetY: 0,
    });
    expect(value).toEqual({
      x: 0, y: -310, width: 1080, height: 1440, offsetX: 0, offsetY: 0,
    });
  });

  it('respeta zoom, escala y límites simétricos en dos ejes', () => {
    const value = calculatePhotoPlacement({
      imageWidth: 1280, imageHeight: 720, canvasWidth: 1080,
      photoBottom: 700, zoom: 1.5, offsetX: 5000, offsetY: -5000,
    });
    // scale = max(1080/1280, 700/720) * 1.5
    const scale = Math.max(1080 / 1280, 700 / 720) * 1.5;
    const w = 1280 * scale, h = 720 * scale;
    const maxX = (w - 1080) / 2, maxY = (h - 700) / 2;
    expect(value).toEqual({
      x: (1080 - w) / 2 + maxX,
      y: (700 - h) / 2 - maxY,
      width: w, height: h, offsetX: maxX, offsetY: -maxY,
    });
  });

  it('no permite desplazar un eje donde la imagen encaja exactamente', () => {
    const value = calculatePhotoPlacement({
      imageWidth: 1080, imageHeight: 2000, canvasWidth: 1080,
      photoBottom: 800, zoom: 1, offsetX: 25, offsetY: -5,
    });
    expect(value.offsetX).toBe(0);
    expect(value.offsetY).toBe(-5);
    expect(value.x).toBe(0);
  });

  it('traduce movimientos CSS al espacio de 1080px del Canvas', () => {
    expect(panByPointerDelta({
      offsetX: 12, offsetY: -8,
      deltaX: 20, deltaY: -10, canvasWidth: 1080, viewportWidth: 540,
    })).toEqual({ offsetX: 52, offsetY: -28 });
  });
});
