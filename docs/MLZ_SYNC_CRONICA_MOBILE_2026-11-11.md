# Crónica · Mobile integrado con React

Se incorporaron pestañas accesibles Vista previa / Formato, panel de edición contextual con titular, volanta, formato, mayúsculas, alineación y tamaño, zona táctil para abrir la edición desde el texto de la placa y control de zoom vertical.

Los campos duplicados de presentación tienen **IDs distintos** y se sincronizan mediante los contratos `content-bridge` y `typography-bridge`; nunca se copia ni reescribe `modern-editor.js` desde MLZ. El documento editorial, las fotografías, el zoom y la exportación son propiedad del motor existente.

La distribución móvil es distinta deliberadamente respecto al baseline visual antiguo (capturas de controles internos se siguen comprobando cuando está activa la pestaña Formato). Se mantiene la paridad exacta del Canvas y PNG.

QA con Vitest, ESLint, typecheck, Playwright a 390px y escritorio, interacción y exportación antes de merge.
