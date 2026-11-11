# Diario Show · Sincronización funcional completa con MLZ DEV

Se detectó que el editor de destino seguía utilizando un motor estático de una versión anterior, sin capacidades de **fotografía compartida con dos recortes independientes**, nueva composición de tarjetas, control de ubicación del logo, módulos contextuales de preview y navegación de marcas. El onboarding aislado de siete pasos se había incorporado antes, pero ese shell ya no exponía algunos controles de la referencia.

A diferencia de Crónica (React + bridges) y BAE (shell modular), Diario Show **todavía no tiene motor React**: se restauraron de la rama `mlz` los archivos del editor estático como una unidad funcional inseparable: `index.html`, `editor.js`, `importer.js`, `editor.css`, `onboarding.js` y `onboarding.css`, con URLs y metadata normalizadas para Editorial Tools. No se modificó `mlz`.

**Paridad controlada:** el workflow de navegador conserva el origen histórico para Crónica/BAE y agrega `reference-latest` fijado en MLZ commit `ef57c6ba9204e5665b42d31cfcd076b229ef6597` solo para Diario Show. El test compara el SHA-256 del Canvas actual contra el producto DEV de ese commit; nunca se ignora una diferencia de imagen.

**QA adicional:** selección de dos fotografías, zoom por lado, exportación PNG 1080×1440, variante de cita y recorrido contextual de siete pasos en desktop/mobile. Mantener el editor JS como módulo legado está documentado; su futura extracción a servicios no debe sacrificar paridad funcional.
