# Arquitectura de Editorial Tools

## Estado real de modernización
- Dashboard: React 19 + TypeScript strict, Vite y Tailwind CSS v4.
- Crónica: controles React y módulos modernos integrados con su motor gráfico Canvas existente.
- BAE y Diario Show: editores HTML/CSS/JavaScript progresivamente modernizados en UI, sin migración ficticia a React.
- `src/domain/`: catálogo de productos y contratos tipados.
- `src/features/dashboard/`: componentes, pruebas unitarias y dashboard.
- `src/features/cronica/`: componentes y motor de Crónica.
- `public/`: recursos, editores legados, logotipos, texturas y tipografías.
- `scripts/`: verificaciones, compilaciones Pages y servidor de QA.
- `tests/e2e/`: navegación, Canvas, PNG, mobile y paridad visual.

## Aislamiento de ambientes
- `main` → `/editorial-tools/` (PROD); `dev` → `/editorial-tools/dev/` (DEV).
- Vite toma `EDITORIAL_BASE` por build. Los enlaces locales y recursos heredados mantienen sus rutas relativas.
- `scripts/prepare-pages.mjs` inyecta metadatos y la identificación visual **sólo** en HTML de DEV, no en Canvas ni exportaciones.
- `scripts/validate-pages.mjs` falla ante assets ausentes, base incorrecta o contaminación entre ambientes.
- `scripts/compose-pages.mjs` ensambla dos builds ya validados, preservando su commit de origen.
- `.github/workflows/pages.yml` serializa las publicaciones y vuelve a compilar las dos ramas en cada disparo.

## Compatibilidad y calidad
- Mantener CSS existente sin habilitar Preflight global ni rediseñar módulos.
- Mantener exportaciones PNG, capas Canvas, importadores, fotografías, zoom y edición mobile.
- Las pruebas originales de paridad siguen vigentes. En el dashboard se compara pixel-perfect el área de tarjetas, excluyendo sólo copys y aviso de ambiente aprobados.
- Los PRs a `dev` y `main` corren CI. El workflow de Pages agrega smoke tests del artefacto final con las rutas reales DEV/PROD.
- El despliegue de Pages es único por repositorio; no crear despliegues parciales.

Véase [operación DEV/PROD](ENVIRONMENTS.md) y [AGENTS.md](../AGENTS.md).
