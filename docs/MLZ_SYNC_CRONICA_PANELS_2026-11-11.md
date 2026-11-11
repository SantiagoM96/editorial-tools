# Crónica · Paneles plegables nativos (2026-11-11)

## Dependencia y alcance
PR apilado sobre #12 (selector fotográfico), pendiente de revisión visual. El destino es `editorial-tools`; `mlz` funciona solo como referencia de diseño/UX.

Se incorpora el comportamiento de tarjetas/áreas plegables observado en `public/cronica-dev/js/modern-editor.js` de MLZ. Las áreas Páginas, Diseño de placas, Diseño de la placa y Textos se implementan mediante un componente React compartido; no se copian ni ejecutan manipuladores de DOM del editor de origen.

## Contrato técnico
- Se usa un `button` nativo con `aria-expanded` y `aria-controls`, identificador generado por React y foco visible.
- Los controles **permanecen montados** al cerrar: no se descartan imágenes, edición, selección de páginas ni event listeners de los bridges.
- El estado de expansión es local de presentación. No se duplica el documento editorial, el renderer Canvas ni los servicios de exportación.
- Los controles de contenido y fotografía mantienen sus IDs y eventos existentes; se mantiene el tamaño de campos y la geometría interna en lo posible.
- Separación intencional de Diseño y Textos: las distancias verticales globales cambian frente al snapshot histórico; el test registra explícitamente esta diferencia y conserva las verificaciones de campos y PNG.

## Pruebas
- Vitest valida relación `aria-controls`, transición de expansión y persistencia de estado de un campo al reabrir.
- Playwright valida plegado y reexpansión de los cuatro paneles a 390 px, edición y cambio de página sin pérdida de texto.
- No se modifican las verificaciones de Canvas/PNG. La ejecución CI de este PR debe revisarse antes de afirmar aprobación.

## Trabajo pendiente
- Layout mobile Vista previa/Formato, controles en pantalla sobre el preview y zoom vertical en PR independiente.
- Auditoría visual manual de la composición completa frente a MLZ DEV.
- BAE y Diario Show continúan con migraciones propias. No merge ni despliegue.
