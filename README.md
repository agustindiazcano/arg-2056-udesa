![Argentina 2056 — Universidad de San Andrés, Data Science Lab y Contar con datos](docs/assets/readme-banner.png)

# Argentina 2056: del Cruce de los Andes a la Cuarta Revolución Industrial

Un relato interactivo, con datos, que une el Cruce de los Andes (1817) con el desafío de Argentina hacia 2056: recursos, economía, población y el impacto de la inteligencia artificial y la automatización (la «Cuarta Revolución Industrial» en el sentido de Klaus Schwab, Foro Económico Mundial).

- **Los Andes**: mapa 3D con satélite y relieve reales; la marcha de la columna principal del Ejército de los Andes, las otras columnas del cruce y el encuentro de las fuerzas, con figuras en miniatura.
- **Hacia el 2056** (antes «Recorrido»): una presentación guiada, con un índice y 17 diapositivas, con gráficos 2D y 3D (cada gráfico tiene su tabla). Incluye la diapositiva de **productividad** (PTF y producto por hora, Argentina, EE. UU., Chile y Brasil, con datos de la Penn World Table).
- **Simulador del PBI**: un gráfico grande del PBI hasta 2056 y, a la derecha, factores que se pueden mover (crecimiento base, IA, población, productividad, inversión). Usa aritmética simple sobre los supuestos elegidos.
- **Data**: una página con scroll con los datos de cada diapositiva en tablas, un selector (número y título de la diapositiva) para descargar sus datos como CSV, la descarga de cada tabla y, al final, los enlaces de las referencias (también descargables en CSV).
- **Proyecciones de otros organismos**: el FMI, la OCDE y la ONU están cargados con el pipeline de datos (`data/processed/external_forecasts.json`, `scripts/fetch_external_forecasts.py`) y se muestran en la página Data, en la diapositiva 2.
- **Data Dashboard** (oculto por ahora): economía, recursos, pronóstico 2056 con abanico de incertidumbre, revolución IA y simulador.

La incertidumbre se muestra como abanico de percentiles; las cifras en disputa, como rangos; los vacíos, como «sin dato». Los supuestos y las reglas de datos están en [`AGENTS.md`](AGENTS.md) y [`docs/assumptions.md`](docs/assumptions.md).

## Qué es

Un proyecto de **ciencia de datos y visualización**: toma datos abiertos de organismos oficiales e internacionales, los baja con un pipeline reproducible (cada archivo con su hash, su fuente y su fecha), los valida y los muestra en gráficos interactivos y mapas, 2D y 3D. Cada gráfico tiene su tabla, y cada número de la presentación está en la página Data con su referencia.

## Metodología y pipeline de datos

1. **Pipelines automatizados vía API:** Para las series macroeconómicas y sectoriales internacionales y nacionales (Banco Mundial, FMI, Secretaría de Energía y Secretaría de Agricultura), se implementaron scripts en Python que consultan sus APIs oficiales (REST, SDMX y CKAN). Estos scripts limpian, normalizan unidades (e.g. dólares reales constantes de 2015, barriles equivalentes, toneladas) y exportan los resultados a archivos JSON estructurados y versionados en el repositorio (`worldGdp.json`, `energyArgentina.json`, `agroArgentina.json`, `imfWeo.json`, entre otros).
2. **Extracción y normalización de fuentes oficiales:** Para publicaciones e informes periódicos que no cuentan con APIs abiertas (como las cuentas nacionales, informes de complejos exportadores y reportes de productividad del INDEC, o los informes de inversión de la Secretaría de Minería y USGS), los datos se extrajeron directamente de los documentos, cuadros estadísticos y balances oficiales primarios. Su consistencia interna y sumas de componentes se validan mediante pruebas automáticas.
3. **Arquitectura desacoplada y trazabilidad:** Los datos no están hardcodeados de manera estática ni aislada en la interfaz: el frontend consume exclusivamente estos datasets estructurados y versionados (JSON y módulos tipados con TypeScript). Cada registro cuenta con metadatos explícitos de trazabilidad: organismo emisor, enlace o identificador de publicación, fecha de captura, período relevado y unidad de medida.

## Stack

| Capa | Tecnología |
|---|---|
| Aplicación web | TypeScript (modo estricto), React 19, Vite, Zustand |
| Visualización | ECharts (gráficos y mapas 2D), Three.js (vistas 3D y la escena de los Andes), MapLibre GL (mapa satelital con relieve), GSAP (animaciones) |
| Datos y ciencia de datos | Python 3.12 (biblioteca estándar, `jsonschema`, NumPy). Pipeline en `scripts/datapipe`: archivos crudos registrados con hash, adaptadores puros, salidas reproducibles y validación contra esquemas JSON. Los cálculos estadísticos de la regla del 70 (tasa entre extremos, regresión de ln V contra el año con R² y residuos, ventanas móviles, tiempo exacto de duplicación) son un módulo de TypeScript puro, `web/src/core/doubling.ts` |
| Calidad | pytest, Vitest, Playwright con axe (accesibilidad), ESLint, Ruff, presupuestos de tamaño del bundle y de los datos |
| Entrega | GitHub Actions (CI) y Vercel |

## Las diapositivas de «Hacia el 2056»

La presentación abre en una diapositiva con el título y el índice (la 0), y tiene 6 más:

