import { withMeta } from './quality.js';
import { PROVINCES } from '../types/province.js';
import { GDP_MOCK } from '../tour/gdpMock.js';
import agro from '../tour/agroArgentina.json';
import energy from '../tour/energyArgentina.json';
import external from '../tour/externalProjections.json';
import imf from '../tour/imfWeo.json';
import world from '../tour/worldGdp.json';
import { INDICATORS_YEAR, TOUR_INDICATORS } from '../tour/indicatorsMock.js';
import { COUNTRIES, cumulative2011, seriesOf } from '../tour/productivity.js';
import { PRODUCTION_UNIT, SECTOR_LABELS, SECTOR_VALUES } from '../tour/provinceMock.js';
import type { Sector } from '../tour/provinceMock.js';
import { DEFAULT_SIM, SIM_FIELDS, simulate } from '../tour/simModel.js';
import { specRaw } from '../tour/specTable.js';
import { COPPER_PROJECTS, LITHIUM_PROJECTS, MINING_CAPEX, MINING_EXPORTS_2024, MINING_EXPORTS_BY_YEAR, MINING_PROJECTION } from '../tour/miningArminera.js';
import { MINING_BY_PROVINCE_2025, MINING_BY_PROVINCE_2026_JAN_AUG } from '../tour/miningByProvince.js';
import { SBC_EXPORTS_2025, SERVICES_EXPORTS_2025 } from '../tour/servicesExports.js';
import { RIGI_MINING, RIGI_OIL_GAS } from '../tour/rigiProjects.js';
import type { RigiProject } from '../tour/rigiProjects.js';
import { stepNumber } from '../tour/chartSteps.js';
import { AGRO_TONNES_CHART, AGRO_USD_CHART, EXPORT_COMPOSITION_CHART, HYDROCARBONS_CHART, STOCK_CHART, TOUR_CHARTS } from '../tour/tourCharts.js';
import { perCapitaSeries, populationPath } from '../tour/aiModel.js';
import { AI_ANALYSTS, AI_SCENARIOS, US_SCENARIOS } from '../tour/aiScenarios.js';
import { OTHER_CROPS } from '../tour/agroOtherCrops.js';
import { LIVESTOCK, LITRES_TO_TONNES, livestockParts } from '../tour/livestockArgentina.js';
import { ACCESS_COUNTRIES, PLANS, accessRows } from '../tour/aiAccess.js';
import { DRAFT_SLIDES } from '../tour/draftSlides.js';
import { AI_ACCESS_TITLE, COMPOSITION_TITLE, DEVELOPMENT_TITLE, FORECAST_UNCERTAINTY_TITLE, RESOURCES_TITLE } from '../tour/slideTitles.js';
import { exportRows } from '../tour/exportsData.js';
import { countriesTable } from '../tour/rule70Countries.js';
import { imfTable } from '../tour/rule70Imf.js';
import { scenariosTable } from '../tour/rule70Scenarios.js';
import { convergenceTable } from '../tour/rule70Convergence.js';
import { argentinaTable, errorTable } from '../tour/rule70Model.js';
import type { TourChartDef } from '../tour/tourCharts.js';
import { EXPORTS_GREAT_ITEMS, EXPORTS_GREAT_ITEMS_SOURCE, EXPORTS_TOTAL_2025, EXPORT_COMPLEXES, PROVINCE_VALUES } from '../tour/tourData.js';
import { FIRST_YEAR as WORLD_FIRST, LAST_YEAR as WORLD_LAST, WORLD_UNIT, argentinaReal, regionCountries, regionValuesAt } from '../tour/worldData.js';
import type { DataTable, SlideData } from './types.js';

const indicators = (): DataTable => ({
  id: 'indicators',
  title: 'Indicadores de Argentina',
  columns: ['Indicador', 'Valor', 'Unidad', 'Año', 'Fuente'],
  rows: TOUR_INDICATORS.map((i) => [i.label, i.value, i.unit, INDICATORS_YEAR, 'Banco Mundial (WDI)'])
});

/** Livestock production of 2025 as the agro treemap shows it. */
function livestockTable(): DataTable {
  return {
    id: 'agro-livestock',
    title: `Ganadería: producción de ${LIVESTOCK.year} (millones de toneladas; leche a ${LITRES_TO_TONNES} kg por litro)`,
    columns: ['Producto', 'Millones de toneladas', 'Base'],
    rows: livestockParts().map((p) => [p.label, Math.round(p.value * 1000) / 1000, p.label === 'Carne aviar' ? 'Peso producto' : p.label === 'Leche' ? `${LIVESTOCK.milk_million_litres} millones de litros` : 'Res con hueso'])
  };
}

/** The crops that make up «Otros cultivos» in the agro treemap. */
function otherCropsTable(): DataTable {
  return {
    id: 'agro-other-crops',
    title: `Otros cultivos: producción de la campaña ${OTHER_CROPS.campaign} (toneladas)`,
    columns: ['Cultivo', 'Toneladas'],
    rows: OTHER_CROPS.rows.map((r) => [r.crop, r.tonnes])
  };
}

