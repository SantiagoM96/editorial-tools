# Auditoría técnica — Crónica · PR #11 (10/11/2026)

## Alcance y metodología

Auditoría del código de `SantiagoM96/editorial-tools`, basada en la rama del PR #10 (`feat/cronica-carousel-png-services`). Se inspeccionaron `legacy-engine.js`, `photo-decoder.ts`, `carousel-store.ts`, `png-export-service.ts`, los controles React y el HTML/CSS de Crónica. Se agregaron pruebas unitarias y Playwright. **No se realizó un benchmark de consumo de memoria de navegador, auditoría WCAG completa ni ensayo de carga de producción.** No inferir valores de rendimiento no medidos.

## Hallazgos, impacto y tratamiento

| Prioridad | Hallazgo respaldado por código | Estado / tratamiento |
| --- | --- | --- |
| Alta | `loadPhoto` recordaba el índice en un array que puede reordenarse. Una foto que terminaba de decodificar tras eliminar, insertar o reemplazar una placa podía caer en otra página. | **Corregido:** IDs de página estables, cancelación de decodificaciones al eliminar/limpiar, y control de última solicitud por página. |
| Alta | Elegir dos fotografías seguidas para la misma placa permitía que la más lenta reemplazara a la última. | **Corregido:** `PhotoLoadCoordinator` cancela solicitudes anteriores de esa página e ignora sus resoluciones tardías. |
| Media | El decodificador revocaba `objectURL` en éxito/error, pero no tenía una forma de cancelar una decodificación aún pendiente. | **Corregido:** `AbortSignal`, limpieza de listeners y URL, y rechazo `AbortError`. |
| Media | El reencuadre ejecutaba un dibujo completo por cada `pointermove`, con medidas DOM en `updateHoverBorderGeometry`. | **Mitigado:** coalescing mediante `requestAnimationFrame`, `flush` sincrónico al soltar el puntero y cancelación de frames al exportar. Sin métrica de FPS hasta realizar benchmark real. |
| Media | No había reencuadre de foto por teclado; solo zoom y uso de puntero. | **Corregido:** Canvas enfocable con foto cargada, flechas para desplazar, Mayús para desplazamiento mayor, `aria-keyshortcuts`, ayuda y contorno de foco visible. |
| Media | `status` cambiaba dinámicamente sin anunciar todos los cambios a lector de pantalla. | **Corregido:** `role=status` y `aria-live=polite`. Se asocia la ayuda textual al input de archivo. |
| Media | Exportar múltiples placas conserva todos los PNG codificados en memoria hasta iniciar las descargas. El pico crece con el número de páginas. | **Pendiente:** medir memoria con carruseles largos y decidir estrategia de streaming/ZIP sin alterar el contrato de descargas individuales. |
| Media | No hay un límite de megapíxeles/bytes ni reducción de resolución controlada al decodificar fotos enormes. | **Pendiente:** definir límite de producto y pruebas con fotografías 12/48/100 MP; no imponer un corte arbitrario sin requisitos editoriales. |
| Baja | La UI de Crónica mantiene un motor heredado JS y componentes React en raíces separadas. | **Pendiente:** completar la migración de eventos/controladores cuando se pueda garantizar paridad. |
| Baja | La verificación automática existente no equivale a evaluación WCAG AA completa con personas y tecnologías asistivas. | **Pendiente:** auditoría con lector de pantalla (NVDA/VoiceOver), alto contraste, zoom 200/400 %, navegación integral con teclado y axe-core. |

## Controles agregados

- **Unit tests**: identidad estable al insertar/eliminar, solicitud más reciente, cancelación de recursos, ráfagas de `pointermove` en un frame y pintado final al soltar.
- **Browser tests**: reencuadre con teclado y efecto real en SHA-256 del Canvas, eliminación de página durante una carga deliberadamente lenta, foco de modal y Escape.
- **Regresión completa**: conservar los tests actuales de paridad SHA-256 frente al editor original, exportaciones PNG 1080×1440, variantes, logos y fotografías.

## Garantías y límites

No se cambió tipografía, tamaño, layout ni el orden de las capas Canvas. Las mejoras se aplican al ciclo de vida de cargas y entrada de usuarios. El render final es sincrónico cuando termina un arrastre, y la exportación cancela un frame pendiente para evitar que un hover/puntero tardío modifique el PNG.

**No integrar ni publicar:** este PR depende del #10 y los anteriores (#2–#9). Los riesgos pendientes requieren una próxima iteración con métricas objetivas y pruebas de accesibilidad de extremo a extremo.
