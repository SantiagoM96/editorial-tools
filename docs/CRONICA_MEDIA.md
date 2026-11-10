# Crónica · Migración incremental de medios (PR #6)

## Alcance

Se migran a **React y TypeScript** tres interfaces antes controladas por HTML y listeners JS imperativos:

- Selector de cuatro logos (ninguno, primario, secundario y blanco)
- Input de carga de fotografía
- Slider y etiqueta de zoom (100–300 %, pasos de 5)

Los componentes `MediaControls` y `PhotoZoomControls` emiten comandos tipados mediante `media-bridge.ts` y reciben `MediaSnapshot` validado. El editor original sigue siendo **única fuente de verdad** para `selectedLogo`, `image`, `zoom`, `offsetX`, `offsetY` y los documentos del carrusel.

## Separación de responsabilidades

React **es propietario del DOM** de estos controles; no se limita a envolver el HTML. El JS heredado ya no registra listeners de clicks sobre logos ni sobre input o rango de zoom y tampoco escribe en `#photoZoom`/`#zoomLabel` o en `aria-pressed` de los logos.

El renderer Canvas continúa dibujando, recortando y exportando como antes. La decodificación de imágenes con `URL.createObjectURL` y la lógica de drag-and-drop, puntero y reencuadre permanecen por ahora en el motor heredado. El archivo `File` se comunica al motor mediante un evento DOM y **no se serializa en base64 ni se duplica en estado React**.

Para evitar trabajo innecesario durante el arrastre, el puente emite snapshots solo cuando cambia logo, porcentaje de zoom o presencia de foto. No se notifican los cambios de offset por cada movimiento de puntero.

Se conserva el patrón de layout con raíces `display: contents` y los mismos selectores/atributos de la interfaz anterior.

## Cobertura esperada

- Modelos y comandos tipados; rechazo de snapshots y porcentajes inválidos.
- Selección de logos y estado por página.
- Carga de fotografía con input, y drag-and-drop sobre el área de vista previa.
- Zoom y desplazamiento independiente por página.
- Restauración del estado al cambiar páginas y al limpiar.
- PNG 1080 × 1440 y carrusel con fotos.
- Paridad exacta del Canvas (SHA-256 de píxeles) contra el original con fotos, logos y zoom.
- Paridad visual en escritorio y móvil de los tres controles migrados.

## Dependencias y limitaciones

Este PR depende de #5 (a su vez #4, #3 y #2); no se modifica producción. No se migra todavía el renderer Canvas, la decodificación ni el exportador, y no se introducen abstracciones prematuras compartidas con BAE o Diario Show. Una próxima etapa deberá aislar la carga y gestión de fotos y las matemáticas de reencuadre como funciones reutilizables que puedan verificarse independientemente.
