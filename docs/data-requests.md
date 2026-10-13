# Pedidos de datos y enlaces pendientes

Lista de lo que la IA **no pudo conseguir o verificar** y que hay que traer a mano (o autorizar a buscar de otra forma). Se completa durante la revisión de datos reales de todas las diapositivas (`PENDING.md`, tarea «real-data-review»). Cada fila dice qué falta, para qué diapositiva, el enlace y qué hay que traer. Las fuentes ya leídas están en [`references.md`](references.md).

Estados: **no accedida** (el enlace falló), **sin enlace** (la IA no encontró la fuente), **sin verificar** (se accedió pero no se pudo contrastar), **a traer** (hay que descargar o transcribir el dato).

## 0. Estado de cada diapositiva del Recorrido

Una fila por diapositiva (paso del Recorrido). «Real» = con fuente y consultada; «parcial» = algunas cifras reales; «prueba» = inventada («Datos de prueba»). Todo dato real y su referencia se ven en la sección **Data** de la aplicación (`web/src/datasets/slides.ts` y `references.ts`).

| Paso | Diapositiva | Estado | Pedidos | Qué falta |
|---|---|---|---|---|
| 0 | PBI de la Argentina desde 1900 y ranking | parcial: real hasta 2018 (Maddison 2020); la diapositiva todavía dibuja prueba | D1, D11 | Conectar `worldRealData.json` a la diapositiva; extender 2019-2026 |
| 1 | PBI hasta 2056 (con abanico) | parcial: el cuadro de indicadores es real (Banco Mundial 2025); la serie y la proyección son de prueba | D9 (hecho), D10 | Serie oficial 1990-2025 y la proyección del modelo |
| 2 | Producción por provincia | parcial: indicadores reales; tabla por provincia de prueba | D9 (hecho), D12 | Producción por provincia y sector |
| 3 | Impacto de la IA en el PBI | prueba | D19 | Rango con citas |
| 4 | Recursos naturales: exportaciones por sector | prueba | D13 | Exportaciones por complejo, serie anual |
| 5 | Regla del 70 | no es un dato: es aritmética (70 / tasa) | — | Nada (revisar que no figure como «prueba») |
| 6 | Qué miran los inversores | prueba | D20 | Una fuente con puntajes, o sacar la diapositiva |
| 7 | Mapa productivo por provincia | prueba | D12 | Igual que el paso 2 |
| 8 | Minería hoy vs proyecto | prueba | D14 | Proyectos con capex y capacidad |
| 9 | Hidrocarburos | prueba | D15 | Producción histórica y proyección |
| 10 | Agro actual y potencial | prueba | D16 | Series por cultivo y potencial |
| 11 | Composición de las exportaciones | prueba | D13 | Un solo cuadro de INDEC por complejo |
| 12 | Composición del PBI | prueba | D17 | Cuadro de INDEC por sector |
| 13 | Stock de recursos naturales | prueba | D18 | Reservas por recurso con definiciones |
| 14 | Productividad | real (INDEC, PWT/FRED); falta verificar | D2 a D8, D21, D22 | Verificar fuentes citadas |
| sim | Simulador del PBI | prueba (coeficientes inventados) | D10, D19 | Elasticidades del modelo |

## 1. Enlaces a los que no se pudo entrar

| # | Diapositiva | Qué es | Enlace | Estado | Qué traer |
|---|---|---|---|---|---|
| D1 | 0 (PBI y ranking mundial) | Maddison Project Database 2023 (llega a 2022; hoy se usa la de 2020, hasta 2018) | Excel <https://dataverse.nl/api/access/datafile/421302>; Stata <https://dataverse.nl/api/access/datafile/421303>; DOI <https://doi.org/10.34894/INZBF2>; página <https://www.rug.nl/ggdc/historicaldevelopment/maddison/releases/maddison-project-database-2023> | no accedida: Dataverse devolvió el error 500 (`HazelcastInstanceNotActiveException`) en cuatro intentos el 2026-10-12 | El archivo `.xlsx`, para correr `python scripts/build_world_data.py --mpd <archivo>` |
| D2 | 14 (Productividad) | Artículo de Baumann Fonay sobre la PTF | <https://macroargentina.substack.com/p/ptf-y-pib-potencial-de-argentina> | sin verificar: la página no cargó al reabrirla; el texto lo pegó el equipo | Confirmar +4,2 % (2025) y +7,7 % desde 2023 |
| D3 | 14 | Serie de Baumann en Alphacast | <https://www.alphacast.io/datasets/potential-gross-domestic-product-output-gap-tfp-53419> | no accedida | La serie anual de PTF 1990-2025 |
| D4 | 14 | Baumann en X | <https://x.com/ivanfbf/status/2050931628965278028> | no accedida | Nada, solo confirmar |
| D5 | 14 | Estudio de Anthropic sobre productividad | <https://www.anthropic.com/research/estimating-productivity-gains> | no accedida (citada por un informe) | Confirmar +1,8 % anual de productividad laboral y +1,08 % de PTF |
| D6 | 14 | Acemoglu (NBER 32487) | <https://www.nber.org/papers/w32487> | no accedida | Confirmar «hasta 0,66 % de PTF en diez años» |
| D7 | 14 | METR, ensayo con desarrolladores | páginas secundarias <https://www.infoq.com/news/2025/07/ai-productivity> y <https://www.eweek.com/news/news-ai-tools-slow-developer-productivity-study/> | sin verificar: falta la página original de METR (sin enlace) | La URL de METR y la cifra de 19 % |
| D8 | 14 | Hacienda 2018 (documento de trabajo n.º 1) y gacetilla del INDEC sobre la productividad | — | sin enlace | Las URL |

