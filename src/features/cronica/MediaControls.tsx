import { useEffect, useState } from 'react';
import { initialMedia, type BrandLogo } from './media-model';
import { sendMediaCommand, subscribeToMedia } from './media-bridge';

const logos = [
  { id: 'none', title: 'Sin logo', text: 'Sin logo', src: null },
  { id: 'primary', title: 'Logo primario: rojo con C blanca', text: 'Primario', src: '../cronica/logos/primario.svg' },
  { id: 'secondary', title: 'Logo secundario: blanco con C roja', text: 'Secundario', src: '../cronica/logos/secundario.svg' },
  { id: 'white', title: 'Logo todo blanco', text: 'Blanco', src: '../cronica/logos/blanco.svg' },
] as const satisfies ReadonlyArray<{
  id: BrandLogo;
  title: string;
  text: string;
  src: string | null;
}>;

export function MediaControls() {
  const [media, setMedia] = useState(initialMedia);
  useEffect(() => subscribeToMedia(setMedia), []);

  return (
    <>
      <div className="control-field cronica-photo-field">
        <label htmlFor="file" className="cronica-photo-heading">Fotografía</label>
        <div className="cronica-photo-picker">
          <input
            id="file"
            className="cronica-photo-input"
            type="file"
            accept="image/*"
            aria-label="Fotografía"
            aria-describedby="cronica-photo-help"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) sendMediaCommand({ type: 'upload-photo', file });
              // Permite volver a elegir la misma fotografía.
              event.currentTarget.value = '';
            }}
          />
          <label htmlFor="file" className="cronica-photo-surface">
            <span className="material-symbols-outlined cronica-photo-icon" aria-hidden="true">
              add_photo_alternate
            </span>
            <span className="cronica-photo-copy">
              <strong>{media.hasImage ? 'Cambiar' : 'Seleccioná'}</strong>{' '}
              <span className="cronica-photo-name" title={media.photoName ?? undefined}>
                {media.hasImage && media.photoName ? media.photoName : 'una fotografía'}
              </span>
            </span>
          </label>
        </div>
        <p className="hint compact-hint" id="cronica-photo-help">
          Arrastrá la foto en la vista previa para ajustar su encuadre.
        </p>
      </div>
    </>
  );
}

export function PhotoZoomControls() {
  const [media, setMedia] = useState(initialMedia);
  useEffect(() => subscribeToMedia(setMedia), []);

  return (
    <div className="preview-zoom">
      <label htmlFor="photoZoom">Zoom</label>
      <input
        id="photoZoom"
        type="range"
        min="100"
        max="300"
        step="5"
        value={media.zoomPercent}
        aria-label="Zoom de la fotografía"
        onChange={(event) => {
          sendMediaCommand({ type: 'set-zoom', percent: Number(event.currentTarget.value) });
        }}
      />
      <output id="zoomLabel" htmlFor="photoZoom">{media.zoomPercent} %</output>
    </div>
  );
}
