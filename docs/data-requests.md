# Pedidos de datos y enlaces pendientes

Lista de lo que la IA **no pudo conseguir o verificar** y que hay que traer a mano (o autorizar a buscar de otra forma). Se completa durante la revisión de datos reales de todas las diapositivas (`PENDING.md`, tarea «real-data-review»). Cada fila dice qué falta, para qué diapositiva, el enlace y qué hay que traer. Las fuentes ya leídas están en [`references.md`](references.md).

Estados: **no accedida** (el enlace falló), **sin enlace** (la IA no encontró la fuente), **sin verificar** (se accedió pero no se pudo contrastar), **a traer** (hay que descargar o transcribir el dato).

## 0. Estado de cada diapositiva del Recorrido

Una fila por diapositiva (paso del Recorrido). «Real» = con fuente y consultada; «parcial» = algunas cifras reales; «prueba» = inventada («Datos de prueba»). Todo dato real y su referencia se ven en la sección **Data** de la aplicación (`web/src/datasets/slides.ts` y `references.ts`).

| Paso | Diapositiva | Estado | Pedidos | Qué falta |
|---|---|---|---|---|
| 0 | PBI real de Argentina desde 1960 y ranking | **real** (Banco Mundial, PBI real en dólares constantes de 2015, 1960-2025; población de Argentina del INDEC; el crecimiento se comparó con el FMI) | — | Nada para el gráfico |
| 1 | PBI hasta 2056 (con abanico) | parcial: indicadores y serie 1990-2025 reales (Banco Mundial, PBI real en dólares de 2015); 2026 es 2025 por el crecimiento real que proyecta el FMI (2,06 %); desde 2027 la proyección y el abanico son de prueba | D9 y D10 (serie, hecho) | La proyección del modelo |
| 2 | Producción por provincia | parcial: indicadores reales; hidrocarburos por provincia reales (Secretaría de Energía, 2025, en Data); minería y agro por provincia de prueba | D9 (hecho), D12 | Minería y agro por provincia |
| 3 | Impacto de la IA en el PBI | prueba (las dos líneas); los estudios de Acemoglu y Anthropic ya se leyeron | D19 | Un rango para Argentina: ambos estudios son de Estados Unidos |
| 4 | Recursos naturales: exportaciones por sector | **real** (INDEC, exportaciones de bienes por complejo exportador, 2025, provisorio; en Data también el acumulado enero a julio de 2026 por gran rubro) | D13 | Exportaciones de servicios (D26) |
| 5 | Regla del 70 | no es un dato: es aritmética (70 / tasa) | — | Nada (revisar que no figure como «prueba») |
| 6 | ~~Qué miran los inversores~~ | **eliminada el 2026-10-14** por decisión del equipo (sin fuente) | — | Nada |
| 7 | Mapa productivo por provincia | prueba (el mapa); hidrocarburos por provincia reales en Data | D12 | Igual que el paso 2 |
| 8 | Minería hoy y lo que viene | **real** (Secretaría de Minería, ARMINERA 2025, transcrito de imágenes): exportaciones 2024 y proyección 2035; en Data los proyectos de litio y cobre y la proyección por año; la lista del RIGI es de prensa, sin verificar | D14, D23 | Verificar la lista del RIGI (H1) |
| 9 | Hidrocarburos | parcial: historia 2015-2025 de la producción nacional de petróleo real (Secretaría de Energía, datos abiertos); proyección y rango de prueba; tabla de proyectos de prensa, sin verificar | D15, D23 | La proyección y el rango (modelo) |
| 10 | Agro actual y potencial | prueba (las barras, en dólares); las toneladas por cultivo y campaña son reales (MAGyP) y están en Data | D16 | Un estudio de potencial y valuar la producción |
| 11 | ~~Cómo se reparte lo que exportamos~~ | **fusionada con el paso 4 el 2026-10-14**: el paso 4 («Exportaciones por complejo») tiene el botón «% del total»; la tabla sigue en Data | — | Nada |
| 12 | Composición del PBI | **real** (INDEC, valor agregado de 2025 a precios de 2004, preliminar) | D17 | Verificar a mano que la columna «Total» del cuadro 4 sea el promedio trimestral de 2025 |
| 13 | Stock de recursos naturales | prueba (las barras); en Data las reservas reales de petróleo y gas al 31-12-2025 (Secretaría de Energía); las cantidades de minerales de ARMINERA y del USGS están en el texto | D18 | Valuar y reservas de minerales (el USGS las trae en tablas que no se pudieron leer) |
| 14 | Productividad | real (INDEC, PWT/FRED); falta verificar | D2 a D8, D21, D22 | Verificar fuentes citadas |
| sim | Simulador del PBI | prueba (coeficientes inventados) | D10, D19 | Elasticidades del modelo |

