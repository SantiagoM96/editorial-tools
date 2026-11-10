import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CarouselControls } from './CarouselControls';
import { ContentEditor } from './ContentEditor';
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
