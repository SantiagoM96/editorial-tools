import { afterEach, describe, expect, it, vi } from 'vitest';
import { decodePhotoFile } from './photo-decoder';

afterEach(() => vi.unstubAllGlobals());

function mockBrowserDecode(success: boolean) {
  const revoke = vi.fn();
  const create = vi.fn(() => 'blob:test-photo');
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src = '';
    constructor() {
      queueMicrotask(() => {
        if (success) this.onload?.();
        else this.onerror?.();
      });
    }
  }
  vi.stubGlobal('Image', FakeImage);
  return { revoke, create };
}

describe('decodificador aislado de fotografías', () => {
  it('restituye una imagen y libera el object URL al cargar', async () => {
    const { revoke, create } = mockBrowserDecode(true);
    const file = new File(['abc'], 'photo.png', { type: 'image/png' });
    const image = await decodePhotoFile(file);
    expect(image.src).toBe('blob:test-photo');
    expect(create).toHaveBeenCalledWith(file);
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:test-photo');
  });

  it('informa fallo de decodificación y libera el recurso', async () => {
    const { revoke } = mockBrowserDecode(false);
    const file = new File(['bad'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(decodePhotoFile(file)).rejects.toThrow('No se pudo abrir esta fotografía');
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:test-photo');
  });

  it('rechaza formatos no fotográficos sin reservar memoria', async () => {
    const { create, revoke } = mockBrowserDecode(true);
    const file = new File(['<svg/>'], 'data.txt', { type: 'text/plain' });
    await expect(decodePhotoFile(file)).rejects.toThrow('Seleccioná un archivo de imagen válido.');
    expect(create).not.toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
  });
});

describe('cancelación y liberación de decodificaciones antiguas', () => {
  it('no crea un object URL cuando la solicitud ya fue cancelada', async () => {
    const { create, revoke } = mockBrowserDecode(true);
    const controller = new AbortController();
    controller.abort();
    await expect(decodePhotoFile(
      new File(['data'], 'foto.png', { type: 'image/png' }), controller.signal,
    )).rejects.toMatchObject({ name: 'AbortError' });
    expect(create).not.toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
  });

  it('aborta una decodificación pendiente y revoca la URL una sola vez', async () => {
    const create = vi.fn(() => 'blob:photo-waiting');
    const revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
    class WaitingImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
    }
    vi.stubGlobal('Image', WaitingImage);
    const controller = new AbortController();
    const promise = decodePhotoFile(
      new File(['data'], 'foto.png', { type: 'image/png' }), controller.signal,
    );
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(create).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:photo-waiting');
    controller.abort();
    expect(revoke).toHaveBeenCalledTimes(1);
  });
});
