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
  let a = 609.2;
  let b = 609.2;
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

/** The INDEC source of steps 4 and 11 (Intercambio comercial argentino, informe de agosto de 2026). */
export const EXPORTS_SOURCE = 'INDEC, Intercambio comercial argentino (informe de agosto de 2026), acumulado de enero a julio de 2026';

/** Step 4: exports by great item (grandes rubros), in billions of USD, accumulated January to July 2026. Real: INDEC, read on 2026-10-12. */
export const EXPORTS_BY_SECTOR = {
  unit: 'miles de millones de USD',
  rows: [
    { label: 'Productos primarios', value: 14.749 },
    { label: 'Manufacturas de origen agropecuario', value: 18.911 },
    { label: 'Manufacturas de origen industrial', value: 15.554 },
    { label: 'Combustibles y energía', value: 9.151 }
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

/**
 * Oil of the Vaca Muerta formation in millions of barrels a year, 2015 to 2025. Real: IAE, "Vaca Muerta: análisis 2025", with data of the
 * Secretaría de Energía (table "Producción anual de Vaca Muerta"), read on 2026-10-12. The 2025 average, 499 thousand barrels a day, matches the 499,061 of the report.
 */
const VACA_MUERTA_OIL_MMBO: Readonly<Record<number, number>> = { 2015: 8.3, 2016: 10.9, 2017: 13.7, 2018: 20.8, 2019: 32.9, 2020: 41.4, 2021: 59.4, 2022: 88.6, 2023: 111.5, 2024: 141.6, 2025: 182.2 };
const daysIn = (year: number): number => (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365);

export const HYDROCARBONS_SOURCE = 'Historia 2015-2025: IAE con datos de la Secretaría de Energía; proyección y rango: datos de prueba (inventados)';

/** Step 9: oil of Vaca Muerta in thousands of barrels a day, 2015 to 2056: real until 2025, then a made-up projection with the floor and the ceiling that Vaca Muerta sets. */
export const HYDROCARBONS_LAST_OBSERVED = 2025;
export function hydrocarbonsData(): GdpData {
  const years: number[] = [];
  const history: Array<number | null> = [];
  const expected: Array<number | null> = [];
  const low: number[] = [];
  const high: number[] = [];
  let value = 0;
  for (let year = 2015; year <= 2056; year += 1) {
    years.push(year);
    if (year <= HYDROCARBONS_LAST_OBSERVED) {
      value = (VACA_MUERTA_OIL_MMBO[year]! * 1000) / daysIn(year);
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
  return { unit: 'miles de barriles de petróleo por día (Vaca Muerta)', source: HYDROCARBONS_SOURCE, years, history, expected, low, high, lastObserved: HYDROCARBONS_LAST_OBSERVED };
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

/** Step 11: composition of the exports by great item, in % of the total of January to July 2026 (58.365 million USD). Real: INDEC (same source as step 4). */
export const EXPORT_COMPOSITION = {
  unit: '%',
  rows: EXPORTS_BY_SECTOR.rows.map((r) => ({ label: r.label, value: pct1(r.value, 58.365) })) satisfies ColumnRow[]
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