1. El PBI de Argentina desde 1960 (ranking mundial y de la región)
2. Recursos naturales (minería, hidrocarburos, agro y total: totales, treemap, torta o barras, provincias productoras y mapa; un botón muestra la producción por provincia)
3. La regla del 70 (calculadora, países reales, escenarios y proyecciones del FMI)
4. Composición del PBI y exportaciones por complejo (con un botón para ver las exportaciones por año y complejo)
5. Productividad
6. Cuarta revolución industrial: el impacto de la IA en la economía (tres escenarios a 2056, PBI por habitante y población)

## Cómo correrlo

```bash
cd web
npm ci
cp .env.example .env.local   # completar VITE_MAPTILER_KEY (satélite y relieve de MapTiler)
npm run dev
```

Sin `VITE_MAPTILER_KEY` la escena de los Andes muestra un aviso y un fondo liso. La clave queda en el bundle: restringila por origen en MapTiler. Antes de un push: `python scripts/precheck.py` (corre ruff, pytest, la validación de datos, el lint, el chequeo de tipos y los tests de la web). Los tests de la web: `cd web && npm test`; los de Python: `pytest`.

## Estructura

| Carpeta | Contenido |
|---|---|
| `web/` | Aplicación (Vite, React, TypeScript, MapLibre GL, Three.js, ECharts) |
| `model/` | Módulo de población por cohortes del modelo de pronóstico, en Python, con tests (diseño en `docs/model-design.md`) |
| `data/` | Archivos crudos con hash y fuente, salidas procesadas y esquemas JSON |
| `scripts/` | Pipeline de datos (`datapipe`), descargas de las fuentes, chequeos y `precheck.py` |
| `docs/` | Decisiones, supuestos, diseño y fuentes |

## Referencias

La lista completa, con qué dato sale de cada fuente, está en [`docs/references.md`](docs/references.md).

### Cruce de los Andes (1817)

1. UNCuyo, *Historia virtual de Mendoza*, «El Cruce de los Andes». <http://historiavirtual.mza.uncu.edu.ar/mendoza-independiente/cruce.html>
2. Los Andes (Mendoza), nota sobre el Cruce de los Andes, con las instrucciones de San Martín a Las Heras del 15-01-1817. <https://www.losandes.com.ar/el-historico-cruce-de-1817-por-juan-marcelo-calabria>
3. Diario de Cuyo, «Crónica de una epopeya», 2017-05-01. <https://www.diariodecuyo.com.ar/columnasdeopinion/Cronica-de-una-epopeya-20170501-0057.html>
4. Wikipedia, «Rutas sanmartinianas». <https://es.wikipedia.org/wiki/Rutas_sanmartinianas>
5. Wikipedia, «Batalla de Chacabuco». <https://es.wikipedia.org/wiki/Batalla_de_Chacabuco>
6. Museo Histórico Nacional, «El cruce de la Cordillera de los Andes». <https://museohistoriconacional.cultura.gob.ar/noticia/el-cruce-de-la-cordillera-de-los-andes/>
7. El Arcón de la Historia, «El cruce de la cordillera de los Andes (18/01/1817 al 08/02/1817)». <https://elarcondelahistoria.com/el-cruce-de-la-cordillera-de-los-andes-18011817-al-08021817/>
8. Estado general del Ejército de los Andes (Mendoza, 31-12-1816), en Espejo, *El paso de los Andes* (por verificar en el original).
9. Plano de la batalla de Chacabuco coordinado por B. Mitre, en *Historia de San Martín*. <https://www.memoriachilena.gob.cl/602/w3-article-546948.html>
10. Municipalidad de Chacabuco, «Batalla de Chacabuco» (orden de batalla). <https://chacabuco.gob.ar/wp-content/uploads/nuestraciudad/Batalla_Chacabuco.pdf>
11. Todo Argentina, «San Martín: batalla de Chacabuco». <https://www.todo-argentina.net/biografias/san_martin/mili016.htm>
12. Foro Defensa Nacional, «El Cruce de Los Andes». <https://defensanacional.foroactivo.com/t4878-el-cruce-de-los-andes>
13. Diario El Tiempo, «El general San Martín y el Azul». <https://www.diarioeltiempo.com.ar/nota-el-general-san-martin-y-el-azul-166860>
14. Wikipedia, «Cruce de los Andes». <https://es.wikipedia.org/wiki/Cruce_de_los_Andes>
15. Resolución 258/2013 de SENASA (altura del Espinacito). <https://www.argentina.gob.ar/normativa/nacional/norma-216719/texto>
16. El Bibliote, «Logística del Ejército de los Andes». <https://elbibliote.com/resources/Temas/html/1468.php>
17. Felipe Pigna, «12 de febrero de 1817: la batalla de Chacabuco», El Historiador (con el parte de San Martín). <https://elhistoriador.com.ar/12-de-febrero-de-1817-la-batalla-de-chacabuco/>
18. Museo Histórico Nacional, «La batalla de Chacabuco». <https://museohistoriconacional.cultura.gob.ar/noticia/la-batalla-de-chacabuco/>
19. Academia de Historia Militar de Chile, «Batalla de Chacabuco». <https://www.academiahistoriamilitar.cl/academia/batalla-de-chacabuco/>
20. Infobae, «Batalla de Chacabuco: la urgencia de San Martín, el arriesgado ataque de O'Higgins y la carga letal de los Granaderos» (12-02-2026). <https://www.infobae.com/historia/2026/02/12/batalla-de-chacabuco-la-urgencia-de-san-martin-el-arriesgado-ataque-de-ohiggins-y-la-carga-letal-de-los-granaderos>

Las cifras de bajas de Chacabuco no coinciden entre las fuentes 5, 10, 17, 18, 19 y 20: la pantalla usa las del parte de San Martín y dice cuáles son las otras.

