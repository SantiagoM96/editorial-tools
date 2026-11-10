# Crónica — Carrusel y exportación PNG desacoplados (PR #10)

## Alcance real

Este PR continúa la serie #2 → #9 sin integrar ninguna rama. Se migran dos responsabilidades que seguían juntas en `legacy-engine.js`, sin cambiar los componentes React ni las reglas visuales.

### 1. Estado del carrusel: `EditorialCarouselStore`

`src/features/cronica/engine/carousel-store.ts` centraliza las páginas guardadas y el índice activo. Implementa:

- Snapshot para los controles React (`pages`, `activePage`, `variant`).
- Guardado de la placa activa antes de cambiar de página.
- Inserción después de la página seleccionada, eliminación de interiores y preservación de portada.
- Cambio de variante sin descartar el contenido editado.
- Visita temporal de páginas durante exportación sin guardar de nuevo un estado intermedio.
- Acceso a la referencia `HTMLImageElement` de cada página, sin clonar buffers.

El editor heredado mantiene únicamente una **proyección de los campos de la placa activa** para dibujar el Canvas. La colección de documentos y su índice activo existen únicamente en el store; no se duplican en React.

### 2. Servicio de PNG: `PngExportService`

`src/features/cronica/engine/png-export-service.ts` encapsula:

- Marca de tiempo local monotónica y nombres `Cronica-pagina-NN_YYYY-MM-DD_HH-mm-ss.png`.
- Espera de fuentes y logos mediante dependencias inyectadas.
- Recorrido de las páginas por orden y `render(false)` para evitar exportar el overlay de hover.
- Generación de todos los `Blob` **antes** de iniciar las descargas múltiples.
- Descarga de cada PNG individual y revocación diferida de `objectURL` a los 30 segundos.
- Restauración de la página seleccionada original en un bloque `finally`, incluso si falla el encoder o la carga de recursos.

El modal, los mensajes de estado y la habilitación/deshabilitación de controles siguen a cargo del motor de UI existente. El servicio no necesita conocer el DOM de esos controles, la estructura de páginas ni cómo se dibuja una placa.

### Validación y regresión

Las pruebas unitarias comprueban selección/inserción/eliminación, guardado de variaciones y fotos, timestamps monotónicos, nombres de archivo, preparación completa antes de descargar, y recuperación ante errores. Las pruebas Playwright cubren exportación de tres páginas desde una página intermedia, tamaños PNG 1080 × 1440, fallos de `canvas.toBlob`, controles desbloqueados y dos exportaciones individuales con nombres distintos.

Permanecen obligatorias las pruebas existentes de paridad exacta del Canvas frente a la versión original, imágenes y zoom, layouts, controles React, variantes y los editores BAE/Diario Show.

### No incluido

No se cambia el motor de composición de Crónica ni las matemáticas de imagen. Tampoco se abstrae aún la exportación de las otras marcas. No se hace merge ni despliegue a producción.

### Próxima etapa sugerida

Auditar integridad y rendimiento: imágenes de gran tamaño, liberación de referencias de fotos cuando se eliminan placas, fallos de descarga y sincronización de datos durante exportaciones largas. La arquitectura nueva permite probar esos problemas por separado.
