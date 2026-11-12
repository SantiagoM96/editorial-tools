import { describe, expect, it, vi } from 'vitest';
import { drawPhotoLayer } from './photo-layer';
import { drawLogoLayer } from './logo-layer';
import { drawStrapLayer } from './strap-layer';
import { drawHeadlineLayer } from './headline-layer';
import { prepareCanvasSurface, drawTextPanelLayer } from './surface-layer';
import { drawCoverFooterLayer } from './footer-layer';

function makeContext() {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    textBaseline: 'alphabetic',
    textAlign: 'left',
    font: '',
    lineWidth: 1,
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
  };
  return ctx;
}

describe('Capas Canvas Crónica — contratos sin DOM de editor', () => {
  it('fondo y panel conservan la línea roja de 13px en la coordenada original', () => {
    const raw = makeContext();
    const ctx = raw as unknown as CanvasRenderingContext2D;
    prepareCanvasSurface(ctx);
    expect(raw.clearRect).toHaveBeenCalledExactlyOnceWith(0, 0, 1080, 1440);
    expect(raw.fillRect).toHaveBeenCalledWith(0, 0, 1080, 1440);
    drawTextPanelLayer(ctx, 750);
    expect(raw.fillRect).toHaveBeenCalledWith(0, 750, 1080, 690);
    expect(raw.fillRect).toHaveBeenCalledWith(0, 743.5, 1080, 13);
    expect(raw.fillStyle).toBe('#ed0000');
  });

  it('la capa fotográfica conserva cover, clip y offsets limitados', () => {
    const raw = makeContext();
    const ctx = raw as unknown as CanvasRenderingContext2D;
    const photo = { width: 540, height: 720 } as HTMLImageElement;
    const limited = drawPhotoLayer(ctx, {
      image: photo, photoBottom: 820, zoom: 1,
      offsetX: 10000, offsetY: -10000, photoHover: false, includeHover: true,
    });
    expect(limited.offsetX).toBe(0);
    expect(limited.offsetY).toBe(-310);
    expect(raw.fillRect).toHaveBeenCalledWith(0, 0, 1080, 820);
    expect(raw.rect).toHaveBeenCalledWith(0, 0, 1080, 820);
    expect(raw.drawImage).toHaveBeenCalledExactlyOnceWith(photo, 0, -620, 1080, 1440);
    expect(raw.save).toHaveBeenCalledTimes(1);
    expect(raw.restore).toHaveBeenCalledTimes(1);
  });

  it('sin foto solo dibuja el hover cuando está habilitado, nunca un PNG adicional', () => {
    const raw = makeContext();
    const ctx = raw as unknown as CanvasRenderingContext2D;
    const args = {
      image: null, photoBottom: 640, zoom: 1, offsetX: 9, offsetY: -3,
      photoHover: true, includeHover: false,
    };
    const result = drawPhotoLayer(ctx, args);
    expect(result).toEqual({ offsetX: 9, offsetY: -3 });
    expect(raw.fillRect).toHaveBeenCalledTimes(1);
    drawPhotoLayer(ctx, { ...args, includeHover: true });
    expect(raw.fillRect).toHaveBeenCalledTimes(3);
    expect(raw.drawImage).not.toHaveBeenCalled();
  });

  it('logo seleccionado requiere imagen cargada y respeta medidas y márgenes', () => {
    const raw = makeContext();
    const ctx = raw as unknown as CanvasRenderingContext2D;
    const img = { complete: true, naturalWidth: 175 } as HTMLImageElement;
    drawLogoLayer(ctx, 'none', { primary: img });
    drawLogoLayer(ctx, 'secondary', { primary: img });
    drawLogoLayer(ctx, 'primary', { primary: { complete: false, naturalWidth: 175 } as HTMLImageElement });
    expect(raw.drawImage).not.toHaveBeenCalled();
    drawLogoLayer(ctx, 'primary', { primary: img });
    const width = 75 * 1.25 * 1.15;
    expect(raw.drawImage).toHaveBeenCalledExactlyOnceWith(img, 1080 - 80 - width, 80, width, width * 191 / 175);
    drawLogoLayer(ctx, 'primary', { primary: img }, 1080, 80, 'left');
    expect(raw.drawImage).toHaveBeenLastCalledWith(img, 80, 80, width, width * 191 / 175);
  });

  it('volanta de portada conserva altura, color y baseline; interior ocupa ancho completo', () => {
    const raw = makeContext();
    const ctx = raw as unknown as CanvasRenderingContext2D;
    drawStrapLayer(ctx, { strapText: '  noticia    ágil ', isCover: true, y: 600 });
    expect(raw.fillRect).toHaveBeenCalledWith((1080 - 164) / 2, 600, 164, 68);
    expect(raw.fillText).toHaveBeenCalledWith('NOTICIA ÁGIL', 540, 634, 896);
    expect(raw.textBaseline).toBe('alphabetic');
    expect(raw.textAlign).toBe('left');
    drawStrapLayer(ctx, { strapText: 'INTERIOR', isCover: false, y: 640 });
    expect(raw.fillRect).toHaveBeenCalledWith(0, 640, 1080, 65);
  });

  it('titulares mantienen alineación y tachado con trazo rojo del mismo ancho', () => {
    const raw = makeContext();
    const ctx = raw as unknown as CanvasRenderingContext2D;
    const line = [
      { text: 'UNO', width: 60, accent: true, italic: false, strike: true },
      { text: 'DOS', width: 40, accent: false, italic: true, strike: false },
    ];
    drawHeadlineLayer(ctx, [line], 64, [900], 'center');
    expect(raw.fillText).toHaveBeenNthCalledWith(1, 'UNO', 490, 900);
    expect(raw.fillText).toHaveBeenNthCalledWith(2, 'DOS', 550, 900);
    expect(raw.moveTo).toHaveBeenCalledWith(490, 900 - 64 * .32);
    expect(raw.lineTo).toHaveBeenCalledWith(550, 900 - 64 * .32);
    expect(raw.stroke).toHaveBeenCalledOnce();
    expect(raw.font).toBe('italic 700 64px Asap,Arial,sans-serif');
  });

  it('el pie conserva dominio y flecha en portada', () => {
    const raw = makeContext();
    const ctx = raw as unknown as CanvasRenderingContext2D;
    drawCoverFooterLayer(ctx);
    expect(raw.fillText).toHaveBeenNthCalledWith(1, 'cronica.com.ar', 80, 1344);
    expect(raw.fillText).toHaveBeenNthCalledWith(2, 'arrow_forward', 1000, 1344);
    expect(raw.save).toHaveBeenCalledOnce();
    expect(raw.restore).toHaveBeenCalledOnce();
    expect(raw.font).toBe('54px "Material Icons"');
    raw.fillText.mockClear();
    drawCoverFooterLayer(ctx, 1080, 1440, 80, 'center');
    expect(raw.fillText).toHaveBeenCalledExactlyOnceWith('cronica.com.ar', 540, 1344);
  });
});
