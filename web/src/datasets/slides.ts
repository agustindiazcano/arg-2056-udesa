import { PROVINCES } from '../types/province.js';
import { GDP_MOCK } from '../tour/gdpMock.js';
import { TOUR_INDICATORS } from '../tour/indicatorsMock.js';
import { COUNTRIES, cumulative2011, seriesOf } from '../tour/productivity.js';
import { PRODUCTION_UNIT, SECTOR_LABELS, SECTOR_VALUES } from '../tour/provinceMock.js';
import type { Sector } from '../tour/provinceMock.js';
import { DEFAULT_SIM, SIM_FIELDS, simulate } from '../tour/simModel.js';
import { specRaw } from '../tour/specTable.js';
import { TOUR_CHARTS } from '../tour/tourCharts.js';
import { PROVINCE_VALUES } from '../tour/tourData.js';
import { LAST_YEAR as WORLD_LAST, WORLD_UNIT, argentinaSince1900, regionCountries, regionValuesAt } from '../tour/worldData.js';
import type { DataTable, SlideData } from './types.js';

const indicators = (): DataTable => ({
  id: 'indicators',
  title: 'Indicadores de la Argentina',
  columns: ['Indicador', 'Valor', 'Unidad'],
  rows: TOUR_INDICATORS.map((i) => [i.label, i.value, i.unit])
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
  const world = argentinaSince1900();
  const region = regionCountries();
  const regionNow = regionValuesAt(WORLD_LAST);
  const provinces = (): DataTable => ({
    id: 'provinces',
    title: `Producción por provincia (${PRODUCTION_UNIT})`,
    columns: ['Provincia', ...(Object.keys(SECTOR_LABELS) as Sector[]).map((s) => SECTOR_LABELS[s])],
    rows: PROVINCES.map((p, i) => [p.name, ...(Object.keys(SECTOR_LABELS) as Sector[]).map((s) => SECTOR_VALUES[s][i] ?? null)])
  });
  const sim = simulate(DEFAULT_SIM);

  return [
    slide('0', 'El PBI de la Argentina desde 1900', [
      { id: 'gdp-1900', title: `PBI de la Argentina (${WORLD_UNIT})`, columns: ['Año', 'PBI'], rows: world.years.map((y, i) => [y, world.values[i] ?? null]) },
      { id: 'region', title: `Mayores economías de la región en ${WORLD_LAST} (${WORLD_UNIT})`, columns: ['País', 'PBI'], rows: region.map((c, i) => [c, regionNow[i] ?? null]) }
    ]),
    slide('1', 'PBI de la Argentina', [
      {
        id: 'gdp',
        title: `PBI de la Argentina (${GDP_MOCK.unit})`,
        columns: ['Año', 'PBI observado', 'Proyección esperada', 'Rango, mínimo', 'Rango, máximo'],
        rows: GDP_MOCK.years.map((y, i) => [y, GDP_MOCK.history[i] ?? null, GDP_MOCK.expected[i] ?? null, GDP_MOCK.low[i] ?? null, GDP_MOCK.high[i] ?? null])
      },
      indicators()
    ]),
    slide('2', 'Producción por provincia', [provinces(), indicators()]),
    ...[3, 4, 5, 6].map((s) => slide(String(s), TOUR_CHARTS[s]!.title, [chartTable(s)], s !== 5)),
    slide('7', TOUR_CHARTS[7]!.title, [
      { id: 'provinces-value', title: `Valor productivo por provincia (${PRODUCTION_UNIT})`, columns: ['Provincia', 'Valor'], rows: PROVINCES.map((p, i) => [p.name, PROVINCE_VALUES[i] ?? null]) }
    ]),
    ...[8, 9, 10, 11, 12, 13].map((s) => slide(String(s), TOUR_CHARTS[s]!.title, [chartTable(s)])),
    slide('14', 'Productividad', productivityTables(), false, ['P6', 'P7', 'P7b', 'P1', 'P8', 'P9']),
    slide('sim', 'Simulador del PBI', [
      { id: 'factors', title: 'Factores del escenario de referencia', columns: ['Factor', 'Valor', 'Unidad'], rows: SIM_FIELDS.map((f) => [f.label, DEFAULT_SIM[f.key], f.unit]) },
      { id: 'reference', title: 'PBI del escenario de referencia (miles de millones de USD)', columns: ['Año', 'PBI'], rows: sim.years.map((y, i) => [y, sim.gdp[i] ?? null]) }
    ])
  ];
}
