# Referencias y recorrido adaptable

## Objetivo

Reducir el espacio ocupado por las fuentes en todas las diapositivas y facilitar la lectura en laptops y pantallas angostas, manteniendo disponibles los gráficos y sus datos.

## 1. Referencias en un diálogo

1. Inventariar las fuentes de cada diapositiva: `RefList`, usos directos de `RefLink`, enlaces por URL y fuentes dentro de `ChartHelp`. Conservar la correspondencia entre afirmaciones y fuentes, sin duplicados y con los números canónicos de `REFERENCES`.
2. Diseñar un botón «Referencias» por diapositiva que abra un diálogo con número, nombre completo y enlace de cada fuente pertinente. Las fuentes que dependen de un indicador o vista deben actualizarse con la selección; no perder referencias de gráficos secundarios. Mantener el catálogo de Datos como catálogo independiente.
3. Implementar un componente compartido accesible: foco inicial y retorno al botón, navegación por teclado, Escape, cierre explícito, desplazamiento interno y enlaces identificables. Comprobar que funciona en ventanas pequeñas y no queda oculto por otros diálogos.
4. Migrar las diapositivas por grupos pequeños y comprobar los IDs y enlaces contra las fuentes anteriores, incluidos los usos directos de `RefLink` y los enlaces por URL. Agregar pruebas de apertura, cierre, foco, fuentes dinámicas y ausencia de referencias perdidas. Validar visualmente en CI.

## 2. Laptop y pantallas angostas

1. Inventariar cada diapositiva, sus paneles, controles, tablas y dependencias de tamaño; revisar los puntos de quiebre existentes (incluidos 900 y 960 px) y la altura disponible bajo la navegación. Documentar los casos que ya se apilan o desplazan.
2. Definir y validar con capturas en CI tamaños representativos de laptop y móvil, incluyendo 1366 × 768, 1024 × 768 y 390 × 844 CSS px, zoom del navegador y texto ampliado. Ajustar los límites según el contenido, sin recortar datos ni imponer desplazamiento horizontal a toda la página.
3. En las diapositivas con varios gráficos, conservar el gráfico principal grande y convertir los gráficos secundarios en un carrusel situado debajo, con flechas anterior/siguiente e indicador de página. En pantallas amplias conservar la disposición adecuada a su espacio. Revisar caso por caso las diapositivas con tablas, mapas o un único gráfico para no esconder información relacionada.
4. Crear un carrusel compartido con botones etiquetados, estado anunciado, foco predecible y soporte de teclado sin interferir con las teclas globales. Sin avance automático; respetar movimiento reducido. Mantener el estado de filtros y selecciones al cambiar de panel y recalcular el tamaño de los gráficos al mostrarlos.
5. Aplicar primero a una diapositiva representativa, verificar interacción y legibilidad, y extender gradualmente al resto. Agregar pruebas de navegación y estado, más capturas en CI para laptop y móvil; revisar manualmente superposiciones, leyendas, tablas y controles.

## Entrega

Dividir el trabajo en PR pequeños: diálogo compartido y migraciones de referencias; carrusel compartido y migraciones por grupo de diapositivas. Registrar cualquier excepción de diseño y solicitar revisión humana de las capturas y de la asociación entre afirmaciones y fuentes.
