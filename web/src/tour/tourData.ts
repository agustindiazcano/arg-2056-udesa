import type { GdpData } from './gdpMock.js';

/** The label every made-up chart of the Recorrido carries. */
export const MOCK_SOURCE = 'Datos de prueba (inventados)';

const round1 = (value: number): number => Math.round(value * 10) / 10;

export interface LineSeriesData {
  name: string;
  values: Array<number | null>;
  color: string;
  dashed?: boolean;
}

/** Step 3: the GDP with and without the AI revolution, 2025 to 2056 (made up). */
export function aiImpactData(): { unit: string; years: number[]; series: LineSeriesData[] } {
  const years: number[] = [];
  const without: number[] = [];
  const withAi: number[] = [];
  let a = 650;
  let b = 650;
  for (let year = 2025; year <= 2056; year += 1) {
    years.push(year);
    without.push(round1(a));
    withAi.push(round1(b));
    // without AI the economy grows 1.8 % a year; with AI the rate climbs to 3.8 % by 2042 and stays there
    a *= 1.018;
    b *= 1 + Math.min(0.018 + ((year - 2025) / 17) * 0.02, 0.038);
  }
  return {
    unit: 'miles de millones de USD',
    years,
    series: [
      { name: 'Sin revolución de la IA', values: without, color: '#898781' },
      { name: 'Con revolución de la IA', values: withAi, color: '#3987e5' }
    ]
  };
}

export interface ColumnRow {
  label: string;
  value: number;
}

/** Step 4: exports by sector, in billions of USD a year (made up). */
export const EXPORTS_BY_SECTOR = {
  unit: 'miles de millones de USD',
  rows: [
    { label: 'Agro y alimentos', value: 38 },
    { label: 'Industria', value: 12 },
    { label: 'Energía', value: 9 },
    { label: 'Minería', value: 6.5 },
    { label: 'Servicios', value: 8 }
  ] satisfies ColumnRow[]
};

/** The year the Rule of 70 example highlights (the made-up expected growth). */
export const RULE70_HIGHLIGHT = '3 %';

/** Step 5: the rule of 70, 70 / growth in % = years to double. Arithmetic, not a measurement. */
export function rule70Rows(): ColumnRow[] {
  return [1, 2, 3, 4, 5, 6, 7, 8].map((g) => ({ label: `${g} %`, value: round1(70 / g) }));
}

/** Step 6: what the investors look at, scored 0 to 10 (made up). */
export const INVESTOR_SCORES = {
  unit: 'puntos (0 a 10)',
  rows: [
    { label: 'Estabilidad macro', value: 4.5 },
    { label: 'Riesgo país', value: 3.8 },
    { label: 'Reglas de juego', value: 4.2 },
    { label: 'Infraestructura', value: 5.5 },
    { label: 'Capital humano', value: 6.8 },
    { label: 'Recursos naturales', value: 8.6 }
  ] satisfies ColumnRow[]
};

/** Step 7: a made-up productive value by province, in millions of USD (in the order of `PROVINCES`). */
export const PROVINCE_VALUES: ReadonlyArray<number> = [
  3200, 41000, 9800, 1400, 5200, 900, 2100, 1800, 3600, 1500, 2300, 6400, 2000, 700, 7800, 2700, 21000, 1600, 4800, 1200, 2200, 19500, 1300, 5600
];

export interface RangedGroups {
  unit: string;
  categories: string[];
  today: number[];
  project: number[];
  low: number[];
  high: number[];
}

/** Step 8: mining today against the projects, with the range of the projects (made up). */
export const MINING: RangedGroups = {
  unit: 'miles de millones de USD',
  categories: ['Litio', 'Cobre', 'Oro', 'Plata'],
  today: [1.2, 0.1, 1.1, 0.5],
  project: [6, 7.5, 2.4, 1.3],
  low: [4, 5, 1.8, 0.9],
  high: [8.5, 10, 3.2, 1.8]
};

/** Step 9: hydrocarbons, 2015 to 2056, with the floor and the ceiling that Vaca Muerta sets (made up). */
export const HYDROCARBONS_LAST_OBSERVED = 2025;
export function hydrocarbonsData(): GdpData {
  const years: number[] = [];
  const history: Array<number | null> = [];
  const expected: Array<number | null> = [];
  const low: number[] = [];
  const high: number[] = [];
  let value = 640;
  for (let year = 2015; year <= 2056; year += 1) {
    years.push(year);
    if (year <= HYDROCARBONS_LAST_OBSERVED) {
      if (year > 2015) value *= year <= 2019 ? 1.0 : year === 2020 ? 0.93 : 1.055;
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
      // the floor flattens (the conventional wells decline), the ceiling is Vaca Muerta at full speed
      low.push(round1(v * (1 - 0.1 - 0.012 * k)));
      high.push(round1(v * (1 + 0.04 * k ** 0.9)));
    }
  }
  return { unit: 'miles de barriles equivalentes por día', source: MOCK_SOURCE, years, history, expected, low, high, lastObserved: HYDROCARBONS_LAST_OBSERVED };
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

/** Step 11: composition of the exports, in % of the total (made up). */
export const EXPORT_COMPOSITION = {
  unit: '%',
  rows: [
    { label: 'Complejo sojero', value: 24 },
    { label: 'Maíz y cereales', value: 16 },
    { label: 'Petróleo y gas', value: 10 },
    { label: 'Automotriz', value: 8 },
    { label: 'Minería', value: 7 },
    { label: 'Carnes y lácteos', value: 9 },
    { label: 'Servicios', value: 14 },
    { label: 'Otros', value: 12 }
  ] satisfies ColumnRow[]
};

/** Step 12: composition of the GDP, in % of the total (made up). */
export const GDP_COMPOSITION = {
  unit: '%',
  rows: [
    { label: 'Servicios', value: 53 },
    { label: 'Industria', value: 17 },
    { label: 'Comercio', value: 13 },
    { label: 'Agro', value: 8 },
    { label: 'Construcción', value: 4 },
    { label: 'Energía y minería', value: 5 }
  ] satisfies ColumnRow[]
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
