# BAE · migración selectiva del selector de fotografía · 2026-11-11

## Origen y decisión

- Referencia: `SantiagoM96/mlz`, `public/bae-dev/js/modern-editor.js` y `public/bae-dev/css/modern-editor.css`, observados en `main` `86bdf8600b81dd82c3ca3529091061452d97ab56`.
- Commits relacionados: `1957b9ec39` (selector con tarjeta), `9763ed945b` (persistencia de nombre) y `8d37b75ba1` (consolidación visual).
- Destino: `SantiagoM96/editorial-tools`, `public/bae/` desde `main` `d35ff426ef7a3a92dbc71b2b7fb76564aec72774`.
- El editor BAE de destino sigue siendo JavaScript autónomo. **No** se copia `modern-editor.js`, **no** se agrega React y **no** se duplica la lógica de Canvas.

## Diferencia verificada y tratamiento

| Diferencia MLZ / Editorial Tools | Decisión |
| --- | --- |
| MLZ: tarjeta con icono para carga; destino: input file nativo visible | Adaptar HTML semántico y CSS de tarjeta, manteniendo el input real `#file` |
| MLZ: acción `Seleccioná` / `Cambiar` y nombre visible | Actualizar la tarjeta **solo después de que la imagen cargue correctamente** |
| Importación de noticia por URL ya existente en destino | Mantener `BAEEditor.setImage`; indicar `Fotografía importada` cuando no hay nombre local |
| Acción Limpiar existente | Restaurar estado `Seleccioná una fotografía` al limpiar |
| Shell de acordeones, controles mobile y nuevos sliders de MLZ | No incluidos; requieren PRs separados y QA de comportamiento/Canvas |

## Implementación y contratos preservados

- `public/bae/index.html`: input `#file` y label clickable; mantiene la ayuda contextual.
- `public/bae/css/editor.css`: tarjeta visual independiente, truncado de nombre, foco visible y `prefers-reduced-motion`.
- `public/bae/js/editor.js`: función corta `updatePhotoPicker` conectada a carga local exitosa, importación de imagen y limpieza. No se cambia el motor de dibujo.
- `tests/e2e/editorial.spec.mjs`: selección nativa, nombre, limpieza y exportación PNG 1080×1440.

**Riesgos conocidos no abordados:** el código heredado de carga de imágenes de BAE todavía requiere una revisión independiente de concurrencia y cancelación; la importación remota depende de servicios externos y CORS. No se declara seguridad ni paridad pixel-perfect a partir de esta migración.

## Validaciones

El PR debe pasar `npm run check` y `npm run test:e2e` en GitHub Actions. Registrar resultados del CI antes de integrar. Pendiente revisión visual manual frente a `bae-dev` en escritorio/mobile, porque el shell general de destino aún es distinto.

No modificar `mlz`, no hacer merge automático y no desplegar.
