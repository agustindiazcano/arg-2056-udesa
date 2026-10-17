# Plan: ¿qué tan lejos podemos mirar? Proyecciones, IA y desarrollo

## Objetivo

Agregar al Recorrido una diapositiva que explique que una proyección a 2056 es condicional e incierta, especialmente ante tecnologías de propósito general como la IA; exponga un escenario adverso de adopción y distribución; y muestre por qué el crecimiento del PBI importa para los indicadores de desarrollo, sin presentarlo como garantía de bienestar.

## Borrador editorial

### Título

**¿Qué tan lejos podemos mirar?**

### Texto principal

> Una proyección no es una predicción exacta: es una trayectoria posible si se cumplen ciertos supuestos. Cuanto más lejos miramos, más espacio hay para cambios demográficos, tecnológicos, políticos y económicos que hoy no podemos anticipar.
>
> La IA muestra lo rápido que puede cambiar el horizonte. A comienzos de 2021, algunos experimentos con modelos de OpenAI circulaban principalmente entre investigadores y comunidades técnicas; unos veinte meses después se lanzó ChatGPT y la IA generativa empezó a llegar al uso cotidiano. La adopción en empresas, la capacitación y la reorganización del trabajo toman tiempo, pero pueden acelerarse. También pueden aparecer modelos y agentes más capaces construidos sobre la tecnología disponible hoy.
>
> Por eso, el escenario que mostramos es una referencia construida con la evidencia y los supuestos disponibles hoy. Puede quedar desactualizado pronto. Las proyecciones económicas de organismos internacionales también se revisan a medida que aparecen nuevos datos y shocks: sirven para ordenar expectativas, no para prometer un resultado.

Este texto es un borrador: verificar fechas y caracterización histórica, y ajustar «circulaban principalmente» a la evidencia antes de publicarlo.

### Visuales propuestos

1. **Difusión y productividad de tecnologías anteriores.** Comparar adopción y productividad/PBI per cápita para innovaciones como la imprenta (con mucha cautela: las estimaciones de PBI premoderno son débiles), electricidad, computación e internet. Mostrar el intervalo entre invención, difusión amplia y efecto macro medido; distinguir correlación, mecanismo y causalidad.
2. **IA y costos.** Serie de capacidad/tamaño de modelos solo para modelos con métricas publicadas y comparables; si los parámetros no son divulgados, usar cómputo de entrenamiento, costo por tarea de inferencia o benchmark comparable. Añadir hardware de cómputo e inferencia y, si hay datos trazables, hardware/costo de robótica. Marcar mediciones observadas y escenarios de costo por separado.
3. **Incertidumbre de proyecciones.** Mostrar una banda que se amplía con el horizonte y, si se consiguen vintages archivados, comparar proyecciones macro originales con sus revisiones y el dato observado a 6 y 12 meses. Informar institución, variable, vintage, horizonte y error; no afirmar que «no aciertan» sin una métrica y muestra definidas.
4. **Escenarios de IA.** Base/central y adverso como lecturas de un rango/fan coherente, no como pronósticos independientes. Etiquetar el año de corte de evidencia y la fecha de actualización.

### Escenario adverso: productividad sin prosperidad compartida

> La producción por trabajador aumenta, pero la población y las empresas no logran adaptarse al ritmo del cambio. La automatización desplaza tareas y empleos más rápido de lo que se crean nuevas ocupaciones; la capacitación y la inversión complementaria llegan tarde. Las ganancias se concentran, los salarios de muchos trabajadores se estancan y la demanda no acompaña. La productividad mejora, pero eso no se traduce en un aumento equivalente del empleo, los salarios reales ni el PBI por habitante. En la transición, el aporte neto de la IA al crecimiento puede ser nulo o negativo frente a una trayectoria sin IA.

El último enunciado requiere una definición antes de modelar: «negativo» debe significar una contribución al crecimiento menor que cero frente al contrafactual, o una caída del nivel del PBI; no son lo mismo. La diapositiva debe nombrar el contrafactual y mostrar una banda/rango sustentado, no asignar una curva pesimista arbitraria. El aumento de productividad por sí solo no implica automáticamente mayor bienestar.

### ¿Por qué mirar el crecimiento del PBI en una diapositiva de desarrollo?

> El crecimiento del PBI no es el objetivo final ni garantiza que todas las personas mejoren. Importa porque, cuando se sostiene y se distribuye, puede ampliar los recursos disponibles para hogares, empresas y Estado. Junto con el crecimiento del PBI por habitante, los salarios reales y la distribución, ayuda a entender si esa mayor capacidad productiva se convierte en mejores condiciones de vida.
>
> La relación se debe mostrar con datos y estudios, no como una equivalencia automática: más PBI puede coexistir con desigualdad, salarios rezagados o peores resultados para algunos grupos.