function slide(id: string, title: string, tables: DataTable[], mock = true, refs: string[] = []): SlideData {
  return { id, label: id === 'sim' ? `Simulador del PBI` : `${stepNumber(Number(id))} · ${title}`, title, mock, tables: tables.map(withMeta), refs };
}

/** The raw table of a chart of the Recorrido (bars or lines), from the same spec the 3D view and the Gráfico | Tabla switch use. */
function chartTable(step: number, def: TourChartDef = TOUR_CHARTS[step]!): DataTable {
  const spec = def.build().spec!;
  if (spec.kind === 'map') throw new Error(`step ${step} is a map`);
  const raw = specRaw(spec);
  return { id: `chart-${step}`, title: def.title, ...raw };
}

const range = (r: readonly [number, number]): string => `${r[0]} a ${r[1]}`;

/** The scenarios of the AI slide as the pasted report gives them (ranges), the same for the United States, and the estimates of the analysts. */
const aiTables = (): DataTable[] => [
  {
    id: 'ai-scenarios',
    title: 'Argentina: tres escenarios con IA (rangos del informe; el gráfico usa el punto medio)',
    columns: ['Escenario', 'Crecimiento anual medio 2026-2030 (%)', 'Nivel del PBI 2030 contra 2025 (%)', 'Crecimiento anual medio 2031-2035 (%)', 'Aporte de la IA a la PTF (puntos por año)', 'Comentario'],
    rows: AI_SCENARIOS.map((s) => [s.name, range(s.growth2030), range(s.level2030), range(s.growth2035), range(s.aiPoints), s.comment])
  },
  {
    id: 'ai-us',
    title: 'Estados Unidos: tres escenarios con IA, para comparar (rangos del informe)',
    columns: ['Escenario', 'Crecimiento anual medio 2026-2030 (%)', 'Nivel del PBI 2030 contra 2025 (%)', 'Crecimiento anual medio 2031-2035 (%)', 'Aporte de la IA a la productividad (puntos por año)'],
    rows: US_SCENARIOS.map((s) => [s.name, range(s.growth2030), range(s.level2030), range(s.growth2035), range(s.aiPoints)])
  },
  {
    id: 'ai-analysts',
    title: 'Estimaciones de analistas sobre el efecto de la IA en el PBI (ordenadas de menor a mayor; alcance y horizonte distintos)',
    columns: ['Analista', 'Alcance', 'Horizonte', 'Efecto en el nivel del PBI (%)'],
    rows: AI_ANALYSTS.map((a) => [a.who, a.scope, a.horizon, a.effect])
  }
];

const perCapitaTable = (): DataTable => {
  const pc = perCapitaSeries();
  return { id: 'ai-per-capita', title: `PBI por habitante por escenario (${pc.unit}; PBI del escenario sobre la población de la ONU, variante media, apoyada en el INDEC de 2025)`, columns: ['Año', ...pc.series.map((s) => s.name)], rows: pc.years.map((y, i) => [y, ...pc.series.map((s) => s.values[i] ?? null)]) };
};

const aiPopulationTable = (): DataTable => {
  const pop = populationPath();
  return { id: 'ai-population', title: 'Población de Argentina 2025-2056 (millones; INDEC 2025 y variación anual de la ONU, variante media)', columns: ['Año', 'Población'], rows: pop.years.map((y, i) => [y, Math.round(pop.values[i]! * 1000) / 1000]) };
};

const rigiTable = (id: string, title: string, projects: readonly RigiProject[]): DataTable => ({
  id,
  title,
  columns: ['Proyecto', 'Empresa', 'Provincia', 'Tipo', 'Inversión (millones de USD)', 'Estado', 'Nota (sin verificar)'],
  rows: projects.map((p) => [p.name, p.company, p.province, p.kind, p.investment, p.status, p.note || '—'])
});

/** The real growth of 2025 that the World Bank series implies against the IMF (WEO, update of 2026-09-30), and the IMF estimate for 2026. */
const imfComparison = (): DataTable => {
  const idx = world.years.indexOf(2025);
  const growth = imf.growth as Record<string, Record<string, number>>;
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    id: 'imf',
    title: 'Crecimiento real del PBI en 2025: Banco Mundial (calculado de la serie en dólares de 2015) contra FMI, y estimación del FMI para 2026 (%)',
    columns: ['País', 'Banco Mundial 2025', 'FMI 2025', 'Diferencia (puntos)', 'FMI 2026 (estimación)'],
    rows: world.region.map((code) => {
      const c = world.countries.find((x) => x.code === code)!;
      const a = c.gdp[idx];
      const b = c.gdp[idx - 1];
      const bm = a !== null && a !== undefined && b !== null && b !== undefined ? round1((a / b - 1) * 100) : null;
      const f = growth[code];
      return [c.name, bm, f?.['2025'] ?? null, bm !== null && f ? round1(f['2025']! - bm) : null, f?.['2026'] ?? null];
    })
  };
};