## 0b. Regla de las cifras del PBI y de la población (decisión del 2026-10-13)

Pedido del equipo: el PBI de cada país, y sobre todo el de Argentina en 2026, no puede decir una cifra en un lado y otra en otro. Reglas:

1. **Siempre PBI real, a precios constantes** (dólares constantes de 2015, «términos reales»): nunca nominal en dólares corrientes. (El 12-10 se había decidido nominal; el 13-10 el equipo pidió precios constantes y se migró todo.) Cada gráfico y cada tabla lo dice en el título, la unidad o la fuente. Las exportaciones son un flujo en dólares corrientes y lo dicen.
2. **Una sola fuente por dato**, en `web/src/tour/gdpFacts.ts`: hasta 2025, observado, el Banco Mundial (`NY.GDP.MKTP.KD`, `worldGdp.json`, armado por `scripts/build_world_gdp.py`); 2026 es el valor de 2025 por el crecimiento real que proyecta el FMI (2,06 %, `imfWeo.json`, `scripts/imf_compare.py`), porque el FMI no publica el PBI real en dólares constantes. Los gráficos del PBI (paso 1), de la IA (paso 3) y el simulador arrancan del mismo valor de 2026 (621,8 miles de millones de dólares de 2015); el test `web/tests/unit/gdpConsistency.test.ts` falla si dejan de coincidir.
3. **Población de Argentina: la del INDEC** (proyección con base en el Censo 2022, publicada en octubre de 2025: 46.387.098 en 2025 y 46.466.688 en 2026). Para los otros países, el Banco Mundial.
4. El año 2026 no se dibuja como dato observado en el paso 0: el último año observado es 2025.

## 1. Enlaces a los que no se pudo entrar

| # | Diapositiva | Qué es | Enlace | Estado | Qué traer |
|---|---|---|---|---|---|
| D2 | 14 (Productividad) | Artículo de Baumann Fonay sobre la PTF | <https://macroargentina.substack.com/p/ptf-y-pib-potencial-de-argentina> | sin verificar: la página no cargó al reabrirla; el texto lo pegó el equipo | Confirmar +4,2 % (2025) y +7,7 % desde 2023 |
| D3 | 14 | Serie de Baumann en Alphacast | <https://www.alphacast.io/datasets/potential-gross-domestic-product-output-gap-tfp-53419> | no accedida | La serie anual de PTF 1990-2025 |
| D4 | 14 | Baumann en X | <https://x.com/ivanfbf/status/2050931628965278028> | no accedida | Nada, solo confirmar |
| D5 | 14 | Estudio de Anthropic sobre productividad | <https://www.anthropic.com/research/estimating-productivity-gains> | **verificada el 2026-10-12**: «Estimating AI productivity gains from Claude conversations», 2025-11-25: 1,8 % anual de productividad laboral y 1,08 % anual de PTF **en Estados Unidos**, con adopción universal en diez años; aclara que no es una predicción | Nada |
| D6 | 14 | Acemoglu (NBER 32487) | <https://www.nber.org/papers/w32487> | **verificada el 2026-10-12**: «The Simple Macroeconomics of AI», mayo de 2024 (publicado en *Economic Policy*, 2025): efecto sobre la PTF de no más de 0,66 % en diez años, y menos de 0,53 % si se descuentan las tareas difíciles de aprender | Nada |
| D7 | 14 | METR, ensayo con desarrolladores | páginas secundarias <https://www.infoq.com/news/2025/07/ai-productivity> y <https://www.eweek.com/news/news-ai-tools-slow-developer-productivity-study/> | sin verificar: falta la página original de METR (sin enlace) | La URL de METR y la cifra de 19 % |
| D8 | 14 | Hacienda 2018 (documento de trabajo n.º 1) y gacetilla del INDEC sobre la productividad | — | sin enlace | Las URL |