## Investigación necesaria antes de implementar

1. **Innovaciones de propósito general:** buscar estudios históricos sobre los rezagos entre difusión de la imprenta, electricidad, computación/internet y productividad agregada; definir métrica y periodo. Para la imprenta, hacer visible la baja comparabilidad de las cuentas nacionales históricas. No adjudicar el crecimiento total a una sola tecnología.
2. **Evidencia de IA:** revisar estudios sobre difusión en empresas, adopción de agentes, tareas expuestas, creación/desplazamiento de empleo, salarios y productividad. Separar resultados observados, experimentos y escenarios.
3. **Tamaño y costos:** identificar series públicas comparables de cómputo, parámetros publicados, costos de inferencia por tarea, hardware y robótica. Determinar el benchmark, moneda/deflactor, unidad y fecha. Tratar economías de escala y reducciones futuras de costos como hipótesis/rango, no como certeza.
4. **Calidad de pronósticos:** formar una muestra archivada de vintages del FMI, Banco Mundial, OCDE u organismos con acceso reproducible; comparar horizontes de 6 y 12 meses para variables y periodos especificados. Definir MAE/RMSE o sesgo, revisiones y cobertura antes de escribir que las proyecciones «no aciertan».
5. **Desarrollo y crecimiento:** seleccionar estudios y series que conecten PBI real por habitante, salarios reales y resultados de desarrollo; reportar asociaciones y límites de inferencia. Incluir desigualdad (por ejemplo, Gini) y desagregaciones si las fuentes lo permiten.
6. **Fuentes del crecimiento:** buscar al menos un estudio de contabilidad del crecimiento con educación/capital humano y otro con ahorro/inversión/capital físico. Mostrar contribuciones estimadas dentro de su país, periodo y marco; no convertir la descomposición contable en causalidad ni trasladar coeficientes a Argentina sin validación.
7. Anotar cada fuente, cita/URL, fecha de recuperación, muestra, unidad, definición y limitación en el registro de fuentes; poner cada número destinado a la interfaz en «Data to verify» hasta revisión humana.

## Reglas del modelo y del gráfico

- La proyección representa un fan de incertidumbre y escenarios derivados de ese fan; no son tres curvas independientes seleccionadas por estilo.
- El escenario adverso tiene mecanismos falsables: rezago de adopción y capacitación, desplazamiento laboral, inversión complementaria, difusión de ganancias y demanda. Los rangos requieren fuentes o se etiquetan como supuestos en `docs/assumptions.md`.
- Separar productividad laboral, empleo/horas, salario real, PBI total y PBI por habitante. Explicar el canal por el que cada uno cambia.
- Las curvas de costo solo se extienden al futuro como escenarios; la economía de escala no se extrapola linealmente ni se presenta como garantía.
- Las revisiones de proyecciones se muestran con sus vintages y errores calculados. Una revisión no equivale por sí sola a un error: también puede reflejar nueva información o cambios de política.
- La contribución de educación, ahorro e inversión se atribuye a estudios concretos y a su periodo; no sumar porcentajes de estudios incompatibles.
- El gráfico de relaciones entre crecimiento e indicadores no afirma causalidad; se puede mostrar PBI real per cápita, salarios reales, Gini y resultados humanos con años y cobertura visibles.

## Criterios de aceptación

- El texto distingue proyección de predicción y hace visible fecha de corte, supuestos y rango de incertidumbre.
- Los ejemplos tecnológicos, series de costos, precisión de forecast y vínculos de desarrollo tienen fuente y definición verificables; afirmaciones sin evidencia quedan fuera del texto publicado.
- El escenario adverso mantiene separados productividad, empleo, salarios reales, PBI total y PBI por habitante, y explicita el contrafactual para cualquier efecto negativo.
- No se atribuye causalidad a una simple correlación ni se presentan descomposiciones contables como efectos causales.
- Las fuentes y todos los números visibles quedan registrados; faltantes son explícitos y no interpolados en silencio.
- La narrativa y los gráficos siguen el fan/rango de incertidumbre y las reglas de `AGENTS.md` para supuestos documentados.

## Decisiones pendientes

- Qué tecnología histórica y qué métrica representan mejor el rezago entre innovación y efecto macroeconómico.
- Qué conjunto de instituciones, variables y vintages permite evaluar de forma reproducible la incertidumbre de pronósticos de corto plazo.
- Si «impacto negativo» se define como contribución menor que cero al crecimiento frente al contrafactual o caída del nivel del PBI.
- Qué evidencia permite trasladar mecanismos de adopción, empleo e IA generativa al contexto argentino.
- Qué indicadores del desarrollo muestran mejor si el crecimiento se traduce en bienestar compartido.
