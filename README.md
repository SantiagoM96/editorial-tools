# Editorial Tools

Herramientas de composición de placas editoriales para Crónica, BAE Negocios y Diario Show, publicadas en [GitHub Pages](https://santiagom96.github.io/editorial-tools/).

## Stack · transición incremental

- **Dashboard:** React 19, TypeScript estricto, Vite 8 y Tailwind CSS v4.
- **Generadores:** HTML/CSS/Canvas JavaScript conservado **sin modificar la lógica** en `public/`. Cada generador se migrará en PRs independientes.
- **Calidad:** ESLint, Vitest, React Testing Library y Playwright.
- **Deploy:** GitHub Actions → artefacto Vite en `dist-pages/` → GitHub Pages. Solo desde `main`.

## Desarrollo

Requiere Node.js >= 22.12.

```bash
npm install
npm run dev
```

Abrir http://127.0.0.1:4173/. Rutas locales: `/cronica/`, `/bae/` y `/diarioshow/`.

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor Vite / HMR |
| `npm run typecheck` | Verificación TypeScript strict |
| `npm run lint` | ESLint del código moderno |
| `npm run test:unit` | Vitest y React Testing Library |
| `npm test` | Integridad de enlaces y scripts heredados |
| `npm run build` | Typecheck y build Vite |
| `npm run build:pages` | Empaquetado GitHub Pages bajo `/editorial-tools/` |
| `npm run test:e2e` | Playwright, con pruebas de paridad adicionales en CI |
| `npm run check` | Verificaciones de calidad y artefacto final |

## Separación y seguridad

- No contiene código municipal de `mlz` ni `mlz-muni`.
- El PR de modernización no despliega a producción; requiere merge autorizado.
- Las importaciones remotas de noticias usan servicios externos en el código legado: ver `docs/AUDIT.md`.
- **No refactorizar Canvas sin pruebas de equivalencia de imágenes/exportaciones.**

Más información: [arquitectura](docs/ARCHITECTURE.md), [auditoría](docs/AUDIT.md), [migración original](docs/MIGRATION.md).