### Mapa y terreno

21. MapTiler: imágenes satelitales, modelo de elevación Terrain-RGB v2 y geocodificador. <https://www.maptiler.com>
22. © OpenStreetMap contributors (nombres y posiciones de los lugares). <https://www.openstreetmap.org/copyright>

### Marco conceptual

23. Schwab, K. (2016). *La Cuarta Revolución Industrial*. Foro Económico Mundial.

### Productividad (diapositiva 5 de «Hacia el 2056», y el simulador)

24. INDEC, Documento de trabajo N.º 52, *Productividad y stock de capital* (PTF y productividad laboral 2016-2025). <https://www.indec.gob.ar/ftp/cuadros/economia/productividad_stock_capital_10_26.pdf>
25. Baumann Fonay, I. (2026). «PTF y PIB potencial de Argentina, 1990-2025». <https://macroargentina.substack.com/p/ptf-y-pib-potencial-de-argentina>, y su serie en Alphacast <https://www.alphacast.io/datasets/potential-gross-domestic-product-output-gap-tfp-53419>
26. Penn World Table 11.0 (Groningen Growth and Development Centre), vía FRED. <https://www.rug.nl/ggdc/productivity/pwt/> y <https://fred.stlouisfed.org/series/EMPENGARA148NRUG> (empleo de Argentina)
27. Acemoglu, D. (2024). «The Simple Macroeconomics of AI». NBER Working Paper 32487. <https://www.nber.org/papers/w32487>

Las dos mediciones de la PTF de 2025 no coinciden (INDEC +2,8 %, Baumann +4,2 %); la PWT llega hasta 2023. Las demás fuentes de la sección 4.1 de [`docs/references.md`](docs/references.md) (literatura de IA, contexto, descartadas) y su estado están allí.

### Economía, comercio, recursos y proyecciones (Recorrido «Hacia el 2056» y Data)

Todos los enlaces de los datos que usa la aplicación. La misma lista se ve en la sección Data de la aplicación y, con el detalle de cada cifra, en [`docs/references.md`](docs/references.md).

**PBI, población y proyecciones**

28. Banco Mundial, WDI: PBI real en dólares constantes de 2015 (`NY.GDP.MKTP.KD`) y población, todos los países, 1960-2025. <https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.KD>
29. Banco Mundial, WDI, Argentina (PBI, población, PBI per cápita, exportaciones, crecimiento, formación de capital). <https://api.worldbank.org/v2/country/ARG/indicator/>
30. INDEC, Estimaciones y proyecciones de población 2022-2040 (Censo 2022). <https://www.indec.gob.ar/ftp/cuadros/publicaciones/proyecciones_nacionales_2022_2040.pdf>
31. FMI, World Economic Outlook (actualización del 2026-09-30): crecimiento real, inversión y población. <https://www.imf.org/external/datamapper/NGDPD@WEO/ARG> y <https://www.imf.org/en/Publications/WEO>
32. OCDE, Economic Outlook 117, escenarios de largo plazo (PBI real, potencial y población de Argentina hasta 2056). <https://sdmx.oecd.org/public/rest/dataflow/OECD.ECO.MAD/DSD_EO_LTB@DF_EO_LTB/1.0>
33. ONU, World Population Prospects 2024. <https://population.un.org/wpp/downloads>
34. INDEC, Informe de avance del nivel de actividad, 2.º trimestre de 2026 (valor agregado por sector). <https://www.indec.gob.ar/uploads/informesdeprensa/pib_09_26065D6A3612.pdf>

**Exportaciones y servicios**

35. INDEC, Complejos exportadores, año 2025. <https://www.indec.gob.ar/uploads/informesdeprensa/complejos_03_2686A1604947.pdf>
36. INDEC, Intercambio comercial argentino, agosto de 2026. <https://www.indec.gob.ar/uploads/informesdeprensa/ica_08_26E158B1D119.pdf>
37. CEI (Cancillería), Análisis del comercio de servicios de la Argentina 2026, con base en la balanza de pagos del INDEC. <https://cvigo.cancilleria.gob.ar/userfiles/2026-06_analisis_del_comercio_de_servicios_de_la_argentina_2026.pdf>

**Minería**

38. Secretaría de Minería, ARMINERA 2025 (cartera de proyectos, exportaciones, recursos y reservas). <https://www.argentina.gob.ar/sites/default/files/mayo_2025_-_arminera.pdf>
39. Secretaría de Minería, Origen provincial de las exportaciones mineras (informes mensuales). <https://www.argentina.gob.ar/sites/default/files/2026.09_origen_provincial_de_las_exportaciones_mineras.pdf> (enero-agosto de 2026) y <https://www.argentina.gob.ar/sites/default/files/2026.01_origen_provincial_de_las_exportaciones_mineras.pdf> (2025 completo)
40. USGS, Mineral Commodity Summaries 2026 (litio). <https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-lithium.pdf>
41. First Quantum, informe técnico NI 43-101 de Taca Taca (2026-02-19). <https://www.first-quantum.com/wp-content/uploads/2026/02/NR-26-06-First-Quantum-Files-Taca-Taca-43-101-Technical-Report-FINAL.pdf>

**Petróleo, gas y agro**

42. Secretaría de Energía, datos abiertos (producción por provincia, serie desde 1950 y reservas al 31-12-2025). <https://datos.energia.gob.ar>
43. IAE, Vaca Muerta: análisis 2025. <https://www.iae.org.ar/wp-content/uploads/2026/03/Vaca-Muerta_analisis-2025_vmo_260330_155248.pdf>
44. MAGyP, series anuales de soja, maíz, trigo y girasol (datos.gob.ar). <https://datos.gob.ar/dataset?q=siembra+cosecha+produccion+rendimiento>

