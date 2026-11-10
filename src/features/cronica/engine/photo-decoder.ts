/** Servicio de decodificación separado del Canvas y de React.
 * La señal permite cancelar solicitudes antiguas y liberar recursos cuando
 * se reemplaza la foto o se elimina su página.
 */
export function decodePhotoFile(file: File, signal?: AbortSignal): Promise<HTMLImageElement> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new TypeError('Seleccioná un archivo de imagen válido.'));
  }
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Carga de imagen cancelada.', 'AbortError'));
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    let objectUrl: string;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch (error) {
      reject(error);
      return;
    }

    let image: HTMLImageElement;
    try {
      image = new Image();
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      reject(error);
      return;
    }

    let settled = false;
    const release = () => {
      if (settled) return false;
      settled = true;
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener('abort', abort);
      URL.revokeObjectURL(objectUrl);
      return true;
    };
    const abort = () => {
      if (!release()) return;
      // Se descarta la decodificación pendiente: no deben sobrevivir cargas
      // que pertenecían a una página eliminada o reemplazada.
      image.src = '';
      reject(new DOMException('Carga de imagen cancelada.', 'AbortError'));
    };
    image.onload = () => {
      if (release()) resolve(image);
    };
    image.onerror = () => {
      if (release()) reject(new Error('No se pudo abrir esta fotografía'));
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) {
      abort();
      return;
    }
    try {
      image.src = objectUrl;
    } catch (error) {
      if (release()) reject(error);
    }
  });
}
