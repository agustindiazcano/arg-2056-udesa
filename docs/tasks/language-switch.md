# Selector de idioma ES / EN

## Objetivo

Permitir cambiar entre español e inglés en todo el sitio, sin alterar cifras, fuentes ni cálculos. El español es el idioma inicial; conservar la elección en el navegador y aplicarla al volver.

## Implementación por etapas

1. Inventariar textos visibles y accesibles: navegación, Andes, introducción, diapositivas, gráficos 2D/3D, tablas, simulador, datos, referencias, ayudas, mensajes de error, etiquetas ARIA y textos alternativos. Identificar contenido generado desde datasets, texto en SVG, títulos y exportaciones CSV.
2. Elegir una solución de internacionalización compatible con React y el bundle existente; documentar cualquier dependencia. Crear catálogos tipados ES/EN y una única fuente de idioma, con español por defecto, persistencia y actualización de `html lang`. Definir una política explícita para traducciones faltantes y evitar claves visibles.
3. Agregar al encabezado un selector ES / EN accesible por teclado, con idioma activo anunciado. El cambio debe ser inmediato, conservar escena, diapositiva, filtros y selecciones y funcionar en pantallas pequeñas.
4. Migrar por secciones en PR pequeños. Traducir también leyendas, tooltips, controles de gráficos, títulos generados, mensajes de datos ausentes y alternativas accesibles. Mantener títulos originales de publicaciones y nombres propios identificables; traducir sus descripciones sin modificar URL, números ni estado de verificación.
5. Formatear fechas, separadores, unidades y plurales según idioma sin cambiar los valores; decidir y documentar el idioma y formato de exportaciones. Mantener explícitos los supuestos y la incertidumbre en ambas versiones.
6. Agregar verificaciones de claves faltantes y paridad entre catálogos, pruebas de cambio y persistencia, idioma del documento y conservación de estado. En CI capturar ambas versiones en escritorio y móvil, revisar desbordes y hacer una revisión humana de terminología y fidelidad de datos.

## Entrega

Empezar por infraestructura y encabezado, seguir por secciones y cerrar con una auditoría integral de cobertura. No declarar completa la traducción hasta revisar todos los textos, accesibilidad y gráficos en ambos idiomas.
