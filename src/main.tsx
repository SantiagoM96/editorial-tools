import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './features/dashboard/Dashboard';
import './styles/dashboard.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el nodo raíz para montar Editorial Tools.');
}

createRoot(rootElement).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>,
);
