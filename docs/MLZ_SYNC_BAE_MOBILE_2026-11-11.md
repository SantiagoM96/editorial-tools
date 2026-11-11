# Sincronización BAE: controles y mobile

Se integran cuatro paneles accesibles, navegación móvil Vista previa/Formato, controles de tipografía desde la vista previa, ajuste vertical del zoom de fotografía y progreso de sliders.

Los controles móviles **proyectan el estado del editor BAE original**, con eventos `input`/`change` y notificación de render; no se duplicó el motor gráfico ni se copió `modern-editor.js` de MLZ. Mayúsculas es opt-in y no transforma la cadena guardada; desactivado por defecto, conserva la paridad anterior del Canvas. No se cambian dimensiones de exportación.

QA: Playwright para persistencia, pestañas, edición sincronizada, exportación, desktop y 390px. La comparación visual del shell requiere revisión manual adicional.
