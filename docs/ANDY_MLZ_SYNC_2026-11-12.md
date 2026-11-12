# Sincronización visual y funcional de Andy (12/11/2026)

Fuente de solo lectura: `SantiagoM96/mlz` @ `52150982d790a44f3c5005248422258ab25d2935`.
Destino: `SantiagoM96/editorial-tools`, rama DEV.

## BAE
Se integran el editor, controles y estilos de su `public/bae-dev`: paginador multipágina con descarga individual/todas, variantes «Sin diseño», edición enriquecida del titular, onboarding, modern-editor, miniaturas sincronizadas con el estado de cada página y últimos cambios mobile. Se conserva el importador existente y recursos gráficos institucionales de Editorial Tools.

## Diario Show
Se integran el editor y sus estilos, navegación multipágina, variantes «Sin diseño», controles de edición enriquecida y sincronización de miniaturas, manteniendo las funciones previas de firma inferior y onboarding. Se conserva el importador y recursos gráficos existentes.

## Crónica
Pendiente de adaptación específica a los modelos y componentes React/TypeScript de Editorial Tools: el editor de Crónica en `mlz` es un motor DOM independiente y no se puede reemplazar directamente sin saltarse la arquitectura actual. Ver notas y pruebas de paridad de Crónica.

## Integridad de la migración
Los recursos se integran por herramienta sin cambios en `SantiagoM96/mlz` o `SantiagoM96/mlz-muni` y sin modificar `main`. Los enlaces heredados a `mlz` se sustituyen por rutas propias. La detección de Diario Show en el paginador apunta a la ruta real `/diarioshow/` de Editorial Tools.

## Validación
Requiere compilación, controles de CI y browser QA para cada generador antes de publicar; cualquier error en tests debe corregirse antes de integrar.
