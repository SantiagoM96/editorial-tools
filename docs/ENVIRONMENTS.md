# DEV y PROD · Editorial Tools

## Qué son y dónde están
| Ambiente | Rama fuente | URL | Uso |
| --- | --- | --- | --- |
| **PROD** | `main` | https://santiagom96.github.io/editorial-tools/ | Versión aprobada |
| **DEV** | `dev` | https://santiagom96.github.io/editorial-tools/dev/ | Revisión de cambios de Andy |

Los tres generadores están en `cronica/`, `bae/` y `diarioshow/` debajo de **cada** URL. Son rutas estáticas reales, no un fallback SPA: la recarga directa funciona.

## Circuito de trabajo
1. Andy plantea un cambio por voz y se identifica el generador y el alcance.
2. Crear `feat/descripcion` a partir de `dev` (nunca de `main`).
3. Abrir PR `feat/* → dev`. La CI comprueba TypeScript, ESLint, Vitest, enlaces, compilación y Playwright, incluyendo Canvas/PNG/paridad.
4. Integrar el PR sólo si pasa CI. El push a `dev` ejecuta el workflow de Pages y publica DEV.
5. Andy revisa en DEV, en desktop y mobile, la interfaz y sus PNG; si requiere correcciones, repetir con otra `feat/*`.
6. Con aprobación explícita, abrir y fusionar PR `dev → main`. La nueva publicación incorpora el `main` aprobado, manteniendo el `dev` en paralelo.

**Los cambios funcionales no pasan a producción por el simple hecho de llegar a DEV.**

## Cómo funciona la publicación
GitHub Pages publica **un único artefacto** por repositorio. El workflow `pages.yml` responde a pushes en ambas ramas, pero en cada ejecución realiza checkout separado de los HEAD de `main` y `dev`, valida y compila cada uno con sus propios valores:

- PROD: `EDITORIAL_BASE=/editorial-tools/`, `VITE_EDITORIAL_ENV=production`.
- DEV: `EDITORIAL_BASE=/editorial-tools/dev/`, `VITE_EDITORIAL_ENV=development`.
- Cada build recibe `VITE_EDITORIAL_SHA` con el SHA real del checkout.

`prepare-pages.mjs` deja las páginas y assets del build con sus metadatos de revisión; `compose-pages.mjs` combina PROD en raíz y DEV en `dev/`, y rechaza artefactos de ambiente equivocado. `validate-pages.mjs` verifica las referencias reales de ambos builds. Playwright abre el artefacto final bajo `/editorial-tools/` y comprueba navegación, Canvas, PNG y móviles antes de subirlo.

El grupo de concurrencia `editorial-tools-pages` serializa las publicaciones con `cancel-in-progress: false`. Cada ejecución toma los commits vigentes al comenzar el trabajo y genera ambos ambientes de cero. El despliegue sólo ocurre cuando todos los pasos anteriores terminan con éxito. Ninguna ejecución toma el último `dist` generado por otra rama.

## Identificación, seguridad y límites
- DEV tiene una marca discreta `ENTORNO DE DESARROLLO` en el documento HTML, que nunca entra en el Canvas. Los PNG mantienen 1080 × 1440.
- PROD no tiene distintivo DEV. Los metadatos `editorial-environment`, `editorial-commit` y `editorial-deployment.json` sirven para comparar revisiones; `editorial-release.json` contiene las dos.
- DEV y PROD son **públicos**, no son staging privado. Nunca agregar credenciales, tokens o información sensible al código cliente.
- Las importaciones externas de noticias conservan sus dependencias de red; los ambientes no sustituyen esos servicios.

## Si falla una prueba o publicación
El workflow falla **antes** de `deploy-pages` y no se publica ningún artefacto incompleto. Consultar GitHub → Actions → `Publicar Editorial Tools · DEV y PROD`, abrir el job fallido y sus evidencias de Playwright. Corregir con un PR y volver a ejecutar el workflow.

Si un deploy de GitHub Pages falla tras subir el artefacto, comprobar la URL antes de afirmar que está publicado. Revisar también Actions / Deployment logs y el estado de Pages.

## Recuperación / rollback
1. Localizar el último commit estable de la rama afectada en GitHub Actions y su `editorial-deployment.json`.
2. Crear un PR de **revert** del cambio defectuoso a `dev` o `main`, según el ambiente afectado. No hacer `force push`.
3. La publicación coordinada vuelve a compilar **ambos** ambientes; el otro conserva la versión de su propia rama.
4. Ejecutar la smoke test y abrir las cuatro rutas del entorno afectado (dashboard + generadores).
5. Si falla la infraestructura de Pages, reejecutar manualmente el workflow desde una versión segura de `main`, verificando ambas ramas, o restaurar el workflow mediante un PR. Verificar la URL públicamente.

**Reglas de revisión:** proteger `main` contra pushes directos, requerir PR + CI, y otorgar a Andy permisos de colaboración mínimos. Algunas reglas de protección requieren configuración por el dueño del repositorio y no se imponen con este workflow.
