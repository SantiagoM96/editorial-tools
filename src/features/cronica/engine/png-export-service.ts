/**
 * Exportación independiente del DOM del editor: render, páginas, tipografías,
 * descarga y feedback son dependencias inyectadas. No duplica documentos.
 */

export interface PngFile {
  readonly name: string;
  readonly blob: Blob;
}

export interface PngExportResult {
  readonly count: number;
  readonly originalIndex: number;
}

export interface PngExportDependencies {
  readonly activeIndex: () => number;
  readonly pageCount: () => number;
  readonly saveActivePage: () => void;
  readonly waitForAssets: () => Promise<unknown>;
  readonly visitPage: (index: number) => void;
  readonly renderWithoutHover: () => void;
  readonly encodePng: () => Promise<Blob>;
  readonly download: (file: PngFile) => void;
  readonly progress: (message: string) => void;
  readonly restorePage: (index: number) => void;
}

export class PngTimestampClock {
  private lastSecond = 0;

  constructor(private readonly now: () => number = Date.now) {}

  /** La primera imagen de cada exportación recibe un segundo único. */
  timestamp(index = 0): string {
    if (index === 0) {
      this.lastSecond = Math.max(Math.floor(this.now() / 1000), this.lastSecond + 1);
    }
    const d = new Date((this.lastSecond + index) * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      '_' + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '-' + pad(d.getSeconds());
  }

  finishBatch(count: number): void {
    this.lastSecond += Math.max(0, count - 1);
  }
}

export function pngFilename(pageIndex: number, timestamp: string): string {
  return 'Cronica-pagina-' + String(pageIndex + 1).padStart(2, '0') + '_' + timestamp + '.png';
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo generar el PNG.')), 'image/png');
    } catch (error) {
      reject(error);
    }
  });
}

/** Mantener liberación diferida: revocar enseguida interrumpe descargas en algunos navegadores. */
export function downloadPng(file: PngFile, revokeAfterMs = 30000): void {
  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement('a');
  try {
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), revokeAfterMs);
  }
}

export class PngExportService {
  private readonly clock: PngTimestampClock;

  constructor(
    private readonly dependencies: PngExportDependencies,
    clock = new PngTimestampClock(),
  ) {
    this.clock = clock;
  }

  async export(all: boolean): Promise<PngExportResult> {
    const deps = this.dependencies;
    const originalIndex = deps.activeIndex();
    const count = all ? deps.pageCount() : 1;

    try {
      deps.saveActivePage();
      await deps.waitForAssets();
      const timestamp = this.clock.timestamp(0);

      if (all) {
        const files: PngFile[] = [];
        // Primero generar todos los blobs. Luego iniciar las descargas juntas.
        for (let index = 0; index < count; index++) {
          deps.progress('Preparando imagen ' + (index + 1) + ' de ' + count + '...');
          deps.visitPage(index);
          deps.renderWithoutHover();
          const blob = await deps.encodePng();
          files.push({
            name: pngFilename(index, index === 0 ? timestamp : this.clock.timestamp(index)),
            blob,
          });
        }
        this.clock.finishBatch(count);
        deps.progress('Iniciando ' + count + ' descargas PNG...');
        for (const file of files) deps.download(file);
      } else {
        deps.renderWithoutHover();
        const blob = await deps.encodePng();
        deps.download({ name: pngFilename(originalIndex, timestamp), blob });
      }
      return { count, originalIndex };
    } finally {
      // Incluso si falla la carga de fuentes, toBlob o una descarga.
      // El único store canónico debe recuperar la selección previa.
      if (all) deps.restorePage(originalIndex);
    }
  }
}
