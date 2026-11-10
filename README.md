# Editorial Tools

Plataforma independiente para los generadores editoriales de **Crónica**, **BAE Negocios** y **Diario Show**.

Este repositorio tiene **una sola línea de código por herramienta**. No incluye Agenda, Jóvenes ni otros proyectos de `mlz`, ni importa las ramas históricas del repositorio de origen.

## Ejecución local

Requiere Node.js 22 o posterior, sin instalar dependencias.

```sh
npm run dev
```

Abrir [http://localhost:4173/](http://localhost:4173/).

## Verificación estática

```sh
npm test
npm install
npm run test:e2e
```

La primera prueba verifica rutas, recursos locales y sintaxis JavaScript. Playwright ejecuta pruebas reales de navegador (carga de imágenes, edición básica, exportación PNG y vistas móviles). No sustituye una revisión visual manual de todas las variantes ni de los importadores externos.

## Organización

- `index.html`: dashboard único.
- `cronica/`: generador de Crónica.
- `bae/`: generador de BAE, incluido importador de noticias.
- `diarioshow/`: generador de Diario Show, incluido importador.
- `scripts/`: servidor local y verificaciones de integridad.
- `docs/`: trazabilidad y plan de refactorización.

Las carpetas de los tres productos son **implementaciones heredadas funcionales** para establecer una base verificable. No representan todavía la arquitectura final de frontend.

## Referencia de origen

Último `main` inspeccionado de `SantiagoM96/mlz`: `13032f9ab2ea8b81f3d46c81ca36f4e0b4e211b7` (9 de noviembre de 2026, Argentina).

Se tomó **solo el estado `-dev` de ese commit** como referencia para cada herramienta; se incorporaron exclusivamente recursos gráficos compartidos necesarios para su funcionamiento. Se corrigieron rutas para independizarlo de `mlz`. Véase [la trazabilidad de migración](docs/MIGRATION.md).

## Estado y publicación

Esta rama es una **base de migración para revisión**. No se ha publicado producción ni se afirma paridad de navegador. El workflow de GitHub Actions valida el código: no tiene permisos de despliegue.

La modernización arquitectónica es una fase posterior, documentada en [REFACTOR_PLAN.md](docs/REFACTOR_PLAN.md).

## GitHub Pages

URL prevista tras el merge y el primer despliegue: https://santiagom96.github.io/editorial-tools/

El workflow `.github/workflows/pages.yml` publica **solo desde `main`**, usando un artefacto mínimo generado con `npm run build:pages`, sin copiar código municipal ni carpetas históricas. Para habilitar el despliegue, GitHub Pages debe tener **Settings → Pages → Build and deployment → Source: GitHub Actions**. Si el sitio usa “Deploy from a branch”, cambiar esa opción antes de integrar.

**Esta rama/PR no está publicada y no se ha hecho merge.** La URL anterior es la ruta prevista, no un sitio verificado como accesible.
