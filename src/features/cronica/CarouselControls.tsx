import { useEffect, useState } from 'react';
import { CollapsiblePanel } from './CollapsiblePanel';
import {
  currentPageLabel,
  initialCarousel,
  type CrónicaVariant,
} from './carousel-model';
import { issueCarouselCommand, subscribeToCarouselState } from './carousel-bridge';

export function CarouselControls() {
  const [carousel, setCarousel] = useState(initialCarousel);

  useEffect(() => subscribeToCarouselState(setCarousel), []);

  const changeVariant = (variant: CrónicaVariant) => {
    issueCarouselCommand({ type: 'set-variant', variant });
  };

  return (
    <>
      <CollapsiblePanel title="Páginas" className="carousel-panel">
        <div className="carousel-heading">
          <span id="pageIndicator" className="carousel-current" role="status" aria-live="polite">
            {currentPageLabel(carousel)}
          </span>
        </div>
        <div className="carousel-compact-row">
          <div
            className="carousel-pages"
            id="carouselPages"
            role="group"
            aria-label="Seleccionar página"
          >
            {carousel.pages.map((variant, index) => (
              <button
                key={index}
                type="button"
                aria-current={index === carousel.activePage ? 'page' : 'false'}
                aria-label={`Página ${index + 1}, ${variant === 'blank' ? 'sin diseño' : variant === 'cover' ? 'portada' : 'interior'}`}
                onClick={() => issueCarouselCommand({ type: 'select-page', index })}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="carousel-actions">
            <button
              type="button"
              id="addPage"
              aria-label="Agregar página interna"
              title="Agregar página interna"
              onClick={() => issueCarouselCommand({ type: 'add-page' })}
            >
              <span className="material-icons" aria-hidden="true">add</span>
            </button>
            <button
              type="button"
              id="removePage"
              className="remove-page"
              disabled={carousel.activePage === 0}
              aria-label="Eliminar página seleccionada"
              title="Eliminar página"
              onClick={() => issueCarouselCommand({ type: 'remove-page' })}
            >
              <span className="material-icons" aria-hidden="true">delete_outline</span>
            </button>
          </div>
        </div>
      </CollapsiblePanel>
      <CollapsiblePanel title="Diseño de placas" className="cronica-variant-panel">
        <div
          className="cronica-variant-options"
          role="group"
          aria-label="Diseño de la página seleccionada"
        >
          <button
            type="button"
            className="cronica-variant-option"
            data-page-variant="blank"
            aria-pressed={carousel.variant === 'blank'}
            title="Usar placa sin diseño"
            onClick={() => changeVariant('blank')}
          >
            <span className="cronica-variant-thumbnail cronica-variant-thumbnail-blank" aria-hidden="true" />
            <span>Sin diseño</span>
          </button>
          <button
            type="button"
            className="cronica-variant-option"
            data-page-variant="cover"
            aria-pressed={carousel.variant === 'cover'}
            title="Usar diseño de portada"
            onClick={() => changeVariant('cover')}
          >
            <span
              className="cronica-variant-thumbnail cronica-variant-thumbnail-cover"
              aria-hidden="true"
            />
            <span>Portada</span>
          </button>
          <button
            type="button"
            className="cronica-variant-option"
            data-page-variant="internal"
            aria-pressed={carousel.variant === 'internal'}
            title="Usar diseño interior"
            onClick={() => changeVariant('internal')}
          >
            <span
              className="cronica-variant-thumbnail cronica-variant-thumbnail-internal"
              aria-hidden="true"
            />
            <span>Interior</span>
          </button>
        </div>
      </CollapsiblePanel>
    </>
  );
}
