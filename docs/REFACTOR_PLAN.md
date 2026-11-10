# Plan técnico posterior a la migración

## Principios

La referencia de comportamiento son los tres generadores más recientes de `main` en origen. La arquitectura de sus archivos **no** es el estándar de destino.

Prioridades: funcionalidad y salida gráfica equivalentes, modularidad real, funciones puras testeables, buenas prácticas sin sobreingeniería.

## PRs recomendados

1. **QA y pruebas reproducibles:** Playwright, fixtures de imágenes con licencia, capturas por variante, PNG con dimensiones y comparaciones controladas. Cubrir exportación sin cambiar el código funcional.
2. **Modelado del dominio editorial:** definir esquemas/configuraciones de placa, variantes, texto, imagen, composición y exportación; aislar canvas de UI. Comenzar por una herramienta.
3. **Extraer módulos compartidos:** importar imágenes, transformación/recorte, generación de PNG, validación y avisos. Compartir solo código realmente idéntico; respetar identidad de marca.
4. **Mejorar CSS y accesibilidad:** tokens por producto, estructura de estilos, componentes semánticos y responsive.
5. **Evaluar TS, React y bundler:** adoptar solo con pruebas de paridad y beneficios demostrables; evitar reescribir las tres herramientas a la vez.
6. **Revisar seguridad de importadores:** retirar dependencias no confiables, diseñar solución controlada si el negocio requiere extracción remota.
7. **Estrategia de deploy:** preview independiente; producción solo con aprobación, URL final y rollback.

No abrir múltiples refactorizaciones de riesgo antes de tener pruebas de equivalencia.