/** The projections of other institutions for Argentina: IMF to 2031, OECD long-term scenarios and UN variants to 2056. */
const externalTables = (): DataTable[] => [
  {
    id: 'external-imf',
    title: `Crecimiento real del PBI de Argentina que proyecta el FMI (%, WEO ${external.imf.vintage})`,
    columns: ['Año', 'Crecimiento real'],
    rows: Object.entries(external.imf.growth).map(([y, v]) => [Number(y), v])
  },
  {
    id: 'external-oecd',
    title: 'Escenarios de largo plazo de la OCDE para Argentina: crecimiento real medio del PBI 2026-2056 (calculado de los niveles) y población en 2056',
    columns: ['Escenario', 'Descripción (en inglés, de la fuente)', 'Crecimiento medio anual (%)', 'Población 2056 (millones)'],
    rows: external.oecd.map((o) => [o.scenario, o.description, o.growth, Math.round(o.population2056 * 100) / 100])
  },
  {
    id: 'external-un',
    title: 'Proyección de la ONU (World Population Prospects 2024) para Argentina en 2056, por variante',
    columns: ['Variante', 'Población (millones)', 'Hijos por mujer', 'Esperanza de vida (años)'],
    rows: external.un.map((u) => [u.variant === 'Low' ? 'Baja' : u.variant === 'High' ? 'Alta' : 'Media', Math.round(u.population2056 * 100) / 100, u.tfr2056, u.e0_2056])
  }
];

/** The real production of oil and gas by province in 2025 (Secretaría de Energía): the only sector of steps 2 and 7 with real data so far. */
const hydrocarbonProvinces = (): DataTable => ({
  id: 'hydrocarbons-provinces',
  title: 'Petróleo y gas por provincia en 2025 (Secretaría de Energía, promedio diario del año)',
  columns: ['Provincia', 'Petróleo (miles de barriles por día)', 'Gas (millones de m³ por día)'],
  rows: energy.provinces2025.map((p) => [p.province, p.oil_kbd, p.gas_mmm3d])
});

const nationalProduction = (): DataTable => ({
  id: 'oil-gas-national',
  title: 'Producción nacional de petróleo y gas, promedio diario de cada año (Secretaría de Energía)',
  columns: ['Año', 'Petróleo (miles de barriles por día)', 'Gas (millones de m³ por día)'],
  rows: Object.entries(energy.national).map(([y, v]) => [Number(y), v.oil_kbd, v.gas_mmm3d])
});

const oilSince1950 = (): DataTable => ({
  id: 'oil-since-1950',
  title: 'Producción anual de petróleo desde 1950, total del país (miles de m³; Secretaría de Energía). Es otra serie: en 2015 da 31.973 mil m³ y la de arriba, unos 30.900',
  columns: ['Año', 'Petróleo (miles de m³)'],
  rows: energy.oilSince1950Mm3.map((p) => [p[0] ?? null, p[1] ?? null])
});

const reservesTable = (): DataTable => {
  const r = energy.reserves;
  const bbl = (mm3: number) => Math.round((mm3 * 6.28981) / 1000); // thousand m3 to million barrels
  return {
    id: 'reserves',
    title: `Reservas de petróleo y gas al ${r.date}, ${r.basis} (Secretaría de Energía)`,
    columns: ['Categoría', 'Petróleo (miles de m³)', 'Petróleo (millones de barriles)', 'Gas (millones de m³)'],
    rows: [
      ['Comprobadas', r.proved.oil_mm3, bbl(r.proved.oil_mm3), r.proved.gas_mmm3],
      ['Probables', r.probable.oil_mm3, bbl(r.probable.oil_mm3), r.probable.gas_mmm3],
      ['Posibles', r.possible.oil_mm3, bbl(r.possible.oil_mm3), r.possible.gas_mmm3],
      ['Comprobadas, convencional', r.proved_conventional.oil_mm3, bbl(r.proved_conventional.oil_mm3), r.proved_conventional.gas_mmm3],
      ['Comprobadas, no convencional (Vaca Muerta y otras)', r.proved_non_conventional.oil_mm3, bbl(r.proved_non_conventional.oil_mm3), r.proved_non_conventional.gas_mmm3]
    ]
  };
};

const complexesTable = (): DataTable => ({
  id: 'complexes',
  title: 'Exportaciones de bienes por complejo exportador, 2025 y 2024 (millones de USD, datos provisorios; INDEC)',
  columns: ['Complejo', '2025', '2024', 'Variación (%)', 'Participación 2025 (%)'],
  rows: EXPORT_COMPLEXES.map((c) => [c.label, c.y2025, c.y2024, Math.round((c.y2025 / c.y2024 - 1) * 1000) / 10, Math.round((c.y2025 / EXPORTS_TOTAL_2025) * 1000) / 10])
});

/** The share of each complex in the exports of 2024 and 2025 (percent of the total of the year; the 2024 total is the sum of the complexes), as the Exports slide shows them. */
const exportSharesTable = (): DataTable => {
  const a = exportRows(2024, 'share');
  const b = exportRows(2025, 'share');
  return {
    id: 'exports-shares',
    title: 'Participación de cada complejo en las exportaciones de bienes, 2024 y 2025 (%, calculada de la tabla de arriba)',
    columns: ['Complejo', 'Participación 2024 (%)', 'Participación 2025 (%)'],
    rows: a.map((r, i) => [r.label, r.value, b[i]!.value])
  };
};