**Proyectos del RIGI** (prensa, sin verificar; la lista oficial está en <https://www.argentina.gob.ar/economia/rigi>; <https://rigi.ar> es un sitio privado, no oficial)

45. Chequeado (2026-10-02), 47 registrados, 23 aprobados por US$49.700 millones, con datos del Ministerio de Economía. <https://chequeado.com/el-explicador/el-gobierno-anuncio-en-paris-2-nuevos-rigi-cuantos-proyectos-se-aprobaron-y-cuantos-dolares-ingresaron-hasta-ahora/>
46. iProfesional, RIGI minero: 13 proyectos y US$25.230 millones. <https://www.iprofesional.com/energia/465973-rigi-minero-suma-13-proyectos-y-25230-millones-de-dolares-de-inversion-en-argentina>
47. Shale24, mapa del RIGI. <https://www.shale24.com/oil-gas/mapa-definitivo-rigi-proyectos-aprobaron-cuales-quedan-2026-n276>
48. La Nación, más de 20 proyectos aprobados. <https://www.lanacion.com.ar/economia/rigi-hay-mas-de-20-proyectos-aprobados-con-una-inversion-total-de-casi-us50000-millones-nid15082026/>
49. Infobae, dos proyectos mineros (2026-05-14). <https://www.infobae.com/economia/2026/05/14/el-gobierno-aprobo-dos-nuevos-proyectos-mineros-bajo-el-rigi-por-usd-2130-millones/>
50. Infobae, otros dos proyectos mineros (2026-02-27). <https://www.infobae.com/economia/2026/02/27/el-gobierno-aprobo-otros-dos-proyectos-mineros-bajo-el-rigi-sumaran-usd-1140-millones-en-inversiones/>
51. LM Neuquén, Vaca Muerta Sur. <https://www.lmneuquen.com/neuquen/aprueban-el-rigi-vaca-muerta-sur-un-proyecto-clave-n1179960>
52. El Cronista, gasoducto de Southern Energy. <https://www.cronista.com/negocios/el-gobierno-aprueba-el-rigi-para-el-gasoducto-de-us-1300-millones-que-southern-energy-hara-para-exportar-gnl-de-vaca-muerta/>
53. Diario Crónica (2026-10-09), Los Toldos II Este, Tecpetrol. <https://www.diariocronica.com.ar/noticias/2026/10/09/171375-nacion-aprobo-un-nuevo-rigi-para-vaca-muerta-invertiran-mas-de-us6400-millones>
54. El Economista, Los Toldos II Este: US$6.432 millones, Resolución 1771/2026. <https://eleconomista.com.ar/energia/los-toldos-luz-verde-megaproyecto-petrolero-us6432-millones-n98753/amp>
55. LM Neuquén, proyectos mineros en construcción. <https://mase.lmneuquen.com/mineria/argentina-uno-uno-los-proyectos-mineros-que-ya-estan-construccion-n1246226>
56. Infobae (2026-05-16), LLL Oil, YPF. <https://www.infobae.com/economia/2026/05/16/lll-oil-como-es-el-megaproyecto-de-ypf-en-vaca-muerta-que-busca-generar-mas-de-usd-100000-millones-en-exportaciones/>
57. LM Neuquén, inversiones comprometidas en Vaca Muerta en 2026. <https://mase.lmneuquen.com/empresas/vaca-muerta-los-yacimientos-mayores-compromisos-inversiones-2026-n1242081>

### Inteligencia artificial y el PBI (diapositiva 6 de «Hacia el 2056», y el simulador)

Escenarios de crecimiento de Argentina con IA y estimaciones de otros analistas.

58. Anthropic / Korinek y otros (2026), escenarios de la IA a 2030 para EE.UU. <https://www.anthropic.com/features/econ-scenarios>
59. PwC (2025), *Value in Motion*: hasta 15 puntos del PBI mundial hacia 2035. <https://www.pwccn.com/en/press-room/press-releases/pr-290425.html>
60. Goldman Sachs, la IA podría empezar a sumar al PBI de EE.UU. en 2027. <https://www.goldmansachs.com/insights/articles/ai-may-start-to-boost-us-gdp-in-2027>
61. Oxford Economics, modelado del impacto macroeconómico de la IA. <https://www.oxfordeconomics.com/resource/ai-macroeconomic-impact-modelling/>
62. Reuters (2026-10-13), el FMI dice que la inversión en IA sostiene el crecimiento mundial. <https://www.reuters.com/world/china/imf-says-ai-investment-propping-up-global-growth-war-debt-threaten-outlook-2026-10-13/>
63. OMC (2025), *World Trade Report*: PBI mundial +12-13 % hacia 2040. <https://www.wto.org/english/blogs_e/data_blog_e/blog_dta_29sep25_e.htm>
64. CEPR, «Mind the gap: the global impact of AI». <https://cepr.org/voxeu/columns/global-impact-ai-mind-gap>
65. Acemoglu, D. (MIT), «A new look at the economics of AI». <https://mitsloan.mit.edu/ideas-made-to-matter/a-new-look-economics-ai>
66. Penn Wharton Budget Model, «How AI could lift productivity and GDP growth». <https://knowledge.wharton.upenn.edu/articles/how-ai-could-lift-productivity-and-gdp-growth/>
67. Forecasting Research Institute, efectos económicos de la IA. <https://forecastingresearch.org/economic-effects-of-ai>

### Desarrollo humano, educación, población y difusión tecnológica (diapositivas 7 y 8 de «Hacia el 2056»)

68. PNUD (UNDP), Human Development Report: serie histórica del IDH de Argentina (1990-2023) y comparación LATAM. <https://hdr.undp.org/data-center/human-development-index>
69. OCDE, Resultados PISA (2012, 2018, 2022): puntajes medios en lectura, matemática y ciencias para Argentina y la región. <https://www.oecd.org/pisa/>
70. Stanford Institute for Human-Centered Artificial Intelligence (HAI), *Artificial Intelligence Index Report 2024*: costos de entrenamiento, cómputo y eficiencia de inferencia. <https://aiindex.stanford.edu/report/>
71. INDEC, Censo Nacional de Población, Hogares y Viviendas 2022: resultados definitivos por provincia (45.892.285 habitantes). <https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165>
72. INDEC, Origen provincial de las exportaciones (OPEX): informes técnicos anuales 2023 y 2024 por provincia y grandes rubros. <https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-2-40>


### Referencias complementarias de Data

Enlaces adicionales del catálogo de la sección Data (`web/src/datasets/references.ts`). Se conservan sus identificadores y estados de verificación; su inclusión no implica una nueva verificación de las fuentes originales.

**Cruce de los Andes**

- **H6** (leída): UNCuyo, Historia virtual de Mendoza, «El Cruce de los Andes». <https://historiavirtual.mza.uncu.edu.ar/mendoza-independiente/cruce.html>
- **H8** (por informe): Estado general del Ejército de los Andes (31-12-1816), en Espejo, El paso de los Andes. <https://archive.org/details/elpasodelosande00espegoog>

**Productividad**

- **P3** (citada): Baumann Fonay, serie de PTF y PIB potencial en Alphacast (los datos piden login). <https://www.alphacast.io/datasets/potential-gross-domestic-product-output-gap-tfp-9670>
- **P4** (leída): Baumann Fonay en X (análisis de productividad y PTF). <https://x.com/ivanfbf/status/2050931628965278028>
- **P5** (leída): Ministerio de Hacienda (2018), Crecimiento económico, PTF y PIB potencial en Argentina, Documento de trabajo n.º 1. <https://www.argentina.gob.ar/sites/default/files/crecimiento-economico-ptf-y-pib-potencial-en-argentina_1.pdf>
- **P9** (leída): Anthropic, Estimating productivity gains. <https://www.anthropic.com/research/estimating-productivity-gains>
- **P10c** (leída): METR (2025), Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity: 19 % más tiempo con IA (desactualizado según METR). <https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/>
- **P10d** (leída): Becker, Rush, Barnes y Rein (2025), el mismo estudio de METR en arXiv. <https://arxiv.org/abs/2507.09089>
- **P10a** (citada): METR (19 % más lentos con IA), vía InfoQ. <https://www.infoq.com/news/2025/07/ai-productivity>
- **P10b** (citada): METR, vía eWeek. <https://www.eweek.com/news/news-ai-tools-slow-developer-productivity-study/>
- **P11a** (contexto): BID/INTAL, la IA en América Latina y el Caribe. <https://www.iadb.org/es/noticias/inteligencia-artificial-trae-amplios-beneficios-america-latina-y-el-caribe-estudio-bid>
- **P11b** (contexto): FGV IBRE, productividad de Brasil 2024. <https://blogdoibre.fgv.br/node/2057>
- **P11c** (contexto): BLS, productividad de Estados Unidos. <https://www.bls.gov/news.release/prod2.nr0.htm>
- **P11d** (contexto): OECD, PBI por hora trabajada. <https://www.oecd.org/es/data/indicators/gdp-per-hour-worked.html>
- **P11e** (contexto): DBnomics, espejo de la Penn World Table 10. <https://db.nomics.world/GGDC/penn10>
- **P11f** (contexto): ABC (Paraguay), productividad regional. <https://www.abc.com.py/economia/2026/07/31/la-productividad-regional-cayo-04-anual-la-ia-busca-revertir-la-tendencia/>
- **P12** (descartada): The Conference Board, TED summary tables (daba +6,8 % para Brasil en 2024, contradice a FGV). <https://www.conference-board.org/pdf_free/TED-SummaryTables-Charts-sep2025.pdf>
- **P13a** (secundaria): El Observador (Uruguay) sobre el documento del INDEC. <https://www.elobservador.com.uy/argentina/economia-y-negocios/la-productividad-argentina-crecio-al-ritmo-mas-alto-1996-pero-cae-la-calidad-del-empleo-n6042872>
- **P13b** (secundaria): Derecha Diario sobre el documento del INDEC. <https://derechadiario.com.ar/economia/productividad-registro-en-2025-mayor-avance-en-20-anos-bajo-gobierno-milei>

**Desarrollo social**

- **W1** (leída): Banco Mundial, World Development Indicators (WDI): esperanza de vida al nacer (SP.DYN.LE00.IN), mortalidad infantil (SP.DYN.IMRT.IN), índice de Gini (SI.POV.GINI), matrícula secundaria y terciaria (SE.SEC.ENRR, SE.TER.ENRR), años esperados de escolaridad (SE.SCH.LIFE) y gasto público en educación (SE.XPD.TOTL.GD.ZS). <https://data.worldbank.org/indicator/>

**Recursos naturales**

- **R15** (citada): Bolsa de Comercio de Rosario, Balance cárnico y lácteo 2025 (Expoagro, 2026-01-05): carne bovina, aviar y porcina y leche de 2025, estimados. <https://www.expoagro.com.ar/balance-carnico-y-lacteo-2025/>

**Proyectos RIGI**

- **R14** (leída): Ministerio de Economía y Secretaría de Coordinación de Producción, Registro oficial del RIGI y resoluciones publicadas en el Boletín Oficial (Resolución 1771/2026 y concordantes). <https://www.boletinoficial.gob.ar>

**Mapa**

- **M1** (usada): MapTiler, imágenes satelitales. <https://www.maptiler.com/cloud/>
- **M2** (usada): MapTiler, modelo de elevación Terrain-RGB v2. <https://docs.maptiler.com/cloud/api/tiles/>
- **M3** (usada): MapTiler Geocoding. <https://docs.maptiler.com/cloud/api/geocoding/>
- **M6** (usada): MapLibre GL JS. <https://maplibre.org>
- **M7** (usada): Three.js. <https://threejs.org>

**Inteligencia artificial**

- **A20** (citada): IVA RG 4240: qué es y cuánto se paga en 2026 (IVA de 21 % sobre servicios digitales del exterior). <https://nacho.com.ar/iva-netflix-cobraran-el-impuesto-a-los-usuarios-de-servicios-digitales/>
- **A21** (citada): Global66, impuestos y percepción de Ganancias del 30 % (RG 5617) en compras y suscripciones en dólares, 2026. <https://www.global66.com/blog/como-afectan-los-impuestos-a-tus-gastos-digitales/>
- **A22** (citada): SentiSight, precios de las suscripciones de IA en 2026 (ChatGPT, Claude, Gemini). <https://www.sentisight.ai/ai-price-comparison-gemini-chatgpt-claude-grok/>
- **D7** (leída): Epoch AI, Compute Trends Across Three Eras of Machine Learning: cómputo de entrenamiento en FLOPs. <https://epoch.ai/blog/compute-trends-across-three-eras-of-machine-learning>

**Difusión tecnológica**

- **D6** (leída): Comin & Hobijn / NBER & Our World in Data, CHAT dataset: rezagos históricos de adopción masiva (>50%). <https://ourworldindata.org/technology-adoption>

**Agro**

- **E12** (leída): SAGyP (Secretaría de Agricultura, Ganadería y Pesca), Estimaciones agrícolas por cultivo y provincia (campaña 2024/25, datos.gob.ar). <https://datos.magyp.gob.ar/dataset/estimaciones-agricolas>

**Perfil provincial**

- **S1** (leída): Dirección Nacional de Asuntos Provinciales (DNAP) y Secretaría de Hacienda (Ministerio de Economía), Distribución geográfica del Producto Bruto y Valor Agregado Bruto provincial. <https://www.argentina.gob.ar/economia/hacienda/asuntosprovinciales>
- **S2** (leída): Secretaría de Trabajo, Empleo y Seguridad Social (Ministerio de Capital Humano), OEDE / SIPA: Puestos de trabajo registrados del sector privado y público por provincia (2024-2025). <https://www.trabajo.gob.ar/estadisticas/oede/estadisticasprovinciales.asp>
- **S3** (leída): INDEC, Encuesta Permanente de Hogares (EPH), Tasas de pobreza e indigencia por aglomerados urbanos (2024-2025). <https://www.indec.gob.ar/indec/web/Nivel4-Tema-4-46-152>
- **S4** (leída): Ministerio de Economía, Dirección Nacional de Asuntos Provinciales (DNAP), Coparticipación federal y transferencias automáticas a provincias. <https://www.argentina.gob.ar/economia/hacienda/asuntosprovinciales/transferencias-gobiernos-locales>
- **S6** (citada): PNUD Argentina, El Mapa del Desarrollo Humano en Argentina (IDH provincial, 2021); los valores se tomaron de la tabla de Wikipedia que lo reproduce. <https://www.undp.org/es/argentina/publicaciones/el-mapa-del-desarrollo-humano-en-argentina>
- **S5** (leída): Ministerio de Seguridad de la Nación, Sistema Nacional de Información Criminal (SNIC), Tasas de presuntos hechos delictuosos por provincia cada 100.000 habitantes. <https://www.argentina.gob.ar/seguridad/estadisticas-criminales>


### IA: acceso, adopción, tokens e I+D (consulta 30-10-2026)

La diapositiva 9 incorpora mapa LATAM y precios por token. Al final se agregan adopción empresarial, consumo de tokens, pirámide de adopción e I+D. Definiciones y límites: [registro de evidencia](docs/ai-evidence-2026-10-30.md).

- **AI55** (leída): OpenAI, Research acceleration: The view inside OpenAI (06-09-2026): encuesta y telemetría interna; evidencia autodeclarada, no ensayo causal. <https://openai.com/index/research-acceleration-view-inside-openai/>
- **AI30** (leída): Anthropic, precios oficiales de Claude Pro, Max, Ultra y API (consulta 30-10-2026). <https://claude.com/pricing>
- **AI31** (leída): OpenAI, precios oficiales de API: GPT-6.1 Sol, tarifa Standard, contexto corto. <https://developers.openai.com/api/docs/pricing>
- **AI32** (leída): Google, precios de Gemini API: Gemini 2.5 Pro, Standard, contexto hasta 200.000 tokens. <https://ai.google.dev/gemini-api/docs/pricing>
- **AI33** (leída): xAI / SpaceXSI, Grok 4.7: modelos y precios de API. <https://docs.x.ai/developers/models>
- **AI34** (leída): Cursor, Models & Pricing: costos dependen del modelo, del plan y del uso. <https://cursor.com/docs/models-and-pricing>
- **AI35** (leída): Gallup, Frequent Use of AI in the Workplace Continued to Rise in Q4 (25-01-2026; trabajo de campo Q4 2025, EE. UU.). <https://www.gallup.com/workplace/701195/frequent-workplace-continued-rise.aspx>
- **AI36** (leída): Yu et al., MIT FutureTech / CMU, AI Adoption in S&P 500 Firms (2026): integración empresarial en 2025; preprint. <https://arxiv.org/abs/2607.08920>
- **AI37** (leída): Yotzov et al., Firms predict an AI productivity boom is coming, VoxEU/CEPR (2026), autores de Firm Data on AI, NBER 34836. <https://cepr.org/voxeu/columns/firms-predict-ai-productivity-boom-coming>
- **AI38** (leída): OpenAI, Scaling AI for everyone (27-02-2026): más de 900 millones de usuarios semanales y 50 millones de suscriptores de consumo. <https://openai.com/index/scaling-ai-for-everyone/>
- **AI39** (leída): ONU, World Population Prospects 2024, Summary of Results: población mundial de 8.200 millones en 2024. <https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/wpp2024_summary_of_results_final_web.pdf>
- **AI40** (leída): Anthropic Economic Index, Cadences (26-06-2026): tokens por conversación y artefacto; percentiles normalizados, no usuarios mensuales. <https://www.anthropic.com/research/economic-index-june-2026-report>
- **AI41** (leída): Google, Alphabet investor presentation (junio 2026): 3,2 × 10^15 tokens mensuales en sus productos y APIs. <https://blog.google/alphabet/investor-presentation-june-2026/>
- **AI42** (leída): OpenAI, The next phase of enterprise AI (08-04-2026): más de 15.000 millones de tokens por minuto en API. <https://openai.com/index/next-phase-of-enterprise-ai/>
- **AI43** (leída): OpenRouter, State of AI 2025: más de 100 billones (10^14) de tokens de su plataforma; muestra no representativa del mercado entero. <https://openrouter.ai/state-of-ai>
- **AI44** (leída): arXiv, Monthly Submissions: conteos mensuales oficiales de nuevos envíos; CSV consultado el 30-10-2026. <https://arxiv.org/stats/monthly_submissions>
- **AI45** (leída): Preprints.org, Annual Report 2025, página 3: 31.691 preprints publicados en 2025. <https://www.preprints.org/frontend/home/report/2025-annual-report>
- **AI46** (leída): SocArXiv, informe de 2025 (2026): 3.162 trabajos aceptados; no equivale al total de envíos. <https://socopen.org/2026/>
- **AI47** (leída): Google Research, Accelerating scientific breakthroughs with an AI co-scientist (2025): hipótesis y validación experimental previa. <https://research.google/blog/accelerating-scientific-breakthroughs-with-an-ai-co-scientist/>
- **AI48** (leída): ARCA, percepción por operaciones en moneda extranjera: alícuota del 30 %, según operación y forma de pago. <https://www.afip.gob.ar/regimen-devolucion-percepciones/percepcion/importe.asp>
- **AI49** (leída): ARCA, servicios digitales: IVA sobre servicios consumidos en Argentina y prestados desde el exterior. <https://www.afip.gob.ar/iva/servicios-digitales/obligados.asp>
- **AI50** (leída): SII Chile, Circular 42/2020, IVA a servicios digitales prestados desde el exterior. <https://www.sii.cl/normativa_legislacion/circulares/2020/circu42.pdf>
- **AI51** (leída): SAT México, guía de declaración del IVA de servicios digitales: tasa del 16 %. <https://sat.gob.mx/cs/Satellite?blobcol=urldata&blobkey=id&blobtable=MungoBlobs&blobwhere=1461175010301&ssbinary=true>
- **AI52** (leída): DGI Uruguay, bienes y servicios gravados a la tasa básica del 22 %. <https://www.gub.uy/direccion-general-impositiva/comunicacion/publicaciones/son-bienes-servicios-gravados-tasa-basica-del-22>
- **AI53** (usada): Natural Earth, Admin 0 Countries 1:110m, dominio público; geometría ilustrativa de América Latina. <https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/>
- **AI54** (contexto): Global AI Adoption Visualization, AI Bear: referencia visual de la infografía viral; cifras reemplazadas por fuentes primarias, sin sumar usuarios de distintas plataformas. <https://www.ai-bear.io/p/are-you-among-16-of-free-ai-users>
- **AI56** (leída): Jellyfish, 2026 Software Engineering Metrics Report: distribución de consumo mensual de tokens por ingeniero (mediana 51 M, P90 380 M, P99 1.350 M). <https://jellyfish.co/library/state-of-engineering-management/>
- **AI57** (leída): Anthropic, Claude Code — Manage costs effectively y Prompt caching: el código y el contexto se reenvían en cada turno; la lectura de caché reduce hasta 90 % el costo en dólares pero cuenta en el volumen de tokens procesados. <https://docs.anthropic.com/en/docs/claude-code/costs>
- **AI58** (contexto): CCgather, Claude Code Leaderboard: registro comunitario de usuarios intensivos de programación agéntica (1.000 M a >15.000 M de tokens mensuales). <https://ccgather.com>
- **AI59** (leída): Briggs, J. y Kodnani, D. (2023), Goldman Sachs Global Investment Research, The Potentially Large Effects of Artificial Intelligence on Economic Growth: +7 % del PBI global (~7 billones de USD) y +1,5 pp anuales de productividad en economías desarrolladas durante una década. <https://www.gspublishing.com/content/research/en/reports/2023/03/27/d64e052b-0f6e-45d7-967b-d7be35fabd16.html>
- **AI60** (leída): Cerutti, E. et al. (2025), FMI Working Paper WP/25/76, AI Adoption and Inequality: Mind the Gap: brecha estructural en ganancias de PTF entre economías avanzadas (+0,8 a +1,3 % acumulado a 10 años) y emergentes (+0,1 a +0,4 %). <https://www.imf.org/en/Publications/WP/Issues/2025/04/11/AI-Adoption-and-Inequality-Mind-the-Gap-566125>
- **AI61** (leída): Cazzaniga, M. et al. (2024), FMI Staff Discussion Note SDN/2024/001 y AI Preparedness Index (AIPI): índice de preparación para la IA (0,68 en economías avanzadas frente a 0,46–0,48 en Argentina y América Latina). <https://www.imf.org/en/Blogs/Articles/2024/06/17/mapping-the-worlds-readiness-for-artificial-intelligence-shows-prospects-diverge>
- **AI62** (leída): Anthropic (2025), Anthropic Economic Index: Geography and Enterprise Usage (arXiv:2511.15080): elasticidad ingreso-uso de IA (~0,7 % más de uso per cápita por cada 1 % de mayor PBI per cápita) y sesgo hacia países de altos ingresos. <https://arxiv.org/abs/2511.15080>
- **AI63** (leída): OCDE, CIAT y BID (2021–2025), VAT Digital Toolkit for Latin America and the Caribbean: alícuotas de IVA a servicios digitales transfronterizos en América Latina y el Caribe. <https://www.oecd.org/en/publications/vat-digital-toolkit-for-latin-america-and-the-caribbean_ff3da3bd-en.html>
- **AI64** (leída): SUNAT Perú, Decreto Legislativo N.º 1623 (vigente desde diciembre de 2024): aplicación del IGV del 18 % a servicios digitales prestados por proveedores no domiciliados. <https://orientacion.sunat.gob.pe/servicios-digitales>
- **AI65** (leída): Receita Federal do Brasil, Decreto N.º 12.499/2025: alícuota unificada de IOF del 3,5 % sobre compras y suscripciones internacionales con tarjeta en moneda extranjera. <https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12499.htm>
- **AI66** (leída): Microsoft AI Economy Institute (2026), Global AI Diffusion Report: ~18,8 % de la población mundial en edad activa utiliza herramientas de IA generativa (ChatGPT, Gemini, Copilot, Claude, Meta AI, DeepSeek); 28,8 % en el Norte Global vs. 16,2 % en el Sur Global. <https://www.microsoft.com/en-us/research/group/ai-economy-institute/>
- **AI67** (leída): Menlo Ventures (2025), 2025: The State of Generative AI in the Enterprise: participación empresarial en modelos de lenguaje liderada por Anthropic Claude (~40 %), OpenAI (~27 %) y Google Gemini (~21 %). <https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/>
- **AI68** (leída): Jellyfish (2026), The State of AI in Software Engineering: telemetría de miles de ingenieros en empresas (Claude Code, Cursor, GitHub Copilot); mediana ~81 USD/mes (51 M tokens), quintil superior ~2.500 M tokens/mes y P99 de gasto ~2.452 USD/mes. <https://jellyfish.co/state-of-ai-software-engineering/>
- **AI69** (leída): WorkOS / Nicholas Arcolano, Head of AI Research en Jellyfish (2026), Token Maxing and Diminishing Returns: el top 2 % de ingenieros consume ~500 M de tokens por semana (~2.000–2.200 M/mes) en flujos multi-agente. <https://workos.com/blog/nicholas-arcolano-jellyfish-token-maxing-diminishing-returns>
- **AI70** (leída): VibeCafé (abril 2026), Token Consumption Percentiles: distribución empírica P95–P99 de 63,4 M a 247 M tokens/día (~1.900 M a 7.400 M/mes) y P99 en Claude Code de ~160 M tokens/día (~4.800 M/mes). <https://vibecafe.ai/blogs/token-consumption-percentiles>
- **AI71** (leída): Cursor Insights (2026), The Asymmetry of Token Consumption: el 10 % superior de usuarios concentra cerca de dos tercios de todos los tokens consumidos. <https://cursor.com/insights/the-asymmetry-of-token-consumption>
- **AI72** (leída): Epoch AI (2026), OpenAI Coding Agent Spending: análisis del consumo interno de investigadores de OpenAI en agentes de código (mediana >600 USD/día y P90 >7.000 USD/día API). <https://epoch.ai/data-insights/openai-coding-agent-spending>
- **AI73** (leída): Jellyfish (2026), Tokenomics for Your 2027 R&D Budget y Is Tokenmaxxing Cost-Effective?: análisis de quintiles corporativos y presupuestos de I+D en ingeniería asistida por IA. <https://jellyfish.co/blog/tokenomics-2027-rd-budget/>
- **AI74** (leída): The Pragmatic Engineer (Gergely Orosz, 2026), The Pulse: Interesting AI Coding Stats: síntesis de telemetría de consumo de tokens y adopción en equipos de ingeniería. <https://newsletter.pragmaticengineer.com/p/the-pulse-interesting-ai-coding-stats>

> Las posiciones de los lugares son aproximadas, las fechas intermedias entre las documentadas son estimaciones marcadas como tales, y las cifras de efectivos varían según la fuente. Todo está señalado en [`docs/references.md`](docs/references.md).