## 2. Datos que faltan para reemplazar los de prueba

| # | Diapositiva | Dato | Fuente a consultar | Estado | Qué traer |
|---|---|---|---|---|---|
| D9 | 1 y 2 (indicadores), simulador | PBI, población, PBI per cápita, exportaciones totales, crecimiento, inversión de 2025 | Banco Mundial (WDI), API <https://api.worldbank.org/v2/country/ARG/indicator/>; INDEC (población); FMI (comparación) | **hecho**: PBI real 609,2 mil millones de USD de 2015 (el Banco Mundial; en dólares corrientes sería 683,1); población 46,4 millones (INDEC; el Banco Mundial tiene 45,85 y el FMI 47,47); PBI per cápita real 13.134 USD de 2015 (609,2 / 46,387); exportaciones de bienes y servicios 106,3 mil millones de USD corrientes; crecimiento real 4,4 % (FMI: 4,5 %); formación bruta de capital 16,1 % del PBI (el FMI da 13,1 % de inversión total: **no coinciden**, ver la sección 5) | Decidir la cifra de exportaciones (tarea H6) y la de inversión (H13) |
| D10 | 1 (PBI hasta 2056) | Serie histórica oficial y la proyección con abanico | Banco Mundial (`NY.GDP.MKTP.KD`, dólares constantes de 2015, 1990-2025); INDEC (cuentas nacionales); el modelo del repo (`model/`) para la proyección | **serie hecha el 2026-10-12** (Banco Mundial, 36 años en `web/src/tour/gdpMock.ts`); la proyección sigue bloqueada por el modelo | La proyección y los parámetros del modelo; contrastar la serie con el INDEC (pesos a precios de 2004) |
| D12 | 2, 7 | Producción por provincia de minería, agro e hidrocarburos | Secretaría de Energía, datos abiertos <https://datos.energia.gob.ar> (API CKAN `https://datos.energia.gob.ar/api/3/action/package_show?id=produccion-de-petroleo-y-gas-tablas-dinamicas`); MAGyP (datos.gob.ar, series nacionales); minería: sin conjunto por provincia | **hidrocarburos hecho el 2026-10-13** (`scripts/build_energy_data.py`): 2025, petróleo (miles de barriles por día): Neuquén 513,6; Chubut 123,9; Santa Cruz 61,3; Mendoza 53,0; Río Negro 20,6; La Pampa 11,3; Tierra del Fuego 3,0; Salta 1,8 (64,7 % Neuquén). Gas: Neuquén 97,0 millones de m³ por día (68,6 %). **Agro por provincia y minería: pendientes** (las series nacionales del MAGyP están en D16; las provinciales están en el portal `datosestimaciones.magyp.gob.ar`, que no abre con un script) | Minería por provincia (SIACAM de la Secretaría de Minería) y agro por provincia; el mapa de los pasos 2 y 7 necesita los tres sectores en la misma unidad (USD) |
| D13 | 4, 11 | Exportaciones por sector y su composición | INDEC, *Complejos exportadores, año 2025* <https://www.indec.gob.ar/uploads/informesdeprensa/complejos_03_2686A1604947.pdf> (marzo de 2026); *Intercambio comercial argentino*, agosto de 2026 | **hecho el 2026-10-13**: exportaciones de bienes 2025 = 87.111 millones de USD (+9,3 %, provisorio): soja 21.442; petrolero-petroquímico 11.772; automotriz 8.784; maicero 6.660; oro y plata 4.886; carne y cuero bovinos 4.727; triguero 3.649; girasol 2.175; pesquero 2.091; lácteo 1.522; otros complejos 13.346; resto 6.055 (los diez primeros suman 77,7 %, como dice el informe). Cargado en los pasos 4 y 11 y en Data. Los grandes rubros de enero a julio de 2026 están en Data | Servicios (D26). Las filas del PDF salen desordenadas al convertirlo a texto: el orden se verificó porque cada variación coincide con el informe (oro y plata +27,7 %, triguero +32,0 %, girasol +49,7 %) y la suma cierra |
| D14 | 8 | Proyectos mineros por provincia, estado, capacidad y capex | Secretaría de Minería, ARMINERA 2025 <https://www.argentina.gob.ar/sites/default/files/mayo_2025_-_arminera.pdf> | **hecho el 2026-10-13**: se renderizaron las páginas 7 a 10 (son imágenes) y se transcribieron a mano a `web/src/tour/miningArminera.ts`: 12 proyectos de litio y 8 de cobre con accionistas, provincia, capacidad y estado de mayo de 2025; exportaciones mineras 2018-2024 (3.450; 3.248; 2.621; 3.243; 3.858; 4.061; 4.673 millones de USD); 2024: oro 3.141 (67,2 %), plata 652, litio 645, resto 235; proyección 2035 de 25,5 mil millones (cobre 11,7; litio 11,3); gastos de capital 2025-2031 por 30.202 millones (pico de 7.510 en 2026); cartera de 316 proyectos | Verificar a ojo la transcripción contra el PDF (tarea H3b); las cifras de oro y plata de la proyección no están rotuladas y salen de restar |
| D15 | 9 | Producción de petróleo y gas con piso y techo (Vaca Muerta) | Secretaría de Energía, datos abiertos (`serie-produccion-petroleo-sesco`, promedio diario por provincia, desde 2009; serie desde 1950); IAE | **hecho el 2026-10-13** (`scripts/build_energy_data.py`, `web/src/tour/energyArgentina.json`): producción nacional de petróleo, promedio diario de cada año (miles de barriles por día): 532,4 (2015); 510,6; 479,7; 489,5; 508,7; 480,8; 513,5; 582,5; 635,3; 700,7; 793,7 (2025); gas 141,4 millones de m³ por día en 2025 (117,5 en 2015). El IAE da 800,2 con la misma fuente y la prensa 860: la serie oficial manda. La serie desde 1950 da 31.973 mil m³ en 2015 contra unos 30.900 de la otra: son series distintas, las dos están en Data | La proyección y el rango (el modelo) |
| D16 | 10 | Producción agrícola actual y potencial | MAGyP, series nacionales anuales en datos.gob.ar (`scripts/build_agro_data.py`, `web/src/tour/agroArgentina.json`) | **producción hecha el 2026-10-13**: campaña 2024/25: soja 51.107.839 t (17,99 millones de ha sembradas); maíz 51.690.953 t; girasol 5.531.925 t; trigo, última campaña publicada (2025): 27.862.115 t. La API de datos.gob.ar falla a veces con el error 502: el script reintenta | El potencial (un estudio con fuente) y la valuación en dólares |
| D17 | 12 | Composición del PBI por sector | INDEC, informe de avance del nivel de actividad, 2.º trimestre de 2026 <https://www.indec.gob.ar/uploads/informesdeprensa/pib_09_26065D6A3612.pdf> | **hecho (2026-10-12)**: valor agregado bruto de 2025 por 16 sectores, a precios de 2004, preliminar (total 608.097 millones de pesos; industria 18,0 %, comercio 15,2 %, inmobiliarias y empresariales 13,9 %, agro 8,5 %). Cargado en el paso 12 y en Data | Las filas del PDF salen desalineadas al convertirlo a texto; el orden de los 16 valores se verificó porque suman exactamente el total, pero hay que mirarlo una vez en el PDF (cuadro 4). Se podría pasar a precios corrientes (D27) |
| D18 | 13 | Stock de recursos naturales (reservas y recursos) | Secretaría de Energía, reservas al 31-12-2025 (Excel por yacimiento, en datos abiertos); USGS, *Mineral Commodity Summaries 2026*; Secretaría de Minería (ARMINERA 2025) | **hidrocarburos hecho el 2026-10-13**: reservas comprobadas hasta el fin de la vida útil: petróleo 624.718 miles de m³ (3.929 millones de barriles), gas 583.219 millones de m³; probables 372.312 y 246.175; posibles 248.797 y 192.772; en Data. **Minerales**: USGS 2026, recursos de litio de Argentina 28 millones de toneladas; ARMINERA: litio 122 millones de t LCE de recursos y 21 de reservas, cobre 116,7 millones de t, oro 105 millones de onzas, plata 3.216 millones de onzas, uranio 34.281 t. Las tablas de reservas del USGS salen desordenadas | Reservas de minerales (tarea H10) y valuar todo |
| D19 | 3 | Impacto de la IA en el PBI (rango) | Literatura citada en `docs/references.md` (P8 a P10) y el modelo de IA del repo | Acemoglu y Anthropic ya leídos (D5, D6); ambos miden Estados Unidos, no Argentina; METR (D7) sigue sin la fuente original | Un rango propio para Argentina con una regla explícita (el modelo) |
| D20 | 6 | ~~Qué miran los inversores~~ | — | **cerrado: la diapositiva se eliminó el 2026-10-14** | Nada |
| D21 | 14 | Las 15 series de FRED de la Penn World Table 11.0 (IDs en `references.md`, P7) y la anomalía de horas de Argentina 2021-2023 | <https://fred.stlouisfed.org/> | sin verificar: los datos vienen del archivo `productivity_slide_spec.html`, la IA no los volvió a bajar | Re-descargar y comparar con `web/src/tour/productivityData.json` |
| D22 | 14 | Serie del INDEC 2016-2025 (cuadros 12 y 13) como paso extra | <https://www.indec.gob.ar/ftp/cuadros/economia/productividad_stock_capital_10_26.pdf> | leída; el VAB de 0,3 % anual y los 0,6 p.p. de 2016-2025 solo están en los gráficos | Transcribir esas cifras si se quieren mostrar |
| D23 | 8, 9 | Proyectos del RIGI (minería, petróleo y gas) y otros proyectos de gran escala | iProfesional <https://www.iprofesional.com/energia/465973-rigi-minero-suma-13-proyectos-y-25230-millones-de-dolares-de-inversion-en-argentina>; Shale24 <https://www.shale24.com/oil-gas/mapa-definitivo-rigi-proyectos-aprobaron-cuales-quedan-2026-n276>; La Nación <https://www.lanacion.com.ar/economia/rigi-hay-mas-de-20-proyectos-aprobados-con-una-inversion-total-de-casi-us50000-millones-nid15082026/>; Infobae (mayo y febrero de 2026); Diario Crónica (Tecpetrol, 2026-10-09); El Cronista (gasoducto); LM Neuquén (VMOS, proyectos en construcción, compromisos de 2026); Infobae (LLL Oil) | **cargado en Data (pasos 8 y 9), sin verificar**: 13 proyectos mineros aprobados por 25.230 millones de USD (según iProfesional), 4 mineros más en evaluación, 5 de petróleo y gas aprobados y 5 en evaluación; las fuentes se contradicen en montos y en cantidades (La Nación: 21 aprobados por 46.708 millones; Shale24: 10 aprobados; Infobae de mayo: 16 aprobados por casi 30.000 millones). La tabla de la aplicación anota cada discrepancia | Verificar contra el Boletín Oficial y el Ministerio de Economía (ver la sección 3, tarea H1) |
| D24 | 8 | Proyectos mineros sin RIGI y sus capex (Josemaría 4.100; El Pachón 4.500 a 9.460; Taca Taca 3.583; MARA 3.100 en prefactibilidad antes del RIGI) | LM Neuquén <https://mase.lmneuquen.com/mineria/argentina-uno-uno-los-proyectos-mineros-que-ya-estan-construccion-n1246226>; Mining Press <https://miningpress.com/nota/348245/cobre-los-proyectos-mas-grandes-en-argentina>; Salta Mining <https://saltamining.com/contenido/7614/el-mapa-del-cobre-argentino-recursos-proyectos-y-el-desafio-de-transformar-poten> | sin verificar: las cifras de capex varían mucho entre notas | Informes técnicos de cada empresa (NI 43-101) o la lista de la Secretaría de Minería |
| D25 | 9 | Proyectos de petróleo y gas que no aparecieron: Palermo Aike, offshore (cuenca Argentina Norte), Aguada Pichana, Bajo del Choique, otras áreas de Vaca Muerta | — | sin enlace: la búsqueda solo devolvió LLL Oil y los compromisos de 2026 | Los proyectos y sus montos, de la Secretaría de Energía o de las empresas |
| D26 | 4, 11 | Exportaciones de servicios (turismo, software, servicios basados en conocimiento) | INDEC, Balance de pagos o Servicios internacionales | sin enlace: el Banco Mundial da 106.260 millones de USD de bienes y servicios en 2025, sin el desglose | El cuadro de servicios por tipo |
| D27 | 12 | PBI por sector a precios corrientes | INDEC, cuentas nacionales (valor agregado a precios corrientes) | sin enlace: hoy se usa el valor agregado a precios de 2004, que cambia la proporción de los sectores | El cuadro a precios corrientes del último año |