const greatItemsTable = (): DataTable => ({
  id: 'great-items',
  title: `Exportaciones por gran rubro, acumulado de enero a julio de 2026 (${EXPORTS_GREAT_ITEMS.unit}; ${EXPORTS_GREAT_ITEMS_SOURCE})`,
  columns: ['Gran rubro', 'Valor'],
  rows: EXPORTS_GREAT_ITEMS.rows.map((r) => [r.label, r.value])
});

/** The real production of the four main crops by campaign (MAGyP): the current side of step 10, in tons (the chart of the step is still in made-up USD). */
const agroTable = (): DataTable => ({
  id: 'agro-production',
  title: 'Producción de los cuatro cultivos principales por campaña (MAGyP; el año es el de inicio de la campaña)',
  columns: ['Cultivo', 'Campaña', 'Superficie sembrada (ha)', 'Superficie cosechada (ha)', 'Producción (toneladas)', 'Rendimiento (kg por ha)'],
  rows: Object.entries(agro.crops).flatMap(([crop, list]) => list.slice(-6).map((r) => [crop, `${r.campaign}/${String(r.campaign + 1).slice(2)}`, r.sown_ha, r.harvested_ha, r.production_t, r.yield_kg_ha]))
});

/** The tables of the Secretaría de Minería (ARMINERA 2025), transcribed from images: exports, projection, capex and the advanced lithium and copper projects. */
const servicesTables = (): DataTable[] => [
  {
    id: 'services-exports',
    title: 'Exportaciones de servicios de 2025 por categoría (millones de USD; total 18.039; las otras categorías suman el resto)',
    columns: ['Categoría', 'Millones de USD', '% del total'],
    rows: SERVICES_EXPORTS_2025.categories.map((c) => [c.name, c.value, Math.round((c.value / SERVICES_EXPORTS_2025.total) * 1000) / 10])
  },
  {
    id: 'sbc-exports',
    title: 'Servicios basados en el conocimiento exportados en 2025 (millones de USD; total 9.563 = 53,0 % de los servicios)',
    columns: ['Servicio', 'Millones de USD'],
    rows: SBC_EXPORTS_2025.rows.map((r) => [r.name, r.value])
  }
];

const miningByProvinceTable = (): DataTable => ({
  id: 'mining-provinces',
  title: 'Exportaciones mineras por provincia (millones de USD FOB; Secretaría de Minería con base Aduana)',
  columns: ['Período', 'Total', 'Santa Cruz', 'San Juan', 'Jujuy', 'Salta', 'Catamarca', 'NOA total', 'Resto'],
  rows: [MINING_BY_PROVINCE_2025, MINING_BY_PROVINCE_2026_JAN_AUG].map((r) => [
    r.period,
    r.total,
    r.santaCruz,
    r.sanJuan,
    r.jujuy,
    r.salta,
    r.catamarca,
    r.noa,
    r.resto
  ])
});


const miningTables = (): DataTable[] => [
  miningByProvinceTable(),
  { id: 'mining-exports', title: 'Exportaciones mineras de Argentina (miles de millones de USD; Secretaría de Minería)', columns: ['Período', 'Total'], rows: MINING_EXPORTS_BY_YEAR.map(([p, v]) => [p, v]) },
  { id: 'mining-2024', title: 'Principales productos mineros exportados en 2024 (millones de USD y % del total)', columns: ['Producto', 'Millones de USD', '% del total'], rows: MINING_EXPORTS_2024.map(([p, v, share]) => [p, v, share]) },
  { id: 'mining-projection', title: 'Proyección de exportaciones mineras 2024-2035 (miles de millones de USD; solo se leen el total y lo que el gráfico rotula)', columns: ['Año', 'Total', 'Litio', 'Cobre'], rows: MINING_PROJECTION.map((r) => [r.year, r.total, r.lithium, r.copper]) },
  { id: 'mining-capex', title: 'Gastos de capital proyectados 2025-2031 (millones de USD)', columns: ['Año', 'Total'], rows: MINING_CAPEX.map(([y, v]) => [y, v]) },
  {
    id: 'lithium-projects',
    title: 'Proyectos de litio en estado avanzado (mayo de 2025)',
    columns: ['Proyecto', 'Accionista principal', 'País', 'Provincia', 'Capacidad por año', 'Producción 2024', 'Estado'],
    rows: LITHIUM_PROJECTS.map((r) => [...r])
  },
  {
    id: 'copper-projects',
    title: 'Proyectos de cobre en estado avanzado (mayo de 2025; kt = miles de toneladas, koz = miles de onzas)',
    columns: ['Proyecto', 'Accionista principal', 'País', 'Provincia', 'Capacidad por año', 'Estado'],
    rows: COPPER_PROJECTS.map((r) => [...r])
  }
];

