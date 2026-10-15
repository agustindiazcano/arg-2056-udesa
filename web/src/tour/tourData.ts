import { ARG_GDP_2026, GDP_UNIT } from './gdpFacts.js';
import { AI_SCENARIOS, growthIn } from './aiScenarios.js';
import energy from './energyArgentina.json';
import type { GdpData } from './gdpMock.js';

const round1 = (value: number): number => Math.round(value * 10) / 10;

export interface LineSeriesData {
  name: string;
  values: Array<number | null>;
  color: string;
  dashed?: boolean;
}

/**
 * Step 3: the real GDP of Argentina in three scenarios (base, moderate with AI, optimistic), 2026 to 2035. All start at the 2026 figure shared by
 * every slide (`gdpFacts.ts`); after that each grows at the middle of the range its scenario gives (`aiScenarios.ts`).
 */
export function aiImpactData(): { unit: string; years: number[]; series: LineSeriesData[] } {
  const years: number[] = [];
  for (let year = 2026; year <= 2035; year += 1) years.push(year);
  const series = AI_SCENARIOS.map((s) => {
    let level = ARG_GDP_2026;
    const values = years.map((year) => {
      if (year > 2026) level *= 1 + growthIn(s, year) / 100;
      return round1(level);
    });
    return { name: s.name, values, color: s.color };
  });
  return { unit: GDP_UNIT, years, series };
}

export interface ColumnRow {
  label: string;
  value: number;
}

/** The INDEC source of steps 4 and 11: "Complejos exportadores, año 2025" (informe técnico, Comercio exterior vol. 10, n.º 4, March 2026). */
export const EXPORTS_SOURCE = 'INDEC, Complejos exportadores, año 2025 (informe de marzo de 2026, datos provisorios), exportaciones de bienes';
export const EXPORTS_TOTAL_2025 = 87111;

/**
 * Exports of goods by exporting complex, millions of USD, 2025 and 2024 (provisional). Real: INDEC, table 1 of the report, read on 2026-10-13.
 * The ten main complexes add up to 77.7 % of the total, as the report says; "Otros complejos" and "Resto de exportaciones" close it (87,111).
 */
export const EXPORT_COMPLEXES: ReadonlyArray<{ label: string; y2025: number; y2024: number }> = [
  { label: 'Complejo soja', y2025: 21442, y2024: 19628 },
  { label: 'Petrolero-petroquímico', y2025: 11772, y2024: 10435 },
  { label: 'Automotriz', y2025: 8784, y2024: 9010 },
  { label: 'Maicero', y2025: 6660, y2024: 7264 },
  { label: 'Oro y plata', y2025: 4886, y2024: 3827 },
  { label: 'Carne y cuero bovinos', y2025: 4727, y2024: 3804 },
  { label: 'Triguero', y2025: 3649, y2024: 2764 },
  { label: 'Girasol', y2025: 2175, y2024: 1453 },
  { label: 'Pesquero', y2025: 2091, y2024: 2013 },
  { label: 'Lácteo', y2025: 1522, y2024: 1281 },
  { label: 'Otros complejos', y2025: 13346, y2024: 12755 },
  { label: 'Resto de exportaciones', y2025: 6055, y2024: 5469 }
];

/** The great items (grandes rubros) of January to July 2026, billions of USD, from the report of the ICA of August 2026 (another table, shown in Data). */
export const EXPORTS_GREAT_ITEMS_SOURCE = 'INDEC, Intercambio comercial argentino (informe de agosto de 2026), acumulado de enero a julio de 2026';
export const EXPORTS_GREAT_ITEMS = {
  unit: 'miles de millones de USD',
  rows: [
    { label: 'Productos primarios', value: 14.749 },
    { label: 'Manufacturas de origen agropecuario', value: 18.911 },
    { label: 'Manufacturas de origen industrial', value: 15.554 },
    { label: 'Combustibles y energía', value: 9.151 }
  ] satisfies ColumnRow[]
};

/** Step 4: exports by exporting complex in 2025, in billions of USD. Real: INDEC. */
export const EXPORTS_BY_SECTOR = {
  unit: 'miles de millones de USD',
  rows: EXPORT_COMPLEXES.map((c) => ({ label: c.label, value: Math.round(c.y2025 / 100) / 10 })) satisfies ColumnRow[]
};

/** The year the Rule of 70 example highlights (the made-up expected growth). */
export const RULE70_HIGHLIGHT = '3 %';

/** Step 5: the rule of 70, 70 / growth in % = years to double. Arithmetic, not a measurement. */
export function rule70Rows(): ColumnRow[] {
  return [1, 2, 3, 4, 5, 6, 7, 8].map((g) => ({ label: `${g} %`, value: round1(70 / g) }));
}

/** Step 7: a made-up productive value by province, in millions of USD (in the order of `PROVINCES`). */
export const PROVINCE_VALUES: ReadonlyArray<number> = [
  3200, 41000, 9800, 1400, 5200, 900, 2100, 1800, 3600, 1500, 2300, 6400, 2000, 700, 7800, 2700, 21000, 1600, 4800, 1200, 2200, 19500, 1300, 5600
];

export interface RangedGroups {
  unit: string;
  categories: string[];
  today: number[];
  project: number[];
  /** the range of the projects (the whisker); without it the chart draws no whisker */
  low?: number[];
  high?: number[];
}