## 2b. Lo que no se encontró

- Datos oficiales de la Secretaría de Energía por provincia: el portal abre, pero la búsqueda no devolvió el nombre exacto del conjunto de producción. Hay que entrar y copiar la URL.
- Reservas probadas oficiales de petróleo y gas (D18): no aparecieron cifras oficiales actualizadas.
- Reservas de cobre de la USGS para Argentina: no hay cifra en lo encontrado; la de 44 millones de toneladas viene de una fuente secundaria sin citar a USGS.

## 3. Lo que tenés que hacer vos (o llevar a otra IA)

Ordenado por prioridad: 🔴 bloquea una diapositiva, 🟡 mejora lo que ya hay, 🟢 más adelante. «Abrir» = entrar con el navegador (la IA no puede o devolvió un error). «Otra IA» = pegarle el prompt a una IA con búsqueda (Perplexity, ChatGPT con búsqueda o Gemini) y traer las URL y los números; **después hay que abrir cada enlace y confirmar que dice lo mismo**.

| # | Prioridad | Qué hacer | Quién | Para qué pedido |
|---|---|---|---|---|
| H1 | 🔴 | Verificar la lista de proyectos del RIGI contra la fuente oficial: abrir el listado del Ministerio de Economía (buscar «RIGI proyectos aprobados» en argentina.gob.ar/economia) y las resoluciones del Boletín Oficial <https://www.boletinoficial.gob.ar>; confirmar cuántos hay, montos y fecha de aprobación de cada uno y corregir `web/src/tour/rigiProjects.ts` | Vos, o pedir a la IA que edite el archivo con la lista oficial pegada | D23 |
| H2 | ✅ | HECHO por la IA el 2026-10-13: el informe «Complejos exportadores, año 2025» del INDEC cargado en los pasos 4 y 11 (ver D13) | — | D13 |
| H3 | ✅ | HECHO por la IA el 2026-10-13: las páginas 7 a 10 se renderizaron y se leyeron (ver D14). Queda H3b | — | D14, paso 8 |
| H3b | 🟡 | Mirar las páginas 7 a 10 del PDF de ARMINERA contra `web/src/tour/miningArminera.ts` (transcripción a mano) y buscar una versión más nueva del documento (es de mayo de 2025) | Vos | D14 |
| H4 | ✅ | HECHO por la IA el 2026-10-13: el portal tiene una API (CKAN) y los conjuntos se leen con `scripts/build_energy_data.py` (ver D12, D15, D18) | — | D12, D15, pasos 2, 7 y 9 |
| H6 | 🟡 | Decidir qué cifra de exportaciones mostrar en el indicador de los pasos 1 y 2: Banco Mundial (bienes y servicios, 106.260 millones de USD) o INDEC (solo bienes, unos 87.100) | Decidir | D9 |
| H7 | 🟡 | Confirmar los enlaces de productividad que la IA no pudo abrir (D2 a D8): abrir cada uno y confirmar la cifra; si algún enlace murió, pasar el nuevo | Abrir | D2 a D8 |
| H8 | ⚪ | ~~Fuente para «Qué miran los inversores»~~: la diapositiva se eliminó el 2026-10-14 | — | — |
| H9 | 🟡 | Agro por provincia: abrir <https://datosestimaciones.magyp.gob.ar> (no abre con un script) y pasar la producción por provincia de soja, maíz, trigo y girasol. Las series nacionales ya están (D16) | Abrir | D12 |
| H10 | 🟢 | Reservas: abrir el PDF del USGS por mineral <https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-lithium.pdf> (cambiar «lithium» por «copper», «gold», «silver») y las reservas de petróleo y gas de la Secretaría de Energía | Abrir | D18 |
| H11 | 🟢 | Dar de baja las cifras de prensa en cuanto exista la fuente oficial | Vos | D23 |
| H12 | ✅ | HECHO: ya no hace falta. Se había confirmado que el FMI da 768,21 de PBI nominal en 2026; desde el 13-10 el proyecto usa PBI real y el valor de 2026 sale del crecimiento real proyectado (2,06 %) | — | — |
| H13 | 🟡 | Decidir qué cifra de inversión mostrar (Banco Mundial 16,1 %, FMI 13,1 %, INDEC) y buscar la formación bruta de capital fija a precios corrientes del INDEC | Vos / otra IA | D9 |

