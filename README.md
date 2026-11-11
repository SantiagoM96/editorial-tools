# Editorial Tools

Herramientas de composición de placas editoriales para Crónica, BAE Negocios y Diario Show.

## Ambientes publicados

| Ambiente | Rama | Dashboard |
| --- | --- | --- |
| **PROD** · versión aprobada | `main` | [Abrir producción](https://santiagom96.github.io/editorial-tools/) |
| **DEV** · pruebas de Andy | `dev` | [Abrir desarrollo](https://santiagom96.github.io/editorial-tools/dev/) |

Ambos incluyen `cronica/`, `bae/` y `diarioshow/`. Son sitios **públicos** e independientes en la misma publicación de GitHub Pages. DEV muestra una marca discreta de desarrollo, que no aparece en los PNG exportados.

**Flujo:** `feat/*` desde `dev` → PR y CI → merge a `dev` → Andy prueba DEV → aprobación → PR `dev → main` → PROD. No promover cambios funcionales sin aprobación.

## Arquitectura profesional, transición incremental

- **Dashboard y Crónica:** React 19, TypeScript estricto, Vite 8, Tailwind CSS v4 y motores Canvas conservados.
- **BAE y Diario Show:** HTML, CSS y JavaScript heredado, conservados sin migración inversa o refactor ajeno al despliegue.
- **Calidad:** ESLint, Vitest, React Testing Library, Playwright (incluye navegación, mobile, Canvas, PNG y paridad).
- **CI/CD:** GitHub Actions compila **ambos** commits por separado, verifica sus assets y despliega un único artefacto atómico. Fallos no reemplazan la última versión válida.

## Desarrollo local

Requiere Node.js >= 22.12.

```bash
npm ci
npm run dev
```

Abrir http://127.0.0.1:4173/. Rutas locales: `/cronica/`, `/bae/` y `/diarioshow/`.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run typecheck` | TypeScript estricto |
| `npm run lint` | ESLint |
| `npm run test:unit` | Vitest y React Testing Library |
| `npm test` | Integridad de HTML, rutas y scripts |
| `npm run build:pages` | Build y validación del ambiente elegido |
| `npm run test:e2e` | Playwright |
| `npm run check` | Calidad y artefacto final |
| `npm run dev` | Servidor Vite local |

Para probar el build DEV localmente:

```bash
EDITORIAL_BASE=/editorial-tools/dev/ VITE_EDITORIAL_ENV=development npm run build:pages
```

## Operación y seguridad

- La publicación usa `.github/workflows/pages.yml` y un único artefacto Pages, sin servicios pagos.
- Las dos revisiones pueden identificarse con `editorial-deployment.json` y `editorial-release.json`.
- Si CI falla, el deploy se interrumpe antes de actualizar Pages; los rollbacks usan PR de revert.
- No incluir secretos en builds frontend; ambos ambientes son públicos.
- **Repositorio único autorizado:** `SantiagoM96/editorial-tools`. No modificar `mlz` ni `mlz-muni`.

Guía completa: [ambientes, workflow de Andy y rollback](docs/ENVIRONMENTS.md) · [reglas para agentes](AGENTS.md) · [arquitectura](docs/ARCHITECTURE.md) · [auditoría](docs/AUDIT.md).
