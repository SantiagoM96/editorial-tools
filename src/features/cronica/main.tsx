import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CarouselControls } from './CarouselControls';
import './controls.css';

const mount = document.getElementById('cronica-controls-root');
if (!mount) throw new Error('No se encontró el contenedor de controles de Crónica.');

createRoot(mount).render(
  <StrictMode>
    <CarouselControls />
  </StrictMode>,
);