### Prompts listos para otra IA

Pegar tal cual; pedir siempre que cada dato traiga su enlace y que diga si el enlace abrió.

1. **Proyectos RIGI (H1)**: «Dame la lista oficial de proyectos aprobados por el RIGI de Argentina a la fecha de hoy, con nombre, empresa, provincia, sector, monto de inversión en millones de USD, fecha de la resolución del Boletín Oficial y su número. Incluí también los pedidos en evaluación y los rechazados. Para cada fila, el enlace al Boletín Oficial o al Ministerio de Economía. Marcá qué dato no pudiste confirmar en una fuente oficial.»
2. **Proyectos mineros y petroleros que no son del RIGI (D24, D25)**: «Listá los proyectos mineros (cobre, litio, oro, plata) y de petróleo y gas (Vaca Muerta, offshore, GNL) de Argentina que están en factibilidad, construcción o producción y que no pasaron por el RIGI: nombre, empresa, provincia, etapa, capex, capacidad anual y fecha de inicio prevista, cada uno con enlace al informe técnico, a la empresa o a la Secretaría.»
3. **Exportaciones por complejo (H2)**: «Dame la tabla del INDEC de exportaciones argentinas de 2025 por complejo exportador y por grandes rubros, en millones de USD, con el enlace al informe del INDEC.»
4. **Servicios (D26)**: «Dame las exportaciones argentinas de servicios de 2025 por tipo (viajes, servicios basados en conocimiento, software, transporte), en millones de USD, con enlace al INDEC o al BCRA.»

