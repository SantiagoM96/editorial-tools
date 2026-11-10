/**
 * Mantiene como máximo una decodificación pendiente por página.
 * Su identidad estable evita aplicar una foto a otra página cuando los índices
 * cambian por insertar/eliminar. AbortController libera el objectURL obsoleto.
 */
export class PhotoLoadCoordinator {
  private readonly pending = new Map<number, AbortController>();

  begin(pageId: number): AbortSignal {
    this.cancel(pageId);
    const controller = new AbortController();
    this.pending.set(pageId, controller);
    return controller.signal;
  }

  isCurrent(pageId: number, signal: AbortSignal): boolean {
    return !signal.aborted && this.pending.get(pageId)?.signal === signal;
  }

  finish(pageId: number, signal: AbortSignal): void {
    if (this.isCurrent(pageId, signal)) this.pending.delete(pageId);
  }

  cancel(pageId: number): void {
    const current = this.pending.get(pageId);
    if (!current) return;
    this.pending.delete(pageId);
    current.abort();
  }
}
