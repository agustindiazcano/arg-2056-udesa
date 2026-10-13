# Pedidos de datos y enlaces pendientes

Lista de lo que la IA **no pudo conseguir o verificar** y que hay que traer a mano (o autorizar a buscar de otra forma). Se completa durante la revisión de datos reales de todas las diapositivas (`PENDING.md`, tarea «real-data-review»). Cada fila dice qué falta, para qué diapositiva, el enlace y qué hay que traer. Las fuentes ya leídas están en [`references.md`](references.md).

Estados: **no accedida** (el enlace falló), **sin enlace** (la IA no encontró la fuente), **sin verificar** (se accedió pero no se pudo contrastar), **a traer** (hay que descargar o transcribir el dato).

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
| D9 | 1 y 2 (indicadores), simulador | PBI, población, PBI per cápita, exportaciones totales, crecimiento, inversión del último año | Banco Mundial (WDI, API <https://api.worldbank.org/v2/country/ARG/indicator/>), INDEC, BCRA | a traer: hoy son de prueba | Los seis valores con año y fuente |
| D10 | 1 (PBI hasta 2056) | Serie histórica oficial y la proyección con abanico | INDEC (cuentas nacionales); el modelo del repo (`model/`) para la proyección | a traer / bloqueado por el modelo | La serie y los parámetros del modelo |
| D11 | 0 (extensión 2019-2026) | PBI y población 2019-2026 de los países del ranking | Maddison 2023 (D1) o Banco Mundial | a traer | Ver D1 |
| D12 | 2, 7 | Producción por provincia de minería, agro e hidrocarburos | Secretaría de Minería, Secretaría de Energía (datos abiertos de producción de petróleo y gas), MAGyP (estimaciones agrícolas por provincia) | sin enlace: la IA no buscó todavía las URL exactas | Series por provincia y recurso, con unidades (toneladas y dólares) |
| D13 | 4, 11 | Exportaciones por sector y su composición | INDEC (Intercambio comercial argentino y exportaciones por provincia), BCRA | sin enlace | Exportaciones por rubro y por provincia, en dólares y en toneladas |
| D14 | 8 | Proyectos mineros por provincia, estado, capacidad y capex | Secretaría de Minería (proyectos), cámaras del sector | sin enlace | Lista de proyectos con fuente |
| D15 | 9 | Producción de petróleo y gas con piso y techo (Vaca Muerta) | Secretaría de Energía; proyecciones de la propia secretaría o de la EIA | sin enlace | Series y los supuestos de la proyección |
| D16 | 10 | Producción agrícola actual y potencial | MAGyP, estimaciones de cosecha; estudios de potencial | sin enlace | Series por cultivo (toneladas) y su valor en dólares |
| D17 | 12 | Composición del PBI por sector | INDEC (cuentas nacionales, valor agregado por sector) | sin enlace | La tabla del último año |
| D18 | 13 | Stock de recursos naturales (reservas y recursos) | USGS (minerales), Secretaría de Energía (reservas de hidrocarburos), Secretaría de Minería | sin enlace | Reservas por recurso, con la definición de cada una |
| D19 | 3 | Impacto de la IA en el PBI (rango) | Literatura citada en `docs/references.md` (P8 a P10) y el modelo de IA del repo | a traer: hoy es de prueba | El rango con sus citas |
| D20 | 6 | Qué miran los inversores (puntajes de 0 a 10) | Encuesta o índice con fuente (por definir) | sin enlace | Una fuente que dé los puntajes, o sacar la diapositiva |
| D21 | 14 | Las 15 series de FRED de la Penn World Table 11.0 (IDs en `references.md`, P7) y la anomalía de horas de Argentina 2021-2023 | <https://fred.stlouisfed.org/> | sin verificar: los datos vienen del archivo `productivity_slide_spec.html`, la IA no los volvió a bajar | Re-descargar y comparar con `web/src/tour/productivityData.json` |
| D22 | 14 | Serie del INDEC 2016-2025 (cuadros 12 y 13) como paso extra | <https://www.indec.gob.ar/ftp/cuadros/economia/productividad_stock_capital_10_26.pdf> | leída; el VAB de 0,3 % anual y los 0,6 p.p. de 2016-2025 solo están en los gráficos | Transcribir esas cifras si se quieren mostrar |

## 3. Cómo se usa esta lista

1. La IA intenta primero conseguir cada dato (API, descarga, lectura del documento) y lo agrega a `docs/references.md` con su estado.
2. Lo que no puede, queda acá con el enlace exacto, qué falló y qué traer. Nunca se rellena ni se inventa un valor.
3. Cuando el dato llega, se mueve la fila a `references.md`, se conecta al gráfico y se saca de `PENDING.md` («Data to verify»).
