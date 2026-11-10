# Auditoría del repositorio, baseline anterior al PR de fundamentos

Fuente: `SantiagoM96/editorial-tools` en `main`, commit `ce77d9aaa296b61e6e1d5f26f8878c1d0fbd80d0`.

| Hallazgo | Prioridad | Evidencia | Resolución |
|---|---|---|---|
| Dashboard en HTML con CSS incrustado | Media | `index.html` concentra estructura, estilos y catálogo | Migrar a React + catálogo tipado sin cambiar textos ni presentación |
| Editores monolíticos y acoplados a DOM | Alta | `cronica/js/app.js`, `bae/js/editor.js`, `diarioshow/js/editor.js` operan Canvas y controles | **Posponer** extracción hasta tests extensivos en PR siguientes |
| Repetición en estilos y operaciones gráficas | Media | Estructura CSS de BAE/Diario Show e importadores por separado | Comparar semántica antes de compartir; no aplicar DRY mecánicamente |
| Dependencias de terceros para importación por URL | Alta | `bae/js/importer.js` y `diarioshow/js/importer.js` dependen de proxies HTTP externos | Auditar privacidad, CORS, fallos y acceso a imágenes; no alterar ahora |
| Falta de validación de todo el editor | Media | 8 E2E originales: exportación principal, imagen, variantes, móvil y lienzos iniciales | Retener las 8 pruebas; ampliar por variante y manipulación en PR de herramienta |
| Falta de tooling TypeScript / lint / unit | Media | Solo scripts Node/HTML/JS + Playwright | Agregar Vite, TS, ESLint, Vitest, RTL y controles de build |
| Riesgo de despliegue con rutas absolutas | Alta | Pages publicado bajo `/editorial-tools/` | Configurar `base` por entorno y validar artefacto autocontenido |
| Paridad visual del dashboard en migración | Alta | React puede cambiar reglas de estilo o accesibilidad | Conservar CSS y sumar captura visual escritorio/móvil frente al origen |

## Alcance del PR
Modernizar el sistema de build y el dashboard, sin modificar el contenido de los generadores. Los archivos editoriales se trasladan conservando los SHA de sus blobs; solo cambia su ubicación física en el repositorio, no la salida pública.

## No realizado
No se midieron todavía memoria, Lighthouse ni tiempos de exportación con fotografías grandes. Tampoco se probaron todos los casos de importación remota, accesibilidad WCAG exhaustiva o las combinaciones de variantes. No presentar estos puntos como resueltos.
