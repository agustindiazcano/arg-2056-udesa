import { PROVINCES } from '../types/province.js';
import { GDP_MOCK } from '../tour/gdpMock.js';
import agro from '../tour/agroArgentina.json';
import energy from '../tour/energyArgentina.json';
import imf from '../tour/imfWeo.json';
import world from '../tour/worldNominal.json';
import { INDICATORS_YEAR, TOUR_INDICATORS } from '../tour/indicatorsMock.js';
import { COUNTRIES, cumulative2011, seriesOf } from '../tour/productivity.js';
import { PRODUCTION_UNIT, SECTOR_LABELS, SECTOR_VALUES } from '../tour/provinceMock.js';
import type { Sector } from '../tour/provinceMock.js';
import { DEFAULT_SIM, SIM_FIELDS, simulate } from '../tour/simModel.js';
import { specRaw } from '../tour/specTable.js';
import { RIGI_MINING, RIGI_OIL_GAS } from '../tour/rigiProjects.js';
import type { RigiProject } from '../tour/rigiProjects.js';
import { TOUR_CHARTS } from '../tour/tourCharts.js';
import { EXPORTS_GREAT_ITEMS, EXPORTS_GREAT_ITEMS_SOURCE, EXPORTS_TOTAL_2025, EXPORT_COMPLEXES, PROVINCE_VALUES } from '../tour/tourData.js';
import { FIRST_YEAR as WORLD_FIRST, LAST_YEAR as WORLD_LAST, WORLD_UNIT, argentinaNominal, regionCountries, regionValuesAt } from '../tour/worldData.js';
import type { DataTable, SlideData } from './types.js';

const indicators = (): DataTable => ({
  id: 'indicators',
  title: 'Indicadores de Argentina',
  columns: ['Indicador', 'Valor', 'Unidad', 'Año', 'Fuente'],
  rows: TOUR_INDICATORS.map((i) => [i.label, i.value, i.unit, INDICATORS_YEAR, 'Banco Mundial (WDI)'])
});

function slide(id: string, title: string, tables: DataTable[], mock = true, refs: string[] = []): SlideData {
  return { id, label: id === 'sim' ? `Simulador del PBI` : `${id} · ${title}`, title, mock, tables, refs };
}

/** The raw table of a chart of the Recorrido (bars or lines), from the same spec the 3D view and the Gráfico | Tabla switch use. */
function chartTable(step: number): DataTable {
  const def = TOUR_CHARTS[step]!;
  const spec = def.build().spec!;
  if (spec.kind === 'map') throw new Error(`step ${step} is a map`);
  const raw = specRaw(spec);
  return { id: `chart-${step}`, title: def.title, ...raw };
}

const rigiTable = (id: string, title: string, projects: readonly RigiProject[]): DataTable => ({
  id,
  title,
  columns: ['Proyecto', 'Empresa', 'Provincia', 'Tipo', 'Inversión (millones de USD)', 'Estado', 'Nota (sin verificar)'],
  rows: projects.map((p) => [p.name, p.company, p.province, p.kind, p.investment, p.status, p.note || '—'])
});

/** The nominal GDP of 2025 of the World Bank (what the app draws) against the IMF (WEO, update of 2026-09-30), and the IMF estimate for 2026. */
const imfComparison = (): DataTable => {
  const idx = world.years.indexOf(2025);
  return {
    id: 'imf',
    title: 'PBI nominal de 2025: Banco Mundial contra FMI, y estimación del FMI para 2026 (miles de millones de USD corrientes)',
    columns: ['País', 'Banco Mundial 2025', 'FMI 2025', 'Diferencia (%)', 'FMI 2026 (estimación)'],
    rows: world.region.map((code) => {
      const c = world.countries.find((x) => x.code === code)!;
      const bm = c.gdp[idx] ?? null;
      const f = (imf.gdp as Record<string, { '2025': number; '2026': number }>)[code];
      return [c.name, bm, f?.['2025'] ?? null, bm !== null && f ? Math.round(((f['2025'] - bm) / bm) * 1000) / 10 : null, f?.['2026'] ?? null];
    })
  };
};

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