## 5. Comparación con el FMI (2026-10-13)

Fuente: FMI, *World Economic Outlook*, por la API SDMX (`https://api.imf.org/external/sdmx/2.1/data/WEO/`, actualización del 2026-09-30), leída por `scripts/imf_compare.py`. Como el proyecto usa PBI real y el FMI no lo publica en dólares constantes, se compara el **crecimiento real** y los demás datos de Argentina.

| Dato | Banco Mundial | FMI | INDEC | Qué se usa | Veredicto |
|---|---|---|---|---|---|
| PBI real de Argentina 2025 (miles de millones de USD de 2015) | 609,23 | no lo publica | — | 609,23 | — |
| Crecimiento real de Argentina 2025 | 4,37 % | 4,48 % | — | 4,4 % | coinciden (0,1 puntos) |
| Crecimiento real de Argentina 2026 | — | 2,06 % (estimación) | — | 2,06 %: PBI real de 2026 = 609,23 × 1,0206 = 621,8, en el paso 1, en el 3 y en el simulador | estimación del FMI |
| Población de Argentina 2025 (millones) | 45,85 | 47,47 | **46,387** (Censo 2022) | 46,387 | no coinciden: el FMI usa la proyección anterior al censo (47.473.760, la del INDEC 2010-2040); el Banco Mundial usa la de las Naciones Unidas |
| PBI per cápita real de Argentina 2025 (USD de 2015) | 13.287 (con 45,85 millones) | — | — | 13.134 (609,23 / 46,387) | dos cifras por dos poblaciones; se usa la del INDEC |
| Inversión de Argentina 2025 (% del PBI) | 16,1 (formación bruta de capital) | 13,1 (inversión total) | FBCF a precios constantes de 2004: 19,4 (otra medida) | 16,1 | **no coinciden**: definiciones y precios distintos (H13) |
| Crecimiento real de otros países 2015-2025 | calculado de la serie en dólares de 2015 | `NGDP_RPCH` | — | Banco Mundial | coinciden en 0,5 puntos o menos en casi todos (Estados Unidos 2,2 contra 2,3; India 7,6 contra 7,8; Brasil, México, Chile en la tabla de Data); las mayores diferencias: Irlanda 2025 (12,3 contra 8,0), Australia 2021 (2,0 contra 5,4), Emiratos 2024 (4,0 contra 6,6), Libia 2025, Irán 2016 |