function productivityTables(): DataTable[] {
  const wide = (metric: 'tfp' | 'oph', kind: 'level' | 'change', id: string, title: string): DataTable => {
    const years = seriesOf(metric, kind, 'AR').years;
    return {
      id,
      title,
      columns: ['Año', ...COUNTRIES.map((c) => c.name)],
      rows: years.map((y, i) => [y, ...COUNTRIES.map((c) => seriesOf(metric, kind, c.code).values[i] ?? null)])
    };
  };
  return [
    wide('tfp', 'level', 'tfp-level', 'PTF, índice 1955 = 100'),
    wide('tfp', 'change', 'tfp-change', 'PTF, variación anual (%)'),
    wide('oph', 'level', 'oph-level', 'Producto por hora trabajada, índice 1955 = 100'),
    wide('oph', 'change', 'oph-change', 'Producto por hora trabajada, variación anual (%)'),
    {
      id: 'cumulative',
      title: 'Variación acumulada 2011-2023 (%)',
      columns: ['País', 'PTF', 'Producto por hora'],
      rows: COUNTRIES.map((c) => [c.name, cumulative2011('tfp', c.code), cumulative2011('oph', c.code)])
    }
  ];
}

/** The data behind each slide of the Recorrido (steps 0 to 14) and the simulator, as tables ready to read and to download. */
export function buildSlides(): SlideData[] {
  const argentina = argentinaReal();
  const region = regionCountries();
  const regionNow = regionValuesAt(WORLD_LAST);
  const regionPerCapita = regionValuesAt(WORLD_LAST, 'percapita');
  const regionPopulation = regionValuesAt(WORLD_LAST, 'population');
  const provinces = (): DataTable => ({
    id: 'provinces',
    title: `Producción por provincia (${PRODUCTION_UNIT})`,
    columns: ['Provincia', ...(Object.keys(SECTOR_LABELS) as Sector[]).map((s) => SECTOR_LABELS[s])],
    rows: PROVINCES.map((p, i) => [p.name, ...(Object.keys(SECTOR_LABELS) as Sector[]).map((s) => SECTOR_VALUES[s][i] ?? null)])
  });
  const sim = simulate(DEFAULT_SIM);

  return [
    slide(
      '0',
      `El PBI de Argentina desde ${WORLD_FIRST}`,
      [
        { id: 'gdp-real', title: `PBI real de Argentina (${WORLD_UNIT})`, columns: ['Año', 'PBI real'], rows: argentina.years.map((y, i) => [y, argentina.values[i] ?? null]) },
        {
          id: 'region',
          title: `Mayores economías de la región en ${WORLD_LAST}`,
          columns: ['País', 'PBI real (miles de millones de USD de 2015)', 'PBI per cápita real (USD de 2015)', 'Población (millones)'],
          rows: region.map((c, i) => [c, regionNow[i] ?? null, regionPerCapita[i] ?? null, regionPopulation[i] ?? null])
        },
        imfComparison()
      ],
      false,
      ['W5', 'I1', 'F1']
    ),
    slide('8', RESOURCES_TITLE, [chartTable(8), ...miningTables(), rigiTable('rigi-mining', 'Proyectos mineros del RIGI y otros en evaluación (prensa, sin verificar)', RIGI_MINING), chartTable(9, HYDROCARBONS_CHART), nationalProduction(), oilSince1950(), rigiTable('rigi-oil-gas', 'Proyectos de petróleo y gas del RIGI y otros en evaluación (prensa, sin verificar)', RIGI_OIL_GAS), chartTable(10, AGRO_USD_CHART), agroTable(), { ...chartTable(10, AGRO_TONNES_CHART), id: 'agro-tonnes' }, chartTable(13, STOCK_CHART), reservesTable(),
      provinces(),
      { id: 'provinces-value', title: `Valor productivo por provincia (${PRODUCTION_UNIT})`, columns: ['Provincia', 'Valor'], rows: PROVINCES.map((p, i) => [p.name, PROVINCE_VALUES[i] ?? null]) },
      hydrocarbonProvinces(),
      livestockTable(),
      otherCropsTable(),
      indicators()], false, ['R15', 'W3', 'E3', 'E5', 'E9', 'E11', 'R1', 'R2', 'R3', 'R4', 'R5', 'R9', 'R12', 'R13', 'R14', 'E6', 'E4', 'R6', 'R7', 'R8', 'R10', 'R11', 'E8']),
    slide('5', TOUR_CHARTS[5]!.title, [chartTable(5), errorTable(), argentinaTable(), convergenceTable(), countriesTable(), scenariosTable(), imfTable()], false),
    slide('12', COMPOSITION_TITLE, [
      chartTable(12),
      {
        id: 'gdp',
        title: `PBI de Argentina (${GDP_MOCK.unit})`,
        columns: ['Año', 'PBI observado', 'Proyección esperada', 'Rango, mínimo', 'Rango, máximo'],
        rows: GDP_MOCK.years.map((y, i) => [y, GDP_MOCK.history[i] ?? null, GDP_MOCK.expected[i] ?? null, GDP_MOCK.low[i] ?? null, GDP_MOCK.high[i] ?? null])
      },
      ...externalTables(),
      indicators(),
      chartTable(4),
      { ...chartTable(4, EXPORT_COMPOSITION_CHART), id: 'chart-11' },
      complexesTable(),
      exportSharesTable(),
      greatItemsTable(),
      ...servicesTables()
    ], true, ['W3', 'W5', 'I1', 'F1', 'X1', 'X2', 'X3', 'E2', 'E7', 'E1', 'E10']),
    slide('14', 'Productividad', productivityTables(), false, ['P6', 'P7', 'P7b', 'P1', 'P8', 'P9']),
    slide('3', TOUR_CHARTS[3]!.title, [chartTable(3), ...aiTables(), perCapitaTable(), aiPopulationTable()], true, ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']),
    slide('16', DEVELOPMENT_TITLE, [
      {
        id: 'hdi-series',
        title: 'Índice de Desarrollo Humano (IDH) de Argentina (1990-2023)',
        columns: ['Año', 'Valor IDH', 'Categoría', 'Fuente'],
        rows: [
          [1990, 0.733, 'Alto', 'PNUD'],
          [1995, 0.762, 'Alto', 'PNUD'],
          [2000, 0.789, 'Alto', 'PNUD'],
          [2005, 0.809, 'Muy alto', 'PNUD'],
          [2010, 0.844, 'Muy alto', 'PNUD'],
          [2015, 0.859, 'Muy alto', 'PNUD'],
          [2018, 0.852, 'Muy alto', 'PNUD'],
          [2019, 0.853, 'Muy alto', 'PNUD'],
          [2020, 0.851, 'Muy alto', 'PNUD'],
          [2021, 0.847, 'Muy alto', 'PNUD'],
          [2022, 0.858, 'Muy alto', 'PNUD'],
          [2023, 0.865, 'Muy alto', 'PNUD']
        ]
      },
      {
        id: 'life-expectancy',
        title: 'Esperanza de vida al nacer (Banco Mundial WDI, años)',
        columns: ['País o Año', 'Valor', 'Fuente'],
        rows: [
          ['Argentina 1990', 71.6, 'Banco Mundial'],
          ['Argentina 2000', 73.9, 'Banco Mundial'],
          ['Argentina 2010', 75.7, 'Banco Mundial'],
          ['Argentina 2019', 76.8, 'Banco Mundial'],
          ['Argentina 2021 (COVID)', 73.9, 'Banco Mundial'],
          ['Argentina 2023', 77.4, 'Banco Mundial'],
          ['Argentina 2024', 77.5, 'Banco Mundial'],
          ['Chile 2023', 81.2, 'Banco Mundial'],
          ['Uruguay 2023', 78.1, 'Banco Mundial'],
          ['Colombia 2023', 77.7, 'Banco Mundial'],
          ['Brasil 2023', 75.8, 'Banco Mundial'],
          ['México 2023', 75.1, 'Banco Mundial']
        ]
      },
      {
        id: 'infant-mortality',
        title: 'Mortalidad infantil (Banco Mundial WDI / DEIS, defunciones por 1.000 nacidos vivos)',
        columns: ['País o Año', 'Tasa', 'Fuente'],
        rows: [
          ['Argentina 1990', 24.8, 'Banco Mundial'],
          ['Argentina 2000', 16.7, 'Banco Mundial'],
          ['Argentina 2010', 12.4, 'Banco Mundial'],
          ['Argentina 2020', 8.7, 'Banco Mundial'],
          ['Argentina 2023', 8.2, 'Banco Mundial'],
          ['Argentina 2024', 8.0, 'Banco Mundial'],
          ['Chile 2023', 5.9, 'Banco Mundial'],
          ['Uruguay 2023', 6.1, 'Banco Mundial'],
          ['Colombia 2023', 10.8, 'Banco Mundial'],
          ['Brasil 2023', 12.4, 'Banco Mundial'],
          ['México 2023', 12.4, 'Banco Mundial']
        ]
      },
      {
        id: 'gini-index',
        title: 'Coeficiente de Gini de desigualdad (Banco Mundial / INDEC SEDLAC, escala 0-100)',
        columns: ['País o Año', 'Índice Gini', 'Fuente'],
        rows: [
          ['Argentina 1995', 48.9, 'Banco Mundial'],
          ['Argentina 2002 (crisis)', 53.8, 'Banco Mundial'],
          ['Argentina 2010', 43.7, 'Banco Mundial'],
          ['Argentina 2018', 41.7, 'Banco Mundial'],
          ['Argentina 2022', 40.7, 'Banco Mundial'],
          ['Argentina 2023', 42.4, 'Banco Mundial'],
          ['Argentina 2024', 42.4, 'Banco Mundial'],
          ['Uruguay 2023', 40.9, 'Banco Mundial'],
          ['Chile 2022', 43.2, 'Banco Mundial'],
          ['México 2022', 43.5, 'Banco Mundial'],
          ['Brasil 2023', 51.5, 'Banco Mundial'],
          ['Colombia 2023', 54.6, 'Banco Mundial']
        ]
      },
      {
        id: 'schooling-years',
        title: 'Años de escolaridad en adultos y expectativa infantil (PNUD Human Development Report)',
        columns: ['País o Año', 'Años promedio (≥25 años)', 'Años esperados', 'Fuente'],
        rows: [
          ['Argentina 1990', 8.8, 13.2, 'PNUD'],
          ['Argentina 2000', 9.6, 15.5, 'PNUD'],
          ['Argentina 2010', 10.4, 16.8, 'PNUD'],
          ['Argentina 2020', 10.9, 17.7, 'PNUD'],
          ['Argentina 2023', 11.2, 18.8, 'PNUD'],
          ['Chile 2022', 11.1, 16.8, 'PNUD'],
          ['Uruguay 2022', 9.3, 17.3, 'PNUD'],
          ['México 2022', 9.0, 14.9, 'PNUD'],
          ['Colombia 2022', 8.9, 14.9, 'PNUD'],
          ['Brasil 2022', 8.3, 15.6, 'PNUD']
        ]
      },
      {
        id: 'pisa-argentina',
        title: 'Resultados PISA Argentina (puntajes medios 2012, 2018, 2022)',
        columns: ['Ciclo PISA', 'Lectura', 'Matemática', 'Ciencias', 'Fuente'],
        rows: [
          ['PISA 2012', 396, 388, 406, 'OCDE'],
          ['PISA 2018', 402, 379, 404, 'OCDE'],
          ['PISA 2022', 401, 378, 406, 'OCDE']
        ]
      },
      {
        id: 'pisa-latam-math',
        title: 'PISA 2022: Comparación regional en Matemática',
        columns: ['País', 'Puntaje Matemática', 'Fuente'],
        rows: [
          ['Chile', 412, 'OCDE'],
          ['Uruguay', 409, 'OCDE'],
          ['México', 395, 'OCDE'],
          ['Colombia', 383, 'OCDE'],
          ['Brasil', 379, 'OCDE'],
          ['Argentina', 378, 'OCDE']
        ]
      },
      {
        id: 'development-draft',
        title: 'Estructura conceptual de indicadores de desarrollo',
        columns: ['Indicador', 'Dimensión', 'Organismo de referencia'],
        rows: [
          ['IDH', 'Desarrollo humano', 'PNUD'],
          ['Resultados PISA por área', 'Educación y aprendizaje', 'OCDE'],
          ['Deserción universitaria', 'Educación superior', 'Ministerio de Capital Humano'],
          ['Esperanza de vida', 'Salud y longevidad', 'Banco Mundial / OMS'],
          ['Graduación universitaria y STEM', 'Capital humano avanzado', 'CONICET / Universidades'],
          ['Maestría y doctorado', 'Formación de posgrado', 'CONICET / Redes académicas'],
          ['Índice de Gini', 'Distribución del ingreso', 'INDEC / Banco Mundial'],
          ['PBI por habitante y salarios reales', 'Bienestar material', 'INDEC / FMI']
        ]
      }
    ], false, ['D1', 'D2', 'W1', 'S3']),
    slide('17', FORECAST_UNCERTAINTY_TITLE, [
      {
        id: 'tech-diffusion-lags',
        title: 'Rezagos históricos de adopción tecnológica (Comin & Hobijn / Our World in Data)',
        columns: ['Tecnología', 'Categoría', 'Año invención', 'Años adopción masiva (>50%)', 'Fuente'],
        rows: [
          ['Electricidad residencial', 'Física / Red', 1879, 46, 'CHAT / NBER · OWID'],
          ['Telefonía fija', 'Física / Red', 1876, 50, 'CHAT / NBER · OWID'],
          ['Automóvil', 'Física / Red', 1886, 40, 'CHAT / NBER'],
          ['Computadora personal', 'Digital / Software', 1975, 18, 'OWID · World Bank'],
          ['Internet / WWW', 'Digital / Software', 1991, 7, 'OWID · ITU'],
          ['Smartphones', 'Digital / Software', 2007, 10, 'Pew Research · OWID'],
          ['IA Generativa (usuarios)', 'Inteligencia Artificial', 2022, 1, 'Stanford HAI AI Index'],
          ['IA en procesos productivos core', 'Inteligencia Artificial', 2023, 8, 'Productivity J-Curve · Acemoglu']
        ]
      },
      {
        id: 'ai-inference-costs',
        title: 'Evolución del costo de inferencia por 1M de tokens (Stanford HAI / Artificial Analysis)',
        columns: ['Periodo', 'Modelo de referencia', 'Costo por 1M tokens (USD)', 'Benchmark'],
        rows: [
          ['Nov 2022', 'text-davinci-003', 20.0, 'GPT-3.5 benchmark base'],
          ['Mar 2023', 'gpt-3.5-turbo (v1)', 2.0, 'GPT-3.5 benchmark'],
          ['Nov 2023', 'gpt-3.5-turbo (v2)', 1.0, 'GPT-3.5 benchmark'],
          ['Jun 2024', 'gpt-4o-mini', 0.15, 'MMLU 82.0%'],
          ['Oct 2024', 'Gemini 1.5 Flash-8B', 0.07, 'GPT-3.5 benchmark (~280x caída)'],
          ['2025 Ref', 'Destilados frontera', 0.04, 'Hardware optimizado']
        ]
      },
      {
        id: 'ai-training-costs',
        title: 'Cómputo acumulado y costo de entrenamiento de modelos frontera (Epoch AI / Stanford HAI)',
        columns: ['Modelo', 'Año', 'FLOPs estimados (log10)', 'Hardware representativo'],
        rows: [
          ['Perceptron Mark I', 1958, '8.8 (7e8)', 'Custom Analog / IBM 704'],
          ['Deep Blue', 1997, '13.3 (2e13)', 'RS/6000 SP + ASICs'],
          ['AlexNet', 2012, '17.1 (1.4e17)', '2x NVIDIA GTX 580'],
          ['Transformer', 2017, '19.4 (2.3e19)', '8x NVIDIA P100'],
          ['GPT-3 (175B)', 2020, '23.5 (3.1e23)', '10.000x NVIDIA V100'],
          ['GPT-4', 2023, '25.3 (2.1e25)', '~25.000x NVIDIA A100'],
          ['Gemini 1.0 Ultra', 2023, '25.7 (5.0e25)', 'Google TPU v4/v5e']
        ]
      },
      {
        id: 'macro-forecast-errors',
        title: 'Desvíos históricos en pronósticos de PBI en Argentina (FMI WEO t-1 vs INDEC)',
        columns: ['Año objetivo', 'Proyección FMI WEO (%)', 'PBI real observado (%)', 'Desvío absoluto (pp)'],
        rows: [
          [2018, 2.5, -2.6, 5.1],
          [2019, 1.6, -2.0, 3.6],
          [2020, -1.3, -9.9, 8.6],
          [2021, 4.9, 10.7, 5.8],
          [2022, 2.5, 5.0, 2.5],
          [2023, 2.0, -1.6, 3.6],
          [2024, -2.8, -3.5, 0.7]
        ]
      },
      {
        id: 'forecast-uncertainty-draft',
        title: 'Dimensiones analíticas de incertidumbre tecnológica',
        columns: ['Dimensión tecnológica', 'Enfoque analítico'],
        rows: [
          ['Difusión de tecnologías y productividad', 'Rezagos históricos de adopción y productividad agregada'],
          ['Capacidad de modelos y costos de inferencia', 'Evolución de costo unitario por token y escala de cómputo'],
          ['Hardware de cómputo y robótica', 'Ley de Moore, aceleradores dedicados y automatización física'],
          ['Revisiones de pronósticos económicos', 'Comparación de proyecciones históricas frente a series efectivas'],
          ['IA, empleo y salarios', 'Efectos de complementariedad vs. sustitución de tareas laborales'],
          ['Crecimiento, educación, ahorro e inversión', 'Canales de acumulación de capital físico y humano a largo plazo']
        ]
      }
    ], false, ['D3', 'A1', 'A8', 'F1']),
    slide('21', AI_ACCESS_TITLE, [
      {
        id: 'ai-plans-cost',
        title: 'Costo mensual de los planes de IA con impuestos, pagando con tarjeta (USD)',
        columns: ['País', 'Plan (USD)', 'Impuestos (%)', 'Impuestos (USD)', 'Total por mes (USD)', 'De más por año (USD)'],
        rows: PLANS.flatMap((p) => accessRows(p.price).map((r) => [r.country, p.price, ACCESS_COUNTRIES.find((c) => c.name === r.country)!.taxes.reduce((s, t) => s + t.pct, 0), Math.round(r.taxes * 100) / 100, Math.round(r.total * 100) / 100, Math.round(r.yearlyExtra * 100) / 100]))
      },
      {
        id: 'ai-plans-taxes',
        title: 'Impuestos que se suman al precio de lista por país',
        columns: ['País', 'Impuesto', 'Porcentaje'],
        rows: ACCESS_COUNTRIES.flatMap((c) => (c.taxes.length === 0 ? [[c.name, 'Sin impuesto nacional', 0]] : c.taxes.map((t) => [c.name, t.label, t.pct])))
      }
    ], false, ['A20', 'A21', 'A22']),
    ...DRAFT_SLIDES.map((d) => slide(String(d.id), d.title, [{ id: `draft-${d.id}`, title: 'Temas de la diapositiva', columns: ['Tema', 'Descripción'], rows: d.topics.map((t) => [t.heading, t.text]) }], false)),
    slide('sim', 'Simulador del PBI', [
      { id: 'factors', title: 'Factores del escenario de referencia', columns: ['Factor', 'Valor', 'Unidad'], rows: SIM_FIELDS.map((f) => [f.label, DEFAULT_SIM[f.key], f.unit]) },
      { id: 'reference', title: 'PBI del escenario de referencia (miles de millones de USD)', columns: ['Año', 'PBI'], rows: sim.years.map((y, i) => [y, sim.gdp[i] ?? null]) }
    ])
  ];
}
