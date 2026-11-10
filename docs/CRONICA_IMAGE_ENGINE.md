# Crónica · Extracción de matemáticas y decodificación de fotografías

## Objetivo y alcance

Este PR está apilado sobre el **PR #6** y no modifica `main`, producción ni otras marcas.

El propósito es separar la lógica de fotografía del motor gráfico antiguo, sin rediseñar el Canvas ni modificar el comportamiento visual o las exportaciones.

### Cambios principales

- `src/features/cronica/engine/legacy-engine.js`: el código de ejecución original se traslada desde `public/cronica/js/app.js` al grafo de dependencias de Vite. Se mantiene en JavaScript transitoriamente; el objetivo es poder importar módulos TypeScript reales desde él. La eliminación de la copia en `public/` evita cargar ambos motores.
- `photo-geometry.ts`: matemáticas puras de escala `cover`, recorte, limitación de offsets y transformación del movimiento del puntero al sistema de coordenadas del lienzo. Conserva el **orden de operaciones exacto** del editor anterior, para obtener los mismos píxeles.
- `photo-decoder.ts`: validación MIME, `URL.createObjectURL`, decodificación de `HTMLImageElement`, notificación de errores y liberación de URL mediante `revokeObjectURL` tanto en éxito como en fallo, sin dependencias de React o Canvas.
- `main.tsx` importa el motor como módulo con efecto lateral; Vite empaqueta estos imports para desarrollo y publicación en `/editorial-tools/`.
- Actualización de verificaciones de enlaces y assets para la nueva ubicación de los módulos.
- Pruebas de matemáticas, bordes del recorte, delta de puntero, decodificación exitosa, archivos no válidos y limpieza de recursos.
- Prueba funcional de error de imagen y recuperación tras subir otra foto.

### Fuente de verdad y límites

Las páginas del carrusel siguen guardando las referencias `HTMLImageElement`, zoom y offsets originales. Los componentes React muestran snapshots, no duplican fotos ni buffers. El render Canvas y los recorridos de exportación se mantienen en el motor `legacy-engine.js`.

El código heredado se excluye del lint de TypeScript exclusivamente mientras se complete la migración; `photo-geometry.ts`, `photo-decoder.ts` y todas sus pruebas **sí** pasan strict TypeScript y ESLint.

No se incorpora todavía un motor compartido para BAE/Diario Show, ni se refactorizan de golpe los layouts editoriales. Esas decisiones requieren evidencia de reglas comunes.

## Criterios de aceptación

1. Que Vite compile los nuevos módulos y sirva /cronica/ tanto en local como con base path `/editorial-tools/`.
2. Que matemáticas y decodificación pasen tests unitarios, incluidos errores y limpieza.
3. Que Playwright pruebe fotografía, drag-and-drop, zoom, reencuadre, página activa y PNG 1080×1440.
4. Que la foto cargada y reencuadrada dé el **mismo SHA-256 de píxeles Canvas** que el origen anterior.
5. Que BAE y Diario Show sigan sin alteraciones.
6. Que no se haga merge ni despliegue sin aprobación.

## Próxima etapa

Separar el modelo de documento y el renderizador como módulos independientes y probar composición y exportación aisladas del DOM. Mantener PR pequeños y regresión real.
