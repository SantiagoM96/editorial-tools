import { describe, expect, it, vi } from 'vitest';
import {
  PngExportService, PngTimestampClock, pngFilename, canvasToPngBlob,
  type PngExportDependencies, type PngFile,
} from './png-export-service';

function fixtures(failingAt = -1) {
  let active = 2;
  const downloads: PngFile[] = [];
  const progress: string[] = [];
  const sequence: string[] = [];
  const pages = ['portada', 'interior 1', 'interior 2'];
  const blob = new Blob(['png'], { type: 'image/png' });
  const deps: PngExportDependencies = {
    activeIndex: () => active,
    pageCount: () => pages.length,
    saveActivePage: () => sequence.push('save'),
    waitForAssets: async () => { sequence.push('ready'); },
    visitPage: (index) => { active = index; sequence.push('visit ' + index); },
    renderWithoutHover: () => sequence.push('render ' + active),
    encodePng: async () => {
      sequence.push('encode ' + active);
      if (active === failingAt) throw new Error('Falló Canvas');
      return blob;
    },
    download: file => { downloads.push(file); sequence.push('download ' + file.name); },
    progress: message => { progress.push(message); },
    restorePage: index => { active = index; sequence.push('restore ' + index); },
  };
  return { deps, downloads, progress, sequence, getActive: () => active, blob };
}

describe('Servicio de exportación PNG Crónica', () => {
  it('genera nombres únicos, ordenados y con segunda monotónica', () => {
    const clock = new PngTimestampClock(() => Date.UTC(2026, 10, 10, 13, 45, 12));
    const first = clock.timestamp(0);
    expect(first).toMatch(/^2026-11-10_\d\d-45-12$/);
    expect(pngFilename(0, first)).toMatch(/^Cronica-pagina-01_2026-11-10_/);
    expect(pngFilename(11, first)).toContain('pagina-12');
    clock.finishBatch(3);
    const next = clock.timestamp(0);
    expect(next).not.toBe(first);
  });

  it('exporta todas las páginas antes de iniciar descargas, y restaura página previa', async () => {
    const f = fixtures();
    const service = new PngExportService(f.deps, new PngTimestampClock(() => 1794300000000));
    expect(await service.export(true)).toEqual({ count: 3, originalIndex: 2 });
    expect(f.downloads).toHaveLength(3);
    expect(f.downloads.map(file => file.name)).toEqual([
      expect.stringMatching(/^Cronica-pagina-01_.*\.png$/),
      expect.stringMatching(/^Cronica-pagina-02_.*\.png$/),
      expect.stringMatching(/^Cronica-pagina-03_.*\.png$/),
    ]);
    expect(f.sequence.indexOf('encode 2')).toBeLessThan(f.sequence.findIndex(x => x.startsWith('download ')));
    expect(f.sequence.at(-1)).toBe('restore 2');
    expect(f.getActive()).toBe(2);
    expect(f.progress).toContain('Preparando imagen 2 de 3...');
  });

  it('exporta solo la página actual y no cambia la selección', async () => {
    const f = fixtures();
    const service = new PngExportService(f.deps);
    expect(await service.export(false)).toEqual({ count: 1, originalIndex: 2 });
    expect(f.downloads).toHaveLength(1);
    expect(f.downloads[0]?.name).toMatch(/^Cronica-pagina-03_.*\.png$/);
    expect(f.sequence.some(step => step.startsWith('visit '))).toBe(false);
    expect(f.sequence.some(step => step.startsWith('restore '))).toBe(false);
    expect(f.getActive()).toBe(2);
  });

  it('si falla encode restaura la página original y no descarga archivos parciales', async () => {
    const f = fixtures(1);
    const service = new PngExportService(f.deps);
    await expect(service.export(true)).rejects.toThrow('Falló Canvas');
    expect(f.getActive()).toBe(2);
    expect(f.downloads).toHaveLength(0);
    expect(f.sequence.at(-1)).toBe('restore 2');
  });

  it('si falla la espera de recursos también restaura la página original', async () => {
    const f = fixtures();
    const service = new PngExportService({
      ...f.deps,
      waitForAssets: async () => { throw new Error('Fuente no disponible'); },
    });
    await expect(service.export(true)).rejects.toThrow('Fuente no disponible');
    expect(f.sequence.at(-1)).toBe('restore 2');
    expect(f.getActive()).toBe(2);
  });

  it('canvasToPngBlob maneja éxito, error nulo y excepciones del navegador', async () => {
    const blob = new Blob(['png'], { type: 'image/png' });
    const canvas = document.createElement('canvas');
    canvas.toBlob = vi.fn(callback => callback(blob));
    await expect(canvasToPngBlob(canvas)).resolves.toBe(blob);
    canvas.toBlob = vi.fn(callback => callback(null));
    await expect(canvasToPngBlob(canvas)).rejects.toThrow('No se pudo generar el PNG.');
    canvas.toBlob = vi.fn(() => { throw new Error('Canvas inseguro'); });
    await expect(canvasToPngBlob(canvas)).rejects.toThrow('Canvas inseguro');
  });
});
