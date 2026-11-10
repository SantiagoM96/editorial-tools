import { describe, expect, it } from 'vitest';
import { PhotoLoadCoordinator } from './photo-load-coordinator';

describe('guardas de carga por identidad de página', () => {
  it('solo acepta la carga más reciente de una misma página', () => {
    const loads = new PhotoLoadCoordinator();
    const old = loads.begin(42);
    expect(loads.isCurrent(42, old)).toBe(true);
    const latest = loads.begin(42);
    expect(old.aborted).toBe(true);
    expect(loads.isCurrent(42, old)).toBe(false);
    expect(loads.isCurrent(42, latest)).toBe(true);
    loads.finish(42, old);
    expect(loads.isCurrent(42, latest)).toBe(true);
    loads.finish(42, latest);
    expect(loads.isCurrent(42, latest)).toBe(false);
  });

  it('cancelar la página eliminada no cancela solicitudes de otra página', () => {
    const loads = new PhotoLoadCoordinator();
    const first = loads.begin(7);
    const second = loads.begin(8);
    loads.cancel(7);
    expect(first.aborted).toBe(true);
    expect(second.aborted).toBe(false);
    expect(loads.isCurrent(8, second)).toBe(true);
    loads.cancel(8);
    expect(loads.isCurrent(8, second)).toBe(false);
  });

  it('volver a cargar una misma foto genera una señal independiente', () => {
    const loads = new PhotoLoadCoordinator();
    const one = loads.begin(0);
    loads.cancel(0);
    const two = loads.begin(0);
    expect(one).not.toBe(two);
    expect(loads.isCurrent(0, two)).toBe(true);
  });
});
