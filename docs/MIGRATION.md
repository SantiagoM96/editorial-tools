# Migración selectiva — registro técnico

**Origen:** `SantiagoM96/mlz` @ `148e39cd709635eccadab61dd02191d8d5f9c6c4` (main, 2026-11-09, Argentina).

**Destino:** `SantiagoM96/editorial-tools`, rama `feat/migrate-editorial-tools`.

## Fuente funcional escogida

| Producto | Fuente única | Destino |
| --- | --- | --- |
| Dashboard | `public/dev/index.html` | `index.html` |
| Crónica | `public/cronica-dev/` | `cronica/` |
| BAE | `public/bae-dev/` | `bae/` |
| Diario Show | `public/diarioshow-dev/` | `diarioshow/` |

Se copiaron del árbol estable **solo assets compartidos** que la versión de desarrollo utiliza:

- `public/cronica/cronica-header-logo.svg` y `public/cronica/logos/*.svg`.
- `public/bae/bae-negocios-logo.svg`, `bae-negocios-logo-color.svg`, `halftone-2.svg` y `halftone-editable.svg`.

El código operativo NO se tomó de carpetas estables: no hay dos versiones del editor en este repositorio. Algunos SVG grandes se mantienen por fidelidad al render original.

## Cambios deliberados

- Se elimina el sufijo `-dev` de las rutas públicas del nuevo proyecto.
- Dashboard y enlaces de regreso ahora navegan dentro del nuevo repositorio.
- Los canonical/OG de Crónica y BAE y la URL del dashboard se adaptan al futuro subpath `/editorial-tools/`.
- No se modificaron algoritmos de composición, edición ni exportación.
- Se agrega servidor local, integridad estática, documentación y CI sin deploy.

## Exclusiones

- `src/` de `mlz`, Agenda y Jóvenes, `public/prototipos/`, herramientas municipales.
- Directorios de producción `public/dashboard/`, `public/cronica/`, `public/bae/` y `public/diarioshow/`, **excepto los assets enumerados arriba**.
- El prototipo antiguo `bae/index.html` de la raíz de `mlz`.
- Ramas anteriores, historial Git, scripts de publicación de `mlz`, configuraciones globales React/Vite/Tailwind.

## Verificaciones y límites

- CI y `npm test`: comprueban sintaxis JS, páginas principales y enlaces a archivos locales.
- Pendiente: comparación visual automatizada, interacción completa, carga de imágenes, manipulación de preview, PNG, carruseles, comportamiento móvil.
- La importación de URLs en BAE y Diario Show utiliza proxies externos públicos en el código original: **requiere revisión de seguridad, privacidad, disponibilidad y CORS** antes de declararla apta para producción.
- No se ejecutó un despliegue de producción ni se hizo merge.

## Lista manual para QA

1. Desde dashboard, abrir cada herramienta y volver.
2. Elegir variantes, manipular imágenes y textos, probar zoom y arrastre.
3. Validar tamaños y calidad de PNG (Crónica: página individual y carrusel completo).
4. Comparar desktop y mobile con la fuente `-dev`.
5. Verificar importación desde URL para BAE y Diario Show, incluyendo errores CORS.
6. Validar keyboard focus, accesibilidad y errores en consola.

**Advertencia:** esta migración conserva comportamiento existente como base de comparación; no es todavía una reescritura profesional ni certifica equivalencia funcional.
