# Sincronización actual de Andy — Crónica, BAE y Diario Show
**Fecha:** 12 de noviembre de 2026

## Fuente y alcance
- Fuente read-only: `SantiagoM96/mlz/main` SHA `6d00bb597ff2173dcb8af69a770f2ff059048f32`.
- La migración previa del PR #28 utilizaba `52150982d790a44f3c5005248422258ab25d2935`, que ya había quedado desactualizado.
- Se integraron las versiones actuales HTML/CSS/JS de BAE y Diario Show a sus rutas reales, incluidas las novedades visuales y funcionales de los cambios 16–45 de Andy.
- La copia exacta de Crónica de Andy se actualizó en `/cronica-latest/`, con sus assets y módulos.
- Se agregó el SVG compartido del onboarding Shift + clic en `public/shared/shift-click-demo.svg`.
- Las URLs relativas del origen (`../*-dev/`, `../dev/`) y canónicas se adaptaron a `editorial-tools`, sin alterar las rutas de producción.
- Se corrigió la detección de Diario Show en `page-carousel.js` bajo `/diarioshow/` y se mantuvo el mínimo de 16px para edición iOS.

## Crónica: advertencia de alcance
La ruta principal `/cronica/` todavía emplea React 19 + TypeScript, con arquitectura tipada. No se reemplazó con el editor JavaScript histórico para aparentar una migración terminada. Por eso la *última versión completa* de Crónica está en `/cronica-latest/` hasta lograr paridad real de React; los cambios restantes no pueden darse por migrados.

## Validaciones
El workflow `ci.yml` fija el checkout `reference-latest` al SHA mencionado y compara el Canvas original contra el destino. Las pruebas de geometría recorren desktop y mobile para las tres herramientas (Crónica preview, BAE, Diario Show). El despliegue `dev` conserva producción del SHA de `main`. El badge/metadata de DEV no debe modificar imágenes exportadas.
