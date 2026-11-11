# BAE Negocios — seguimiento de paridad MLZ → Editorial Tools (2026-11-11)

## Referencias verificadas
- Origen SOLO LECTURA: `SantiagoM96/mlz`, árbol `main@ef57c6ba9204e5665b42d31cfcd076b229ef6597`, `public/bae-dev/{index.html,js/modern-editor.js,css/modern-editor.css}`.
- Últimos commits de Andy para el editor: `8d37b75ba14`, `0aedccc664`, `508fc380736`, `813767bea166`.
- Destino: `SantiagoM96/editorial-tools`, `feat/bae-mobile-parity-20261111` derivada de `dev@9fdea82534aa28eb3fe7dcb8407bec61606046e9`.
- PR #13 (foto) y #16 (paneles/móvil) ya integrados, pero no cubren necesariamente todos los cambios tardíos de Andy.

## Matriz de verificación
| Área | Origen Andy | Estado en dev al auditar | Acción |
| --- | --- | --- | --- |
| Fotografías | Tarjeta con nombre de archivo y cambio | Ya implementada en `index.html`, `editor.js` (`updatePhotoPicker`) | Conservar |
| Importación BAE | URL y fotografía de noticia | `importer.js` existente | Sin cambios; validar con fuentes disponibles |
| Zoom y drag | Arrastre/slider en Canvas | `editor.js` y proyección slider en shell | Sin cambios de renderer |
| Paneles | Acordeones por sección | `mobile-shell.js` y `mobile-shell.css` | Afinado fondo/cuerpo según referencia |
| Mobile | Tabs Vista previa/Formato | Ya funcionan con estado del editor | Conservar |
| Formato en preview | Marcadores y mayúsculas, limpiar formato | Faltaban mayúsculas y quitar formato en editor breve | **Corregido**, sin duplicar estado de texto |
| Edición contextual | El tap no debe reaccionar al scroll | `.bae-text-hit` reaccionaba al click sin umbral | **Corregido**: 9 px/550 ms y teclado |
| iPhone | Tamaños editables de 16px | Campos mobile podían causar zoom del viewport | **Corregido** |
| Colores, logo, texturas y halftone | Controles separados | Ya están en `editor.js` | Conservar, diferencias visuales pendientes |
| PNG | 1080 × 1440 | Renderer existente con `canvas.toBlob` | Sin cambios, exige E2E |
| Look and feel | `modern-editor.css` de MLZ | CSS propio con distinta distribución | **Parcial**, no certificar igualdad total |

## Arquitectura
Los cambios se limitan al shell y la interfaz (no al renderizado). El título y sus comandos continúan modificando los campos canónicos que consume `BAEEditor`. No se cargó `modern-editor.js` del repositorio MLZ ni se tocó Diario Show.

## QA pendiente de resultado
Playwright prueba mayúsculas, sincronización, limpieza del formato, scroll vs tap y tamaño de fuente a 375px. Consultar el resultado de CI y la publicación pública antes de confirmar éxito. La comparación visual integral en 1440/390/375px requiere capturas de ambas implementaciones.
