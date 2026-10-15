# Argentina 2056: del Cruce de los Andes a la Cuarta Revolución Industrial

Un relato interactivo, con datos, que une el Cruce de los Andes (1817) con el desafío de Argentina hacia 2056: recursos, economía, población y el impacto de la inteligencia artificial y la automatización (la «Cuarta Revolución Industrial» en el sentido de Klaus Schwab, Foro Económico Mundial).

- **Los Andes**: mapa 3D con satélite y relieve reales; la marcha de la columna principal del Ejército de los Andes, las otras columnas del cruce y el encuentro de las fuerzas, con figuras en miniatura.
- **Hacia el 2056** (antes «Recorrido»): una presentación guiada con gráficos 2D y 3D (cada gráfico tiene su tabla). Incluye la diapositiva de **productividad** (PTF y producto por hora, Argentina, EE. UU., Chile y Brasil, con datos de la Penn World Table).
- **Simulador del PBI**: un gráfico grande del PBI hasta 2056 y, a la derecha, factores que se pueden mover (crecimiento base, IA, población, productividad, inversión). Es una ilustración con aritmética simple, no el modelo.
- **Data**: una página con scroll con los datos de cada diapositiva en tablas, un selector (número y título de la diapositiva) para descargar sus datos como CSV, la descarga de cada tabla y, al final, los enlaces de las referencias (también descargables en CSV).
- **Proyecciones de otros organismos**: el FMI, la OCDE y la ONU están cargados con el pipeline de datos (`data/processed/external_forecasts.json`, `scripts/fetch_external_forecasts.py`) y se muestran en la página Data, en la diapositiva 1; el estado de cada serie del modelo está en [`docs/model-data-status.md`](docs/model-data-status.md).
- **Data Dashboard** (oculto por ahora): economía, recursos, pronóstico 2056 con abanico de incertidumbre, revolución IA y simulador.

La incertidumbre se muestra como abanico de percentiles; las cifras en disputa, como rangos; los vacíos, como «sin dato». Los supuestos y las reglas de datos están en [`AGENTS.md`](AGENTS.md) y [`docs/assumptions.md`](docs/assumptions.md).

## Cómo correrlo

```bash
cd web
npm ci
cp .env.example .env.local   # completar VITE_MAPTILER_KEY (satélite y relieve de MapTiler)
npm run dev
```

Sin `VITE_MAPTILER_KEY` la escena de los Andes muestra un aviso y un fondo liso. La clave queda en el bundle: restringila por origen en MapTiler. Antes de un push: `python scripts/precheck.py`.

## Estructura

| Carpeta | Contenido |
|---|---|
| `web/` | Aplicación (Vite, React, TypeScript, MapLibre GL, Three.js, ECharts) |
| `model/` | Modelo de pronóstico en Python, con backtest |
| `data/` | Datos, esquemas y generador de datos de prueba |
| `docs/` | Decisiones, supuestos, diseño y fuentes |

## Referencias

La lista completa, con qué dato sale de cada fuente y qué falta verificar, está en [`docs/references.md`](docs/references.md). Los enlaces a los que no se pudo entrar y los datos que faltan traer están en [`docs/data-requests.md`](docs/data-requests.md).

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

Las cifras de bajas de Chacabuco no coinciden entre las fuentes 5, 10, 17, 18, 19 y 20: la pantalla usa las del parte de San Martín y dice cuáles son las otras. Las fuentes marcadas «por informe» en [`docs/references.md`](docs/references.md) todavía no se verificaron en el original.

### Mapa y terreno

21. MapTiler: imágenes satelitales, modelo de elevación Terrain-RGB v2 y geocodificador. <https://www.maptiler.com>
22. © OpenStreetMap contributors (nombres y posiciones de los lugares). <https://www.openstreetmap.org/copyright>

### Marco conceptual

23. Schwab, K. (2016). *La Cuarta Revolución Industrial*. Foro Económico Mundial.

### Productividad (paso 14 del Recorrido y simulador)

24. INDEC, Documento de trabajo N.º 52, *Productividad y stock de capital* (PTF y productividad laboral 2016-2025). <https://www.indec.gob.ar/ftp/cuadros/economia/productividad_stock_capital_10_26.pdf>
25. Baumann Fonay, I. (2026). «PTF y PIB potencial de Argentina, 1990-2025». <https://macroargentina.substack.com/p/ptf-y-pib-potencial-de-argentina>, y su serie en Alphacast <https://www.alphacast.io/datasets/potential-gross-domestic-product-output-gap-tfp-53419>
26. Penn World Table 11.0 (Groningen Growth and Development Centre), vía FRED. <https://www.rug.nl/ggdc/productivity/pwt/> y <https://fred.stlouisfed.org/series/EMPENGARA148NRUG> (empleo de Argentina)
27. Acemoglu, D. (2024). «The Simple Macroeconomics of AI». NBER Working Paper 32487. <https://www.nber.org/papers/w32487>

Las dos mediciones de la PTF de 2025 no coinciden (INDEC +2,8 %, Baumann +4,2 %); la PWT llega hasta 2023. Las demás fuentes de la sección 4.1 de [`docs/references.md`](docs/references.md) (literatura de IA, contexto, descartadas) y su estado están allí. El simulador sigue con coeficientes de prueba.

### Economía, comercio, recursos y proyecciones (Recorrido «Hacia el 2056» y Data)

Todos los enlaces de los datos que usa la aplicación. «Leída» = se abrió y se tomaron cifras; «secundaria» = prensa, sin verificar contra la fuente oficial. El estado de cada una y qué falta verificar está en [`docs/references.md`](docs/references.md) y [`docs/data-requests.md`](docs/data-requests.md); la misma lista se ve en la sección Data de la aplicación.

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

> Las posiciones de los lugares son aproximadas, las fechas intermedias entre las documentadas son estimaciones marcadas como tales, y las cifras de efectivos varían según la fuente. Todo está señalado en [`docs/references.md`](docs/references.md).