## 2. Datos que faltan para reemplazar los de prueba

| # | Diapositiva | Dato | Fuente a consultar | Estado | Qué traer |
|---|---|---|---|---|---|
| D9 | 1 y 2 (indicadores), simulador | PBI, población, PBI per cápita, exportaciones totales, crecimiento, inversión de 2025 | Banco Mundial (WDI), API <https://api.worldbank.org/v2/country/ARG/indicator/> | **hecho el 2026-10-12**: PBI 683,1 mil millones de USD corrientes; población 45,85 millones; PBI per cápita 14.898 USD; exportaciones de bienes y servicios 106,3 mil millones de USD; crecimiento 4,4 %; formación bruta de capital 16,1 % del PBI (WDI actualizado el 2026-10-08) | Verificar a mano contra el INDEC (el INDEC mide las exportaciones de bienes en 87,1 mil millones de USD, sin servicios) y que el equipo acepte WDI como fuente única |
| D10 | 1 (PBI hasta 2056) | Serie histórica oficial y la proyección con abanico | INDEC (cuentas nacionales); el modelo del repo (`model/`) para la proyección | a traer / bloqueado por el modelo | La serie y los parámetros del modelo |
| D11 | 0 (extensión 2019-2026) | PBI y población 2019-2026 de los países del ranking | Maddison 2023 (D1) o Banco Mundial | a traer | Ver D1 |
| D12 | 2, 7 | Producción por provincia de minería, agro e hidrocarburos | Secretaría de Energía, portal <https://datos.energia.gob.ar> (abre; falta ubicar el conjunto de producción por provincia); espejo de Alphacast, producción de petróleo y gas por provincia desde 2009 <https://www.alphacast.io/datasets/activity-production-argentina-sge-oil-gas-production-by-province-6115>; MAGyP, estimaciones agrícolas (portal `datosestimaciones.magyp.gob.ar`, no abierto); Alphacast, producción agrícola por producto y departamento 1969-2025 <https://www.alphacast.io/datasets/agricultural-production-by-product-and-department-45339>; minería: sin conjunto por provincia | enlaces encontrados, sin descargar | Producción por provincia y recurso, con unidades (m³, miles de m³, toneladas) y su valor en dólares; decidir un solo criterio de valor |
| D13 | 4, 11 | Exportaciones por sector y su composición | INDEC, *Intercambio comercial argentino*: informe de agosto de 2026 <https://www.indec.gob.ar/uploads/informesdeprensa/ica_08_26E158B1D119.pdf> (abre); página del tema <https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-2-40>; los complejos exportadores 2025 están en la nota de la Dirección de Estadística de Santa Fe <https://www.estadisticasantafe.gob.ar/wp-content/uploads/sites/24/2026/03/ComplejoEXPORTADOR-2025.pdf> (secundaria) | enlaces encontrados y abiertos; cifras de la prensa sin verificar: 2025 exportó 87.111 millones de USD en bienes (+9,3 %); soja 21.442 millones; petrolero-petroquímico 11.772 millones (13,5 %) | El cuadro de complejos exportadores del propio INDEC (informe de cierre de 2025, ICA de enero de 2026) y la serie anual desde 2002 |
| D14 | 8 | Proyectos mineros por provincia, estado, capacidad y capex | Secretaría de Minería, documento de gestión de ARMINERA 2025 <https://www.argentina.gob.ar/sites/default/files/mayo_2025_-_arminera.pdf> (abre; con cartera de proyectos y proyecciones de exportaciones por mineral); CAEM (cámara) | enlace encontrado, sin leer; la prensa da 310 a 325 proyectos, 26 en producción, exportaciones mineras de 6.056 a 6.075 millones de USD en 2025 y una inversión de 41.960 millones de USD hasta 2031, cifras sin verificar y que difieren entre fuentes | Leer el PDF y transcribir por proyecto: provincia, mineral, etapa, capacidad, capex |
| D15 | 9 | Producción de petróleo y gas con piso y techo (Vaca Muerta) | Secretaría de Energía (<https://datos.energia.gob.ar>); IAE, análisis de Vaca Muerta 2025 <https://www.iae.org.ar/wp-content/uploads/2026/03/Vaca-Muerta_analisis-2025_vmo_260330_155248.pdf> (abre); EIA para el rango | enlaces encontrados; cifras de prensa sin verificar: petróleo 860.000 barriles/día de promedio en 2025 (+13,1 %), 903.700 en mayo de 2026; Vaca Muerta 62 % del petróleo y 53 % del gas | Serie mensual oficial 2015-2026 y supuestos de la proyección (el piso y el techo los define el equipo) |
| D16 | 10 | Producción agrícola actual y potencial | MAGyP, estimaciones agrícolas; series por cultivo en datos.gob.ar (los enlaces de maíz y mijo devolvieron 404 el 2026-10-12); Alphacast, producción agrícola por producto y departamento (D12) | enlaces rotos o secundarios | La serie de soja, maíz, trigo y girasol por campaña (toneladas) y un estudio de potencial |
| D17 | 12 | Composición del PBI por sector | INDEC, cuentas nacionales; informe de avance del nivel de actividad, 2.º trimestre de 2026 <https://www.indec.gob.ar/uploads/informesdeprensa/pib_09_26065D6A3612.pdf> (abre; los fragmentos de la búsqueda no traen el valor agregado por sector) | enlace encontrado, sin leer | El cuadro de valor agregado por sector del último año completo (2025) |
| D18 | 13 | Stock de recursos naturales (reservas y recursos) | USGS, *Mineral Commodity Summaries 2026* <https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-lithium.pdf> (abre; hay un PDF por mineral; la página del país devolvió 403); Secretaría de Minería, recursos y reservas (nota de prensa: 197,9 millones de t de LCE en recursos de litio, junio de 2025); Secretaría de Energía, reservas de hidrocarburos | enlace encontrado; cifras de prensa sin verificar: reservas de litio de 13 % del mundo (3.º lugar) según USGS | Reservas por recurso con la definición de cada una (USGS y la Secretaría no son comparables) y su valor en dólares |
| D19 | 3 | Impacto de la IA en el PBI (rango) | Literatura citada en `docs/references.md` (P8 a P10) y el modelo de IA del repo | a traer: hoy es de prueba | El rango con sus citas |
| D20 | 6 | Qué miran los inversores (puntajes de 0 a 10) | Encuesta o índice con fuente (por definir) | sin enlace | Una fuente que dé los puntajes, o sacar la diapositiva |
| D21 | 14 | Las 15 series de FRED de la Penn World Table 11.0 (IDs en `references.md`, P7) y la anomalía de horas de Argentina 2021-2023 | <https://fred.stlouisfed.org/> | sin verificar: los datos vienen del archivo `productivity_slide_spec.html`, la IA no los volvió a bajar | Re-descargar y comparar con `web/src/tour/productivityData.json` |
| D22 | 14 | Serie del INDEC 2016-2025 (cuadros 12 y 13) como paso extra | <https://www.indec.gob.ar/ftp/cuadros/economia/productividad_stock_capital_10_26.pdf> | leída; el VAB de 0,3 % anual y los 0,6 p.p. de 2016-2025 solo están en los gráficos | Transcribir esas cifras si se quieren mostrar |

## 2b. Lo que no se encontró

- Datos oficiales de la Secretaría de Energía por provincia: el portal abre, pero la búsqueda no devolvió el nombre exacto del conjunto de producción. Hay que entrar y copiar la URL.
- Reservas probadas oficiales de petróleo y gas (D18): no aparecieron cifras oficiales actualizadas.
- Reservas de cobre de la USGS para la Argentina: no hay cifra en lo encontrado; la de 44 millones de toneladas viene de una fuente secundaria sin citar a USGS.
- Una fuente para «Qué miran los inversores» (D20): no se buscó; no hay una encuesta evidente.

## 3. Cómo se usa esta lista

1. La IA intenta primero conseguir cada dato (API, descarga, lectura del documento) y lo agrega a `docs/references.md` con su estado.
2. Lo que no puede, queda acá con el enlace exacto, qué falló y qué traer. Nunca se rellena ni se inventa un valor.
3. Cuando el dato llega, se mueve la fila a `references.md`, se conecta al gráfico y se saca de `PENDING.md` («Data to verify»).