/** The data behind each slide of the Recorrido (steps 0 to 14) and the simulator, as tables ready to read and to download. Step 15 has no chart yet. */
export function buildSlides(): SlideData[] {
  const argentina = argentinaNominal();
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
        { id: 'gdp-nominal', title: `PBI nominal de Argentina (${WORLD_UNIT})`, columns: ['Año', 'PBI nominal'], rows: argentina.years.map((y, i) => [y, argentina.values[i] ?? null]) },
        {
          id: 'region',
          title: `Mayores economías de la región en ${WORLD_LAST}`,
          columns: ['País', 'PBI nominal (miles de millones de USD corrientes)', 'PBI per cápita nominal (USD corrientes)', 'Población (millones)'],
          rows: region.map((c, i) => [c, regionNow[i] ?? null, regionPerCapita[i] ?? null, regionPopulation[i] ?? null])
        },
        imfComparison()
      ],
      false,
      ['W5', 'I1', 'F1']
    ),
    slide('1', 'PBI de Argentina', [
      {
        id: 'gdp',
        title: `PBI de Argentina (${GDP_MOCK.unit})`,
        columns: ['Año', 'PBI observado', 'Proyección esperada', 'Rango, mínimo', 'Rango, máximo'],
        rows: GDP_MOCK.years.map((y, i) => [y, GDP_MOCK.history[i] ?? null, GDP_MOCK.expected[i] ?? null, GDP_MOCK.low[i] ?? null, GDP_MOCK.high[i] ?? null])
      },
      indicators()
    ], true, ['W3', 'W5', 'I1', 'F1']),
    slide('2', 'Producción por provincia', [provinces(), hydrocarbonProvinces(), indicators()], true, ['W3', 'E6']),
    slide('3', TOUR_CHARTS[3]!.title, [chartTable(3)]),
    slide('4', TOUR_CHARTS[4]!.title, [chartTable(4), complexesTable(), greatItemsTable()], false, ['E7', 'E1']),
    slide('5', TOUR_CHARTS[5]!.title, [chartTable(5)], false),
    slide('6', TOUR_CHARTS[6]!.title, [chartTable(6)]),
    slide('7', TOUR_CHARTS[7]!.title, [
      { id: 'provinces-value', title: `Valor productivo por provincia (${PRODUCTION_UNIT})`, columns: ['Provincia', 'Valor'], rows: PROVINCES.map((p, i) => [p.name, PROVINCE_VALUES[i] ?? null]) },
      hydrocarbonProvinces()
    ], true, ['E6']),
    slide('8', TOUR_CHARTS[8]!.title, [chartTable(8), rigiTable('rigi-mining', 'Proyectos mineros del RIGI y otros en evaluación (prensa, sin verificar)', RIGI_MINING)], true, ['E3', 'E5', 'R1', 'R2', 'R3', 'R4', 'R5', 'R9']),
    slide('9', TOUR_CHARTS[9]!.title, [chartTable(9), nationalProduction(), oilSince1950(), rigiTable('rigi-oil-gas', 'Proyectos de petróleo y gas del RIGI y otros en evaluación (prensa, sin verificar)', RIGI_OIL_GAS)], true, ['E6', 'E4', 'R2', 'R3', 'R6', 'R7', 'R8', 'R10', 'R11']),
    slide('10', TOUR_CHARTS[10]!.title, [chartTable(10), agroTable()], true, ['E8']),
    slide('11', TOUR_CHARTS[11]!.title, [chartTable(11)], false, ['E7']),
    slide('12', TOUR_CHARTS[12]!.title, [chartTable(12)], false, ['E2']),
    slide('13', TOUR_CHARTS[13]!.title, [chartTable(13), reservesTable()], true, ['E3', 'E5', 'E6']),
    slide('14', 'Productividad', productivityTables(), false, ['P6', 'P7', 'P7b', 'P1', 'P8', 'P9']),
    slide('sim', 'Simulador del PBI', [
      { id: 'factors', title: 'Factores del escenario de referencia', columns: ['Factor', 'Valor', 'Unidad'], rows: SIM_FIELDS.map((f) => [f.label, DEFAULT_SIM[f.key], f.unit]) },
      { id: 'reference', title: 'PBI del escenario de referencia (miles de millones de USD)', columns: ['Año', 'PBI'], rows: sim.years.map((y, i) => [y, sim.gdp[i] ?? null]) }
    ])
  ];
}