Referencia, en dólares **corrientes** (ya no se usa en los gráficos): el PBI de Argentina de 2025 es 683,1 (Banco Mundial) y 683,6 (FMI); para 2026 el FMI estima 768,2 (confirmado en su página; una respuesta de IA había dado 688,4, que no sale de la edición vigente). Entre 1980 y 1990 el valor en dólares corrientes de Argentina cambia mucho según el tipo de cambio que se use (1980: 77 contra 234), otra razón para usar el PBI real.

## 6. Datos para el modelo del PBI a 2056 (2026-10-14)

Cargados con el pipeline (`scripts/fetch_external_forecasts.py` baja los archivos; el adaptador `external_forecasts` los convierte; salida `data/processed/external_forecasts.json`, 1.287 registros; estado completo en [`model-data-status.md`](model-data-status.md)):

| Fuente | Qué trae | Cobertura |
|---|---|---|
| FMI, WEO (actualización 2026-09-30) | crecimiento real, inversión total, población | Argentina y diez países (Brasil, Chile, México, Colombia, Uruguay, Estados Unidos, China, India, Corea, España), 2025-2031 |
| OCDE, *Economic Outlook 117 long-term scenarios* | PBI real (moneda nacional, precios constantes), PBI potencial, población, población en edad de trabajar | Argentina, 2025-2056, seis escenarios (el crecimiento medio 2026-2056 va de 1,53 % a 1,94 %) |
| ONU, *World Population Prospects 2024* | población, fecundidad, esperanza de vida | Argentina, 2025-2056, variantes baja, media y alta (población 2056: 43,2; 48,0; 53,1 millones) |

