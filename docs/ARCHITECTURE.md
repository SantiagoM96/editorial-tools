# Arquitectura · Fase 1 (fundamentos)

## Decisión principal
El dashboard pasa a React + TypeScript estrictamente tipado, Vite y Tailwind CSS v4. Las tres herramientas gráficas continúan siendo **documentos HTML/CSS/JS aislados** dentro de `public/`, publicados sin recompilación. No se fusionan motores Canvas ni se cambia su comportamiento.

## Carpetas

- `src/domain/`: contratos y catálogo tipado de productos editoriales.
- `src/features/dashboard/`: componentes y pruebas unitarias del dashboard.
- `src/styles/dashboard.css`: Tailwind v4 sin Preflight + CSS original del dashboard, conservado para paridad.
- `public/cronica/`, `public/bae/`, `public/diarioshow/`: herramientas heredadas autónomas.
- `public/og-image.png`: recurso social de la portada.
- `tests/e2e/`: navegación, renderizado Canvas, PNG, carruseles, móvil y paridad con origen.
- `scripts/`: validaciones estáticas, builder del artefacto Pages y servidor de referencia.
- `dist/`: resultado Vite; `dist-pages/`: entrega GitHub Pages, ambos ignorados.

## Compromisos de compatibilidad

1. El Vite dev server usa la raíz `/`; el artefacto de producción usa `/editorial-tools/`.
2. `public/` se copia sin transformaciones y conserva las rutas de los generadores.
3. Se mantiene la CSS original del dashboard en una hoja exclusiva, sin Preflight, para evitar desajustes de píxeles. Tailwind se incorpora con tokens para futuros componentes, **sin forzar refactors visuales en esta fase**.
4. El sitio de GitHub Pages solo se actualiza tras un merge autorizado a `main`; el PR no activa despliegues.
5. Crónica, BAE y Diario Show mantienen los archivos JS originales; no se realiza una migración ficticia a TypeScript.

## Condiciones para el siguiente PR

- Modelar el documento editorial y sus variantes, partiendo de Crónica.
- Tests sobre cada edición, imagen y exportación antes de reemplazar componentes o Canvas.
- Desacoplar lógica gráfica de React, sin imponer un renderer común prematuramente.
- Revisar seguridad de importación mediante URL antes de migrar los importadores.
- Mantener el mismo control de paridad con los artefactos fijados del origen.

## Calidad
`npm run check` ejecuta typecheck, ESLint, unit tests, integridad estática y producción. `npm run test:e2e` corre Playwright; los tests de paridad del origen se habilitan en CI con un checkout inmutable.
