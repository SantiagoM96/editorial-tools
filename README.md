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
```

Verifica rutas, recursos locales y sintaxis JavaScript. **No equivale a pruebas de navegador, visuales ni de exportación**.

## Organización

- `index.html`: dashboard único.
- `cronica/`: generador de Crónica.
- `bae/`: generador de BAE, incluido importador de noticias.
- `diarioshow/`: generador de Diario Show, incluido importador.
- `scripts/`: servidor local y verificaciones de integridad.
- `docs/`: trazabilidad y plan de refactorización.

Las carpetas de los tres productos son **implementaciones heredadas funcionales** para establecer una base verificable. No representan todavía la arquitectura final de frontend.

## Referencia de origen

Último `main` inspeccionado de `SantiagoM96/mlz`: `148e39cd709635eccadab61dd02191d8d5f9c6c4` (9 de noviembre de 2026, Argentina).

Se tomó **solo el estado `-dev` de ese commit** como referencia para cada herramienta; se incorporaron exclusivamente recursos gráficos compartidos necesarios para su funcionamiento. Se corrigieron rutas para independizarlo de `mlz`. Véase [la trazabilidad de migración](docs/MIGRATION.md).

## Estado y publicación

Esta rama es una **base de migración para revisión**. No se ha publicado producción ni se afirma paridad de navegador. El workflow de GitHub Actions valida el código: no tiene permisos de despliegue.

La modernización arquitectónica es una fase posterior, documentada en [REFACTOR_PLAN.md](docs/REFACTOR_PLAN.md).
