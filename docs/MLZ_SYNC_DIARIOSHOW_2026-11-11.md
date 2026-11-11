# Diario Show · Onboarding contextual

Fuente de requisitos: `mlz/public/diarioshow-dev/js/onboarding.js` y `onboarding.css`.

Se integró un recorrido de **siete pasos** con spotlight sobre los controles que existen en Editorial Tools: variantes, logos, importación, textos, fotografía, preview y recomendación de zoom de navegador. El origen incluye una etapa de fotografías compartidas que no existe aún en el motor estable; no se presenta esa opción como implementada.

Se ejecuta automáticamente en la primera visita de escritorio, puede repetirse mediante “Ver guía”, permite cerrar con Escape/Omitir y opera con foco contenido y `aria-modal`. No bloquea mobile. La finalización se guarda en `localStorage`. El parámetro `?onboarding=off` lo desactiva para pruebas y `?onboarding=force` lo fuerza.

**No se alteraron los servicios de edición, importación ni exportación de PNG.** QA: validar recorrido y test de regresión en Actions antes del merge.
