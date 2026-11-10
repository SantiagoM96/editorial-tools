// El motor heredado es un módulo de Vite; las APIs de fotografía son imports
// verificables, sin exponer servicios globales ni duplicar fórmulas.
import './engine/legacy-engine.js';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CarouselControls } from './CarouselControls';
import { ContentEditor } from './ContentEditor';
import { MediaControls, PhotoZoomControls } from './MediaControls';
import './controls.css';

const mount = document.getElementById('cronica-controls-root');
if (!mount) throw new Error('No se encontró el contenedor de controles de Crónica.');

createRoot(mount).render(
  <StrictMode>
    <CarouselControls />
  </StrictMode>,
);

const contentMount = document.getElementById('cronica-content-root');
if (!contentMount) throw new Error('No se encontró el contenedor de contenido de Crónica.');

createRoot(contentMount).render(
  <StrictMode>
    <ContentEditor />
  </StrictMode>,
);

const mediaMount = document.getElementById('cronica-media-root');
if (!mediaMount) throw new Error('No se encontró el contenedor de medios de Crónica.');

createRoot(mediaMount).render(
  <StrictMode>
    <MediaControls />
  </StrictMode>,
);

const zoomMount = document.getElementById('cronica-photo-zoom-root');
if (!zoomMount) throw new Error('No se encontró el contenedor de zoom de Crónica.');

createRoot(zoomMount).render(
  <StrictMode>
    <PhotoZoomControls />
  </StrictMode>,
);
