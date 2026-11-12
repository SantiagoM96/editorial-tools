// El motor heredado es un módulo de Vite; las APIs de fotografía son imports
// verificables, sin exponer servicios globales ni duplicar fórmulas.
import './engine/legacy-engine.js';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PageNavigator, VariantControls } from './CarouselControls';
import { CollapsiblePanel } from './CollapsiblePanel';
import { MobileEditorTabs } from './MobileEditorTabs';
import { MobilePreviewTextEditor } from './MobilePreviewTextEditor';
import { ContentEditor } from './ContentEditor';
import { MediaControls, PhotoZoomControls } from './MediaControls';
import './controls.css';

const mount = document.getElementById('cronica-controls-root');
if (!mount) throw new Error('No se encontró el contenedor de controles de Crónica.');

createRoot(mount).render(
  <StrictMode>
    <VariantControls />
  </StrictMode>,
);

const contentMount = document.getElementById('cronica-content-root');
if (!contentMount) throw new Error('No se encontró el contenedor de contenido de Crónica.');

createRoot(contentMount).render(
  <StrictMode>
    <CollapsiblePanel title="Textos" className="cronica-text-panel">
      <ContentEditor />
    </CollapsiblePanel>
  </StrictMode>,
);

const mediaMount = document.getElementById('cronica-media-root');
if (!mediaMount) throw new Error('No se encontró el contenedor de medios de Crónica.');

createRoot(mediaMount).render(
  <StrictMode>
    <CollapsiblePanel title="Diseño de la placa" className="cronica-media-panel">
      <MediaControls />
    </CollapsiblePanel>
  </StrictMode>,
);

const zoomMount = document.getElementById('cronica-photo-zoom-root');
if (!zoomMount) throw new Error('No se encontró el contenedor de zoom de Crónica.');

createRoot(zoomMount).render(
  <StrictMode>
    <PhotoZoomControls />
  </StrictMode>,
);

const tabsRoot = document.getElementById('cronica-mobile-tabs-root');
if (!tabsRoot) throw new Error('Falta navegación móvil de Crónica.');
createRoot(tabsRoot).render(<StrictMode><MobileEditorTabs /></StrictMode>);

const previewTextRoot = document.getElementById('cronica-preview-text-root');
if (!previewTextRoot) throw new Error('Falta editor rápido móvil de Crónica.');
createRoot(previewTextRoot).render(<StrictMode><MobilePreviewTextEditor /></StrictMode>);

const pageNavigationMount = document.getElementById('cronica-pages-root');
if (!pageNavigationMount) throw new Error('Falta el navegador de páginas sobre vista previa.');
createRoot(pageNavigationMount).render(<StrictMode><PageNavigator /></StrictMode>);
