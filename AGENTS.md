# Reglas para asistentes de programación · Editorial Tools

## Alcance obligatorio
- **Único repositorio autorizado:** `SantiagoM96/editorial-tools`.
- **Prohibido modificar, commitear, desplegar o abrir PR en:** `SantiagoM96/mlz` y `SantiagoM96/mlz-muni`.
- No trasladar implementaciones ajenas ni efectuar refactors de Canvas fuera del alcance aprobado.
- Mantener React 19, TypeScript strict, Vite, Tailwind CSS v4, módulos existentes y compatibilidad de los editores legados.

## Ramas y aprobaciones
- `main` es PROD: solo se modifica con PR de promoción aprobado o infraestructura expresamente autorizada.
- `dev` es DEV: el equipo revisa allí los cambios antes de promoverlos a PROD.
- Los cambios de Andy salen de `feat/*` **derivadas de `dev`**, pasan por PR a `dev` y pruebas antes del merge.
- Jamás fusionar cambios funcionales de Andy desde `dev` a `main` sin aprobación.
- No reescribir historia de `main` ni `dev` y no hacer force-push.
- Antes de promover, inspeccionar el diff `dev...main` y revisar las pruebas y la aprobación editorial.

## GitHub Pages
- Una sola publicación contiene dos builds *independientes*: `main` → `/editorial-tools/` y `dev` → `/editorial-tools/dev/`.
- `.github/workflows/dev-publish.yml` sólo avisa el cambio en `dev`; `pages.yml` ejecuta el despliegue desde `main`. No publicar directamente desde `dev`.
- Los builds tienen exclusivamente permisos de lectura; el deploy Pages se ejecuta en un job posterior de privilegios mínimos.
- La compilación usa `EDITORIAL_BASE`, `VITE_EDITORIAL_ENV`, `VITE_EDITORIAL_SHA`, y las validaciones de ambos artefactos.
- Si falla un build, un test o el smoke combinado, NO publicar ni sobrescribir el último artefacto válido.
- El aviso DEV está únicamente en el HTML, **nunca** en Canvas ni en los PNG.

## Calidad y seguridad
- Ejecutar: `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm test`, `npm run build:pages` y `npm run test:e2e` en PR.
- Incluir pruebas de desktop/mobile, rutas/assets, Canvas y PNG cuando el cambio afecte un editor.
- Cuidar accesibilidad, separación de responsabilidades, DRY, diseños y texturas originales.
- GitHub Pages es público: sin secretos/tokens/datos personales en `VITE_*`, public/, HTML o bundles.
- Mínimos permisos: CI sólo lectura; deployment requiere `contents:read`, `pages:write` e `id-token:write`.
- Documentar toda decisión de despliegue y registrar los SHAs de las ramas validados.
