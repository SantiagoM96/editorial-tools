import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CarouselControls } from './CarouselControls';
import { TypographyControls } from './TypographyControls';
import './controls.css';

const mount = document.getElementById('cronica-controls-root');
if (!mount) throw new Error('No se encontró el contenedor de controles de Crónica.');

createRoot(mount).render(
  <StrictMode>
    <CarouselControls />
  </StrictMode>,
);

const typographyMount = document.getElementById('cronica-typography-root');
if (!typographyMount) throw new Error('No se encontró el contenedor de tipografía de Crónica.');

createRoot(typographyMount).render(
  <StrictMode>
    <TypographyControls />
  </StrictMode>,
);
