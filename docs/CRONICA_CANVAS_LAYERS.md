# Crónica · Composición Canvas por capas (PR #9)

## Objetivo

Desacoplar los comandos concretos de dibujo del motor heredado sin modificar el orden de composición, los contratos de usuario ni los píxeles de salida.

## Diseño implementado

Cada capa recibe explícitamente `CanvasRenderingContext2D` y las propiedades que necesita; ninguna depende del DOM, de React o de variables globales del editor:

- `layers/photo-layer.ts`: fondo de foto, recorte, clip, `drawImage`, hover e información de offsets limitados. Utiliza el módulo previo `photo-geometry.ts`.
- `layers/logo-layer.ts`: selección de imagen cargada y ubicación de identidad.
- `layers/surface-layer.ts`: fondo de la placa, panel blanco y la línea roja de 13px.
- `layers/strap-layer.ts`: bloque de volanta, ajuste por `measureText`, color, y baseline.
- `layers/headline-layer.ts`: texto rico, alineación, colores, cursiva, tachado y baselines. Utiliza `editorial-layout.ts`.
- `layers/footer-layer.ts`: dominio y flecha de portada.
- `canvas-tokens.ts`: únicamente los colores históricos de Crónica.

`legacy-engine.js` **deja de ejecutar los comandos `fillText`, `drawImage`, `fillRect`, `save`/`restore` de esas capas**, y coordina su secuencia original:

1. Preparar fondo blanco
2. Fotografía y reencuadre
3. Logo
4. Panel blanco y línea roja
5. Volanta (si corresponde)
6. Titulares
7. Pie (solo portada)

Los offsets devueltos por la capa de fotografía se sincronizan con el documento existente para preservar el comportamiento anterior de zoom y arrastre. Ninguna capa administra eventos, páginas, archivos ni exportaciones.

## QA

- Vitest: contratos aislados con un contexto Canvas simulado, verificando coordenadas, texto, fuentes, trazos, clips y tamaños.
- Playwright: comparación **SHA-256 exacta** del contenido de píxeles del Canvas frente al origen, con fotografía sintética, logos, mayúsculas, marcas, dos páginas y zoom.
- Mantener los tests existentes de exportación PNG 1080×1440, drag-and-drop, carousel y paridad visual de BAE y Diario Show.
- TypeScript strict, ESLint, Vite multipágina y validación de rutas Pages.

## Fuera del alcance

No se migra todavía la gestión de páginas y exportación del motor heredado. No se propone un motor gráfico genérico para otras marcas antes de detectar reglas realmente compartidas. No hacer merge ni publicar sin aprobación; este PR se basa en #8.
