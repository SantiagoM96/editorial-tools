# Sincronización Editorial Tools ← MLZ (12 de noviembre de 2026)

## Alcance y trazabilidad

- **Fuente de referencia, solo lectura:** `SantiagoM96/mlz/main`, commit `52150982d790a44f3c5005248422258ab25d2935`.
- **Destino autorizado:** `SantiagoM96/editorial-tools`, rama de integración `feat/sync-andy-mlz-dev-20261112` → `dev`.
- **Nunca modificar:** `SantiagoM96/mlz`, `SantiagoM96/mlz-muni`, `editorial-tools/main`, datos o credenciales.
- **Publicación:** CI completo previo a integrar. DEV se publica automáticamente tras la fusión, manteniendo la versión de PROD basada exclusivamente en main.

## BAE Negocios

Portados los cambios de `public/bae-dev` al editor real en `public/bae`:
- Diseño visual de paneles, controles y tooltips, desktop y mobile
- Editor enriquecido del titular (vista visual sincronizada con el estado del Canvas)
- Navegador multipágina: agregar, borrar, seleccionar y reordenar desplazamiento de miniaturas
- Variantes incluyendo «Sin diseño», páginas con estado independiente y exportación individual o completa
- Miniaturas sincronizadas y arreglos de foco, scroll y responsive
- Onboarding contextual de la versión de Andy
- Importador de artículos y recursos existentes preservados

## Diario Show

Portados los cambios de `public/diarioshow-dev` a `public/diarioshow`:
- Paginador multipágina, descarga individual / múltiple, «Sin diseño», miniaturas sincronizadas
- Editor visual del titular y controles de fotografía
- Diseño de placas, estilos de firma inferior y selección de variantes
- Onboarding actualizado con el nuevo paso de organización de diapositivas
- Mejoras mobile, accesibilidad y ayudas contextuales
- Importador y recursos gráficos conservados

## Crónica

El editor principal `/cronica/` está desarrollado en React + TypeScript, con estado tipado y renderizado Canvas en servicios desacoplados. **No se sustituye ese código por JavaScript legado.**

Se adaptaron al React existente:
- Variante nueva «Sin diseño» con snapshot tipado, Canvas neutro y controles condicionales
- Volantas 30 % más altas y textos de muestra actualizados
- Navegador horizontal de miniaturas de páginas, ubicado encima de vista previa
- Miniaturas de Portada, Interior y Sin diseño; navegación por estados del store
- Tests de modelo y funcionalidad adaptados a contratos actuales

La versión **íntegra y más reciente de Andy en Crónica** se conserva además como preview independiente de solo desarrollo en `/editorial-tools/dev/cronica-latest/` (archivos de `mlz/public/cronica-dev` del commit indicado). Esa preview mantiene la edición enriquecida, los tooltips, el onboarding y los detalles de interfaz tal cual fueron creados por Andy.

**Deuda de paridad declarada:** el editor React principal todavía no reproduce íntegramente el editor visual enriquecido y los contextos específicos de la versión `cronica-latest`. La preview es la referencia funcional para terminar esa adaptación sin sacrificar la arquitectura.

## Verificaciones

- Tests unitarios TypeScript/Vitest, lint y compilación Pages
- Playwright desktop y mobile para las tres herramientas
- Los antiguos tests de igualdad pixel-perfect contra un commit de `mlz` previo a los cambios visuales dejan de ser comparaciones válidas para Crónica: reemplazados por tests de Canvas reproducible, estados, dimensiones, controles y PNG
- La paridad binaria con la referencia anterior se conserva para BAE y Diario Show donde aplica
- Verificar el commit exacto desplegado en `/editorial-tools/dev/editorial-deployment.json` y que PROD conserva su SHA

## URLs DEV

- Dashboard: https://santiagom96.github.io/editorial-tools/dev/
- Crónica React: https://santiagom96.github.io/editorial-tools/dev/cronica/
- Crónica Andy (última referencia funcional): https://santiagom96.github.io/editorial-tools/dev/cronica-latest/
- BAE: https://santiagom96.github.io/editorial-tools/dev/bae/
- Diario Show: https://santiagom96.github.io/editorial-tools/dev/diarioshow/
