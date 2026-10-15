# Plan: indicadores de desarrollo y explorador provincial

## Objetivo

Incorporar al Recorrido una diapositiva de desarrollo humano y ampliar el mapa de Recursos para que permita pasar del panorama nacional al detalle territorial de recursos y proyectos. La implementación queda condicionada a fuentes verificadas; no se cargan cifras ilustrativas como hechos.

## A. Nueva diapositiva «Desarrollo»

### Indicadores propuestos

**Núcleo solicitado**

- IDH (con edición, año de referencia y componentes claramente identificados).
- Resultados PISA (por área y edición; evitar presentarlos como ranking único si la fuente publica puntajes).
- Deserción universitaria (definir cohorte, nivel y método; separar abandono, rezago y graduación cuando la fuente lo permita).
- Esperanza de vida al nacer.
- Porcentaje de población con título universitario, desagregado por nivel cuando sea posible.
- Porcentaje de graduados STEM, con clasificación de disciplinas y denominador explícitos.
- Graduados de maestría y doctorado (tasas o proporciones comparables, no solo conteos).
- Índice de Gini (año, población y concepto de ingreso).

**Candidatos para completar la historia**

- Años promedio y esperados de escolaridad (componentes del IDH; mostrar como desglose, no como evidencia independiente duplicada).
- Mortalidad infantil o expectativa de vida saludable, si hay series comparables.
- Pobreza monetaria con línea y metodología explícitas, si se quiere sumar una dimensión de bienestar material.
- Finalización de secundaria y participación laboral, para conectar educación con resultados.
- Acceso a internet/competencias digitales, solo si se encuentra una serie nacional comparable y defendible.

### Presentación y reglas de datos

- Propuesta de lectura: panel de indicadores con serie temporal y comparación regional seleccionable; categorías Salud, Educación e Igualdad.
- Cada indicador debe declarar unidad, población/denominador, año, cobertura, fuente primaria, URL/cita, fecha de recuperación y notas de comparabilidad.
- No mezclar ediciones/años como si fueran simultáneos; mostrar el año junto al valor y dejar visibles los vacíos como `null` con nota.
- El ranking PISA se presenta como puntajes por área y edición; cualquier puesto ordinal debe derivarse de la misma edición y explicitar empates/cobertura.
- No prometer una serie proyectada a 2056 para indicadores sin un modelo documentado y validado.
- Incorporar cada cifra de interfaz a «Data to verify» en `PENDING.md` hasta revisión humana contra la fuente original.

### Investigación y diseño antes de implementar

1. Auditar fuentes candidatas y registrar series disponibles, definición, frecuencia, cobertura y rupturas metodológicas.
2. Elegir un conjunto mínimo viable que tenga cobertura temporal suficiente y comparabilidad regional. Recomendación inicial: IDH, esperanza de vida, PISA por edición, finalización terciaria, graduación STEM y Gini; deserción y posgrados quedan sujetos a encontrar definiciones comparables.
3. Definir si la diapositiva es un panorama de Argentina o permite comparación con pares regionales; no fijar países ni valores sin revisar la disponibilidad.
4. Diseñar un contrato de datos y esquema antes de cargar datos procesados. Todo output debe conservar procedencia.
5. Implementar con pruebas de esquema, estados faltantes y lectura de series; revisar accesibilidad y legibilidad en 2D/3D si se aplica.

## B. Selección de provincia y explorador de recursos/proyectos

- Al elegir una provincia en el mapa nacional, animar el mapa 2D y 3D hasta el encuadre provincial, con transición suave y cancelable. Respetar `prefers-reduced-motion`; no recalcular proyecciones por frame.
- En Recursos, un clic en una provincia debe abrir el detalle de esa provincia y encuadrarla. El mapa detallado muestra ubicaciones geográficas de recursos y proyectos cuando existan coordenadas verificadas.
- Distinguir categorías: operaciones/productores, proyectos mineros, proyectos de hidrocarburos e indicios/recursos naturales. La leyenda debe explicar estado y tipo; no representar prospectividad como reserva o producción.
- Los elementos del mapa son seleccionables por teclado y puntero. La selección abre una ficha y una lista sincronizada con el mapa; cada elemento tiene nombre, ubicación, recurso, estado, operador si está documentado y cifras con unidad, período y fuente.
- Mostrar toneladas solo cuando la fuente indique masa y tipo (mineral, metal contenido, capacidad anual, recurso/reserva); para petróleo/gas, usar las unidades originales o conversión exacta documentada. Separar producción, reservas/recursos, capacidad y CAPEX.
- Los datos faltantes no se completan; indicar `null` y nota. Cifras visibles quedan en «Data to verify» hasta confirmación humana.
- Los puntos se agrupan o filtran en áreas densas; seleccionar un proyecto no debe hacer que el mapa pierda contexto provincial.

### Secuencia propuesta de implementación

1. Auditar contratos y fuentes de proyectos/recursos existentes; listar brechas y decidir qué puede mostrarse con respaldo.
2. Definir el contrato geográfico y de proyecto, incluyendo coordenadas, precisión/representación espacial, estado, commodity, métricas/unidades, fuentes y fecha de recuperación.
3. Construir el mapa provincial con selección accesible, lista sincronizada y ficha; probar geometrías sin datos y selecciones con datos.
4. Añadir transiciones compartidas para mapas 2D/3D; validar selección repetida, cambio rápido de provincia, reset y movimiento reducido.
5. Incorporar únicamente registros verificados, con pruebas de esquema y trazabilidad.

## Dependencias y decisiones abiertas

- Verificar qué contratos/datasets de `projects.json`, `resourcesData.ts` y geometría provincial existen en la rama de implementación; no asumir que los mocks actuales son publicables.
- Fuentes primarias y metodología de cada indicador; PISA requiere revisar participantes, áreas, ediciones y comparabilidad.
- Definición operativa de deserción universitaria y denominadores para STEM, maestría y doctorado.
- Alcance de la comparación regional y conjunto de países pares.
- Cobertura/precisión de coordenadas de proyectos y criterio de privacidad/escala cartográfica.
- La lista de candidatos no compromete la inclusión final: primero se verifica que la serie sea comparable y trazable.

## Criterios de aceptación para la futura implementación

- Cada cifra y ubicación visible puede rastrearse a fuente, fecha, unidad y definición; ninguna se presenta como verificada antes de la revisión humana.
- Seleccionar provincia desde el mapa nacional produce una transición suave al encuadre provincial en 2D y 3D, salvo movimiento reducido.
- El mapa y la lista/ficha permanecen sincronizados; recursos y proyectos se identifican por tipo y estado, y muestran las métricas correctas con unidades y período.
- Los estados sin datos son explícitos; navegación completa por teclado.
- Pruebas cubren contratos, transiciones/selección y los estados de datos faltantes.
