# Crónica · Extracción del documento y del layout editorial (PR #8)

## Contexto

Continuación incremental sobre PR #7; este PR no toca `main`, GitHub Pages ni los generadores BAE/Diario Show.

Antes de esta etapa, `legacy-engine.js` definía los textos de ejemplo, los defaults por página, el parser de marcas, el cálculo de salto de líneas y las coordenadas de composición dentro de una sola función de render.

## Responsabilidades extraídas

**`document-model.ts`** define el modelo explícito de página (contenido, variante, alineación, logo, foto, zoom, offsets), las fábricas independientes de portada e interior, el snapshot que conserva la imagen por referencia y la política actual de limpiar por página. La fuente de verdad durante la edición continúa en el estado del motor y no se duplica en React.

**`editorial-layout.ts`** implementa el parser de `*`, `_` y `~`, cálculo de líneas, medición de fragmentos, reducción de tipografía para textos largos, posiciones del panel, baseline, volanta y límites del recorte. Estas funciones no requieren HTML, React ni contexto Canvas.

La medición del texto se inyecta desde `legacy-engine.js` mediante una función adaptadora que sigue usando `CanvasRenderingContext2D.measureText`, con las fuentes y el orden de cálculo originales. El motor sigue ejecutando los comandos reales de dibujo (fillRect, fillText, drawImage, líneas, pie editorial) y el exportador PNG, sin cambiar identidad gráfica.

## Equivalencia

- Tests unitarios del parser, formatos, ajuste de renglones, cálculo de panel, defaults de página, limpieza y referencias a fotografías.
- Las pruebas de navegador existentes de **Crónica, BAE y Diario Show** siguen siendo obligatorias.
- Regresión nueva con titulares largos, palabras que fuerzan ajuste, marcas de destacado/cursiva/tachado, portada e interior, y comparación SHA-256 de los píxeles Canvas contra el editor original.
- Se mantienen exportaciones 1080 × 1440 y test de PNG por carrusel.

## Criterio de arquitectura

Este cambio separa **modelo → cálculo de layout → comandos Canvas** sin reescribir simultáneamente el renderer. Las reglas de layout son específicas de Crónica: no se crea un renderer genérico ni se presume que BAE o Diario Show utilizan las mismas reglas.

## Próximos pasos

Migrar comandos de dibujo por capas a módulos testeables (fotografía, textos, volanta, identidad, pie), introducir un tipo de escena editorial solo si reduce complejidad real, y cubrir exportaciones bajo condiciones de fotos grandes y texto extremo. No limpiar legacy indiscriminadamente sin cobertura de regresión.
