# Crónica — PR de transición React: carrusel y variantes

## Alcance de este PR (apilado sobre PR #2)

**Primera migración real de una interacción del editor a React + TypeScript.** El JSX y su estado de visualización sustituyen el código que antes creaba y actualizaba las páginas del carrusel y los botones Portada/Interior desde JavaScript.

- `cronica/index.html` pasa a ser la segunda entrada de Vite, sin alterar el resto de la interfaz HTML heredada.
- `src/features/cronica/` contiene el componente del carrusel, protocolo de comandos, contrato TypeScript validado y pruebas.
- `public/cronica/js/app.js` conserva **única responsabilidad sobre los datos originales**, fotografía, documento, Canvas, cambio de página y exportación, pero emite snapshots y recibe comandos; ya no manipula ni crea los botones del carrusel.
- No se duplican `carouselPages`, imágenes o documentos en React. El estado React es **solo una proyección de los controles visibles**.
- El contrato usa tres eventos DOM con namespaces y tipos definidos: `editorial:cronica:request-state`, `editorial:cronica:state`, `editorial:cronica:command`.
- La inicialización soporta ambos órdenes de carga de scripts mediante consulta explícita de estado, evitando condiciones de carrera.
- Se mantienen los estilos, clases, accesibilidad, botones, IDs y textos de la interfaz previa.

## Razón de la transición

No es viable sustituir todo el editor y motor de render de una vez sin riesgo de regresión. Esta migración **cambia la propiedad real del DOM de estos controles**: React genera páginas, administra el indicador y las variantes, y despacha acciones tipadas; el código anterior deja de crear esos elementos y de escuchar sus clicks. Quedan pendientes las otras partes de la UI.

## QA obligatorio

- TypeScript strict, Vitest/RTL, ESLint y Vite multi-page.
- E2E de nuevo componente: selección de página, preservación de texto independiente, variantes y eliminación.
- E2E completo de exportación: PNG de una página, carrusel y restauración de página activa.
- Paridad pixel-perfect del lienzo inicial de Crónica respecto del origen (junto a BAE y Diario Show).
- Dashboard inicial, BAE y Diario Show intactos.

## Próximos PR

Migrar el resto de la edición de Crónica de forma gradual, separar el modelo editorial del renderer, aislar servicios de fotografías y exportación y cubrir variantes/drag-and-drop. No compartir un motor gráfico hasta justificar reglas comunes reales.
