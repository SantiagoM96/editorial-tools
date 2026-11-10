# Crónica · Fase de contenido React (apilado sobre PR #4)

## Qué cambia

Los controles **Texto principal**, **Mostrar volanta**, **Texto de la volanta** y **Tamaño de tipografía** pasan a React, con formularios controlados y contratos TypeScript. También se integra la barra de formato en el mismo árbol React para que la selección se conserve al aplicar las marcas.

La fuente de verdad sigue siendo `documentContent` del editor heredado, desde donde se crea/recupera cada página. React solo recibe snapshots validados y envía comandos tipados, evitando mantener dos modelos de documento independientes.

## Separación del render

`render()` y `drawStrap()` dejan de leer los campos HTML y utilizan `documentContent` para headline, strapText, showStrap y size. El sistema de página, alineación, logo e imagen aún está dentro del código legado, y se seguirá migrando cuando haya tests suficientes.

- `content-model.ts`: contrato estricto y validación del snapshot.
- `content-bridge.ts`: eventos de lectura/comandos con nombre propio.
- `ContentEditor.tsx`: campos controlados, volanta en mayúsculas, visibilidad de switch, cursor/selección, y composición de los controles tipográficos.
- `TypographyControls.tsx`: pasa a ser componente presentacional con callback para formato, sin editar manualmente el DOM del textarea.

## Regresión

La nueva prueba de navegador cubre cambio de páginas, volanta, tamaño, formato, exportación, restauración de contenido y paridad de Canvas después de modificar los campos. Dos pruebas visuales (1440/390) comparan controles de contenido contra el original, además de las de carrusel, tipografía y el Canvas inicial.

## Límites

No se migran todavía carga/reencuadre de imágenes, logo, zoom ni exportador. Tampoco el conjunto de estados y funciones de composición del Canvas: esa extracción será incremental y contará con pruebas. No se hace merge ni se actualiza producción sin autorización.

Dependencias: PR #2 → #3 → #4 → este PR.