No se usó ninguna medida en PPA (la OCDE las publica y se descartaron). Para el tope de 1,5 MB por archivo de la app, la OCDE y la ONU son solo de Argentina y llegan a 2056.

| # | Prioridad | Qué falta | Quién |
|---|---|---|---|
| M1 | 🔴 | Elegir cuál de los seis escenarios de la OCDE equivale a «esperado» en el modelo (quedaron como «no declarado»; la OCDE los distingue por transición energética y daño climático, no por optimismo) | Vos |
| M2 | 🟡 | Por qué la inversión del FMI salta de 13,1 % (2025) a 20,5 % (2031); revisar la tabla en <https://www.imf.org/external/datamapper/NID_NGDP@WEO/ARG> | Abrir |
| M3 | 🟡 | Ediciones viejas del WEO (abril y octubre de cada año) para medir cuánto se equivocaron los pronósticos de crecimiento de Argentina a 1, 3 y 5 años (`forecast_vintages`); la API solo da la edición actual | Vos, o otra IA |
| M4 | 🟡 | Proyecciones de ~2005 (INDEC revisión 2005 y ONU WPP 2004) para probar el modelo de población | Vos, o otra IA |
| M5 | 🟡 | Proyecciones del REM del BCRA (hasta 2 años), CEPAL, Banco Mundial *Global Economic Prospects* (2-3 años) y Consensus Forecasts: no tienen API abierta | Vos, o otra IA |
| M6 | 🟢 | Los escenarios SSP (IIASA) de PBI y población por país hasta 2100: requieren registro | Vos |
| M7 | 🟢 | Población por edad, tablas de mortalidad y fecundidad por edad 1990-2025 (la ONU las publica) | Yo, falta el contrato de datos |

## 4. Cómo se usa esta lista

1. La IA intenta primero conseguir cada dato (API, descarga, lectura del documento) y lo agrega a `docs/references.md` con su estado.
2. Lo que no puede, queda acá con el enlace exacto, qué falló y qué traer. Nunca se rellena ni se inventa un valor.
3. Cuando el dato llega, se mueve la fila a `references.md`, se conecta al gráfico y se saca de `PENDING.md` («Data to verify»).
