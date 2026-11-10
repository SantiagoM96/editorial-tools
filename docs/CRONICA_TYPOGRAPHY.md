# Crónica · Etapa de tipografía y formato (PR apilado sobre #3)

## Alcance implementado

La barra de formato y los botones de alineación de Crónica dejan de ser DOM imperativo y pasan a un componente **React + TypeScript**. El editor heredado conserva la única fuente de verdad para documentos, texto activo, selección, páginas, imágenes, Canvas y exportación.

Se migran:
- Destacar selección, cursiva, tachado y quitar formato.
- Mayúsculas de visualización, sin alterar el texto fuente.
- Alineación izquierda/centro por página.
- Indicadores accesibles `aria-pressed` y ayuda contextual.

## Separación real de responsabilidades

`typography-model.ts` implementa las transformaciones de selección como funciones puras con contratos verificables. `TypographyControls.tsx` gestiona el DOM de esos controles y aplica la transformación al textarea existente. Se emite `input` después de editar para reutilizar el renderizador del Canvas.

`typography-bridge.ts` transmite comandos de mayúsculas y alineación; el editor original despacha snapshots validados cuando cambia de página, se restablece un documento o cambia la configuración. El modelo editorial completo **todavía no se ha trasladado**. Este puente es una transición controlada, no la arquitectura final.

## Garantías

- Los identificadores, clases y textos originales de botones se conservan.
- Sin migrar ni alterar BAE Negocios ni Diario Show.
- Sin reescribir el motor Canvas ni la descarga de PNG.
- PR apilado sobre #3, que depende del #2. No actualizar producción ni integrar ramas sin autorización.
- Las pruebas deben cubrir texto seleccionado, operaciones puras, estado por página, capturas de UI escritorio/móvil y paridad de Canvas después de editar.

## Próximo trabajo

Migrar progresivamente encabezado, volanta y tamaño de tipografía para abandonar la lectura directa del DOM en renderizado. Una vez que la edición tenga un contrato completo y tests, extraer el modelo y las funciones de composición a módulos independientes. Revisar también carga de fotos, restricciones de tamaño y drag-and-drop con pruebas específicas.
