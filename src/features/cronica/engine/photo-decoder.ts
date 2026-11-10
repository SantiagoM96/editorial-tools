/** Servicio de decodificación separado del Canvas y de React. */
export function decodePhotoFile(file: File): Promise<HTMLImageElement> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new TypeError('Seleccioná un archivo de imagen válido.'));
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

    const release = () => {
      image.onload = null;
      image.onerror = null;
      URL.revokeObjectURL(objectUrl);
    };
    image.onload = () => {
      release();
      resolve(image);
    };
    image.onerror = () => {
      release();
      reject(new Error('No se pudo abrir esta fotografía'));
    };
    try {
      image.src = objectUrl;
    } catch (error) {
      release();
      reject(error);
    }
  });
}
