import type { Reference } from './types.js';

/** The links behind the data of the slides, as in `docs/references.md` (section 4.1) plus the map sources. The Andes sources are on the Fuentes y métodos page. */
export const REFERENCES: readonly Reference[] = [
  { id: 'P1', group: 'Productividad', status: 'leída', label: 'INDEC, Documento de trabajo N.º 52, Productividad y stock de capital (2016-2025)', url: 'https://www.indec.gob.ar/ftp/cuadros/economia/productividad_stock_capital_10_26.pdf' },
  { id: 'P2', group: 'Productividad', status: 'por informe', label: 'Baumann Fonay (2026), PTF y PIB potencial de Argentina, 1990-2025 (no verificada)', url: 'https://macroargentina.substack.com/p/ptf-y-pib-potencial-de-argentina' },
  { id: 'P3', group: 'Productividad', status: 'citada', label: 'Baumann Fonay, serie de PTF y PIB potencial en Alphacast', url: 'https://www.alphacast.io/datasets/potential-gross-domestic-product-output-gap-tfp-53419' },
  { id: 'P4', group: 'Productividad', status: 'citada', label: 'Baumann Fonay en X', url: 'https://x.com/ivanfbf/status/2050931628965278028' },
  { id: 'P6', group: 'Productividad', status: 'usada', label: 'Penn World Table 11.0 (Groningen Growth and Development Centre)', url: 'https://www.rug.nl/ggdc/productivity/pwt/' },
  { id: 'P7', group: 'Productividad', status: 'usada', label: 'FRED, series de la Penn World Table 11.0 (PTF, PIB real, personas empleadas y horas anuales)', url: 'https://fred.stlouisfed.org/' },
  { id: 'P7b', group: 'Productividad', status: 'usada', label: 'FRED, personas empleadas en la Argentina (EMPENGARA148NRUG, CSV pasado por el equipo)', url: 'https://fred.stlouisfed.org/series/EMPENGARA148NRUG' },
  { id: 'P8', group: 'Productividad', status: 'citada', label: 'Acemoglu (2024), The Simple Macroeconomics of AI, NBER Working Paper 32487', url: 'https://www.nber.org/papers/w32487' },
  { id: 'P9', group: 'Productividad', status: 'citada', label: 'Anthropic, Estimating productivity gains', url: 'https://www.anthropic.com/research/estimating-productivity-gains' },
  { id: 'P10a', group: 'Productividad', status: 'citada', label: 'METR (19 % más lentos con IA), vía InfoQ', url: 'https://www.infoq.com/news/2025/07/ai-productivity' },
  { id: 'P10b', group: 'Productividad', status: 'citada', label: 'METR, vía eWeek', url: 'https://www.eweek.com/news/news-ai-tools-slow-developer-productivity-study/' },
  { id: 'P11a', group: 'Productividad', status: 'contexto', label: 'BID/INTAL, la IA en América Latina y el Caribe', url: 'https://www.iadb.org/es/noticias/inteligencia-artificial-trae-amplios-beneficios-america-latina-y-el-caribe-estudio-bid' },
  { id: 'P11b', group: 'Productividad', status: 'contexto', label: 'FGV IBRE, productividad de Brasil 2024', url: 'https://blogdoibre.fgv.br/node/2057' },
  { id: 'P11c', group: 'Productividad', status: 'contexto', label: 'BLS, productividad de Estados Unidos', url: 'https://www.bls.gov/news.release/prod2.nr0.htm' },
  { id: 'P11d', group: 'Productividad', status: 'contexto', label: 'OECD, PBI por hora trabajada', url: 'https://www.oecd.org/es/data/indicators/gdp-per-hour-worked.html' },
  { id: 'P11e', group: 'Productividad', status: 'contexto', label: 'DBnomics, espejo de la Penn World Table 10', url: 'https://db.nomics.world/GGDC/penn10' },
  { id: 'P11f', group: 'Productividad', status: 'contexto', label: 'ABC (Paraguay), productividad regional', url: 'https://www.abc.com.py/economia/2026/07/31/la-productividad-regional-cayo-04-anual-la-ia-busca-revertir-la-tendencia/' },
  { id: 'P12', group: 'Productividad', status: 'descartada', label: 'The Conference Board, TED summary tables (daba +6,8 % para Brasil en 2024, contradice a FGV)', url: 'https://www.conference-board.org/pdf_free/TED-SummaryTables-Charts-sep2025.pdf' },
  { id: 'P13a', group: 'Productividad', status: 'secundaria', label: 'El Observador (Uruguay) sobre el documento del INDEC', url: 'https://www.elobservador.com.uy/argentina/economia-y-negocios/la-productividad-argentina-crecio-al-ritmo-mas-alto-1996-pero-cae-la-calidad-del-empleo-n6042872' },
  { id: 'P13b', group: 'Productividad', status: 'secundaria', label: 'Derecha Diario sobre el documento del INDEC', url: 'https://derechadiario.com.ar/economia/productividad-registro-en-2025-mayor-avance-en-20-anos-bajo-gobierno-milei' },
  { id: 'W3', group: 'Economía', status: 'leída', label: 'Banco Mundial, WDI, Argentina (PBI, población, PBI per cápita, exportaciones, crecimiento, formación de capital), API consultada el 2026-10-12', url: 'https://api.worldbank.org/v2/country/ARG/indicator/' },
  { id: 'M1', group: 'Mapa', status: 'usada', label: 'MapTiler, imágenes satelitales', url: 'https://www.maptiler.com/cloud/' },
  { id: 'M2', group: 'Mapa', status: 'usada', label: 'MapTiler, modelo de elevación Terrain-RGB v2', url: 'https://docs.maptiler.com/cloud/api/tiles/' },
  { id: 'M3', group: 'Mapa', status: 'usada', label: 'MapTiler Geocoding', url: 'https://docs.maptiler.com/cloud/api/geocoding/' },
  { id: 'M4', group: 'Mapa', status: 'usada', label: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright' },
  { id: 'M6', group: 'Mapa', status: 'usada', label: 'MapLibre GL JS', url: 'https://maplibre.org' },
  { id: 'M7', group: 'Mapa', status: 'usada', label: 'Three.js', url: 'https://threejs.org' }
];
