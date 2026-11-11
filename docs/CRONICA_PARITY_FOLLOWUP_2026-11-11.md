# Crónica — seguimiento de paridad MLZ → Editorial Tools (2026-11-11)

## Referencias verificadas
- Origen SOLO LECTURA: `SantiagoM96/mlz`, árbol `main@ef57c6ba9204e5665b42d31cfcd076b229ef6597`, `public/cronica-dev/{index.html,js/modern-editor.js,css/modern-editor.css}`.
- Commits específicos de Andy: `e8330e9b076`, `50ba72f9c413`, `81a88ebd27d`, `e33c1e87803`.
- Destino: `SantiagoM96/editorial-tools`, rama `feat/cronica-mobile-parity-20261111` derivada de `dev@9fdea82534aa28eb3fe7dcb8407bec61606046e9`.
- PR anteriores #12 (foto), #14 (acordeones), #17 (mobile). Estos PR no constituyen prueba de paridad integral.

## Matriz de verificación
| Área | Origen Andy | Estado encontrado en dev | Acción |
| --- | --- | --- | --- |
| Fotografía | Selector de tarjeta con nombre | Ya existe React `MediaControls.tsx`, selección limpia y nombre por página | Conservar, pendiente comparación visual integral |
| Arrastrar y recortar | Drag y zoom sobre Canvas | `legacy-engine.js` + módulo de decodificación y geometría | Sin cambios de renderer |
| Paneles | Tarjetas desplegables | `CollapsiblePanel.tsx` y control de estado | Conservar, estilos globales no idénticos |
| Mobile | Vista previa/Formato | `MobileEditorTabs.tsx` y vista previa React existentes | Conservar |
| Activación de texto | Detecta tap corto y descarta scroll | Botón `cronicaTextHit` capturaba cualquier click | **Corregido**: distancia 9px/550ms, `pointercancel`, y teclado sigue permitido |
| Texto en iPhone | Al menos 16px en campos editables | Campos móviles sin garantía de 16px | **Corregido** mediante media query (375/390) |
| Tipografía | Formato, mayúsculas, alineación | Bridges y edición con selección existentes | Conservar |
| Exportaciones | PNG individual / carrusel | Servicio Canvas TypeScript y diálogo por página | Sin cambios, exige E2E |
| Comparación de layout | `modern-editor.css` y slider móvil diferenciado | Editor React usa otra composición | **Parcial**, requiere revisión editorial antes de afirmar paridad píxel a píxel |

## Decisiones
No se copió código heredado ni se alteraron las capas Canvas o el contrato de exportación. La edición contextual es una proyección del documento único en React. Se agregaron pruebas Playwright de arrastre largo, clic corto, teclado y tamaño de texto; su resultado debe validarse en CI antes del merge.

## Limitaciones y seguimiento
La igualdad completa de geometría y gestos entre navegadores reales no puede inferirse del código estático. Verificar en DEV con navegador de 1440, 390 y 375 px, exportación y comparación de capturas. No declarar concluida la paridad visual integral hasta obtener ese resultado.
