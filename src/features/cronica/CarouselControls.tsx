import { useEffect, useState } from 'react';
import { CollapsiblePanel } from './CollapsiblePanel';
import { currentPageLabel, initialCarousel, type CrónicaVariant } from './carousel-model';
import { issueCarouselCommand, subscribeToCarouselState } from './carousel-bridge';

const titleFor = (variant: CrónicaVariant) => variant === 'blank' ? 'Sin diseño' : variant === 'cover' ? 'Portada' : 'Interior';

function useCarousel() {
  const [carousel, setCarousel] = useState(initialCarousel);
  useEffect(() => subscribeToCarouselState(setCarousel), []);
  return carousel;
}

function PlateThumbnail({ variant }: { variant: CrónicaVariant }) {
  if (variant === 'blank') {
    return <span className="cronica-variant-thumbnail cronica-variant-thumbnail-blank" aria-hidden="true" />;
  }
  return (
    <span className={`cronica-variant-thumbnail cronica-variant-thumbnail-${variant}`} aria-hidden="true">
      <span className="cronica-variant-thumb-photo" />
      <span className="cronica-variant-thumb-textbox">
        <span className="cronica-variant-thumb-strap" />
        <span className="cronica-variant-thumb-lines"><i /><i /><i /></span>
        <span className="cronica-variant-thumb-footer" />
      </span>
    </span>
  );
}

/** Navegación fija sobre la vista previa; el store sigue siendo único. */
export function PageNavigator() {
  const carousel = useCarousel();
  return (
    <section className="cronica-preview-pages" aria-label="Diapositivas">
      <div className="carousel-heading">
        <h2>Diapositivas</h2>
        <span id="pageIndicator" className="carousel-current" role="status" aria-live="polite">
          {currentPageLabel(carousel)}
        </span>
      </div>
      <div className="carousel-compact-row">
        <div className="carousel-pages" id="carouselPages" role="group" aria-label="Seleccionar página">
          {carousel.pages.map((variant, index) => (
            <button key={index} className="carousel-page-thumb" type="button"
              data-variant={variant}
              aria-current={index === carousel.activePage ? 'page' : 'false'}
              aria-label={`Página ${index + 1}, ${titleFor(variant).toLocaleLowerCase('es-AR')}`}
              onClick={() => issueCarouselCommand({ type: 'select-page', index })}
            >
              <PlateThumbnail variant={variant} />
              <span className="carousel-page-number">{index + 1}</span>
            </button>
          ))}
          <button type="button" className="carousel-add-placeholder"
            aria-label="Agregar otra diapositiva"
            onClick={() => issueCarouselCommand({ type: 'add-page' })}>
            <span className="material-icons" aria-hidden="true">add</span>
          </button>
        </div>
        <div className="carousel-actions">
          <button type="button" id="addPage" aria-label="Agregar página interna"
            title="Agregar página interna" onClick={() => issueCarouselCommand({ type: 'add-page' })}>
            <span className="material-icons" aria-hidden="true">add</span>
          </button>
          <button type="button" id="removePage" className="remove-page"
            disabled={carousel.activePage === 0} aria-label="Eliminar página seleccionada"
            title="Eliminar página" onClick={() => issueCarouselCommand({ type: 'remove-page' })}>
            <span className="material-icons" aria-hidden="true">delete_outline</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export function VariantControls() {
  const carousel = useCarousel();
  return (
    <CollapsiblePanel title="Diseño de placas" className="cronica-variant-panel">
      <div className="cronica-variant-options" role="group" aria-label="Diseño de la página seleccionada">
        {(['blank', 'cover', 'internal'] as const).map(variant => (
          <button key={variant} type="button" className="cronica-variant-option"
            data-page-variant={variant} aria-pressed={carousel.variant === variant}
            title={`Usar ${titleFor(variant).toLocaleLowerCase('es-AR')}`}
            onClick={() => issueCarouselCommand({ type: 'set-variant', variant })}>
            <PlateThumbnail variant={variant} />
            <span>{titleFor(variant)}</span>
          </button>
        ))}
      </div>
    </CollapsiblePanel>
  );
}

/** Composición de compatibilidad para tests y consumidores previos. */
export function CarouselControls() {
  return <><PageNavigator /><VariantControls /></>;
}