/** Step 8: mining exports today against the projection of the Secretaría de Minería for 2035. Real (transcribed from the images of ARMINERA 2025). */
export const MINING_SOURCE = 'Secretaría de Minería, ARMINERA 2025: exportaciones de 2024 y proyección para 2035 (transcrito de imágenes)';
export const MINING: RangedGroups = {
  unit: 'miles de millones de USD',
  // 2024: gold 3,141 + silver 652, lithium 645, the rest 235 (copper is inside "resto"); 2035: lithium 11.3, copper 11.7, gold and silver the rest of 25.5
  categories: ['Oro y plata', 'Litio', 'Cobre y resto'],
  today: [3.793, 0.645, 0.235],
  project: [2.5, 11.3, 11.7]
};

/**
 * National oil production in thousand barrels a day, 2015 to 2025: the average of the twelve monthly daily averages of each year, from the open data
 * of the Secretaría de Energía (`energyArgentina.json`, built by `scripts/build_energy_data.py`). 2025 is 793.7 (the IAE report has 800.2 with the same
 * source; the 860 that the press gave is not in the official series).
 */
export const HYDROCARBONS_SOURCE = 'Historia 2015-2025: Secretaría de Energía (datos abiertos)';

/** Step 9: national oil production in thousands of barrels a day, 2015 to 2056: real until 2025, then a made-up projection with the floor and the ceiling that Vaca Muerta sets. */
export const HYDROCARBONS_LAST_OBSERVED = 2025;
export function hydrocarbonsData(): GdpData {
  const national = energy.national as Record<string, { oil_kbd: number }>;
  const years: number[] = [];
  const history: Array<number | null> = [];
  const expected: Array<number | null> = [];
  const low: number[] = [];
  const high: number[] = [];
  let value = 0;
  for (let year = 2015; year <= 2056; year += 1) {
    years.push(year);
    if (year <= HYDROCARBONS_LAST_OBSERVED) {
      value = national[String(year)]!.oil_kbd;
      const v = round1(value);
      history.push(v);
      expected.push(year === HYDROCARBONS_LAST_OBSERVED ? v : null);
      low.push(v);
      high.push(v);
    } else {
      const k = year - HYDROCARBONS_LAST_OBSERVED;
      value *= 1.035;
      const v = round1(value);
      history.push(null);
      expected.push(v);
      // the floor flattens, the ceiling is Vaca Muerta at full speed (made up)
      low.push(round1(v * (1 - 0.1 - 0.012 * k)));
      high.push(round1(v * (1 + 0.04 * k ** 0.9)));
    }
  }
  return { unit: 'miles de barriles de petróleo por día', source: HYDROCARBONS_SOURCE, years, history, expected, low, high, lastObserved: HYDROCARBONS_LAST_OBSERVED };
}

export interface PairedGroups {
  unit: string;
  categories: string[];
  current: number[];
  potential: number[];
}

/** Step 10: agriculture, current production against the potential (made up). */
export const AGRO: PairedGroups = {
  unit: 'miles de millones de USD',
  categories: ['Soja', 'Maíz', 'Trigo', 'Girasol', 'Carne y lácteos'],
  current: [14, 9, 3.5, 1.8, 6],
  potential: [21, 16, 6.5, 3.2, 11]
};

const pct1 = (value: number, total: number): number => Math.round((value / total) * 1000) / 10;

/** Step 11: composition of the exports by exporting complex, in % of the total of 2025 (87,111 million USD). Real: INDEC (same source as step 4). */
export const EXPORT_COMPOSITION = {
  unit: '%',
  rows: EXPORT_COMPLEXES.map((c) => ({ label: c.label, value: pct1(c.y2025, EXPORTS_TOTAL_2025) })) satisfies ColumnRow[]
};

/** The INDEC source of step 12 (Informe de avance del nivel de actividad, 2.º trimestre de 2026). */
export const GDP_COMPOSITION_SOURCE = 'INDEC, Informe de avance del nivel de actividad, 2.º trimestre de 2026 (cuadro 4, valor agregado bruto de 2025, datos preliminares)';

/** Value added by sector in 2025, millions of pesos at 2004 prices (the "Total" column of table 4 of the INDEC report; they add up to 608.097). */
const VAB_2025: ReadonlyArray<readonly [string, number]> = [
  ['Agricultura, ganadería y silvicultura', 51908],
  ['Pesca', 2327],
  ['Minas y canteras', 29876],
  ['Industria manufacturera', 109207],
  ['Electricidad, gas y agua', 13035],
  ['Construcción', 19442],
  ['Comercio mayorista y minorista', 92346],
  ['Hoteles y restaurantes', 12134],
  ['Transporte y comunicaciones', 55544],
  ['Intermediación financiera', 29449],
  ['Inmobiliarias y empresariales', 84346],
  ['Administración pública y defensa', 34818],
  ['Enseñanza', 29390],
  ['Salud y servicios sociales', 24487],
  ['Otros servicios', 15720],
  ['Hogares con servicio doméstico', 4068]
];
const VAB_TOTAL = VAB_2025.reduce((t, [, v]) => t + v, 0);

/** Step 12: composition of the value added by sector, in % of the total (real, INDEC, 2025 at 2004 prices). */
export const GDP_COMPOSITION = {
  unit: '%',
  rows: [...VAB_2025].sort((x, y) => y[1] - x[1]).map(([label, v]) => ({ label, value: pct1(v, VAB_TOTAL) })) satisfies ColumnRow[]
};

/** Step 13: the stock of natural resources, valued in billions of USD (made up). */
export const RESOURCE_STOCK = {
  unit: 'miles de millones de USD',
  rows: [
    { label: 'Litio', value: 900 },
    { label: 'Cobre', value: 650 },
    { label: 'Oro y plata', value: 240 },
    { label: 'Petróleo y gas', value: 1500 },
    { label: 'Tierra agrícola', value: 2100 },
    { label: 'Agua dulce', value: 800 }
  ] satisfies ColumnRow[]
};
