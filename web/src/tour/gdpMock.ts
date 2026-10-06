import { linesSpec } from '../charts3d/specs';
import type { Lines3DSpec } from '../charts3d/types';
import { tokens } from '../styles/tokens';

/** The last year of the (made-up) history; the projection starts from it. */
export const LAST_OBSERVED_YEAR = 2025;
const FIRST_YEAR = 1990;
const LAST_YEAR = 2056;

export interface GdpData {
  unit: string;
  source: string;
  years: number[];
  /** the observed path; null after the last observed year */
  history: Array<number | null>;
  /** the expected path; null before the last observed year, where it joins the history */
  expected: Array<number | null>;
  /** the range around the expected path (same length as `years`; equal to the history before the projection) */
  low: number[];
  high: number[];
}

/** Made-up growth by year, in %: a shape with booms and crises, not a measurement. */
function growth(year: number): number {
  if (year <= 1998) return 4.5;
  if (year <= 2002) return -4;
  if (year <= 2011) return 6;
  if (year <= 2019) return 0.5;
  if (year === 2020) return -9;
  if (year <= 2023) return 4;
  return 1.5;
}

/** Made-up expected growth of the projection, in %. */
const PROJECTED_GROWTH = 2.6;
/** Made-up widening of the range per year away from the last observed one. */
const SPREAD_PER_YEAR = 0.012;

const round1 = (value: number): number => Math.round(value * 10) / 10;

function build(): GdpData {
  const years: number[] = [];
  const history: Array<number | null> = [];
  const expected: Array<number | null> = [];
  const low: number[] = [];
  const high: number[] = [];
  let value = 280;
  for (let year = FIRST_YEAR; year <= LAST_YEAR; year += 1) {
    years.push(year);
    if (year <= LAST_OBSERVED_YEAR) {
      if (year > FIRST_YEAR) value *= 1 + growth(year) / 100;
      const rounded = round1(value);
      history.push(rounded);
      expected.push(year === LAST_OBSERVED_YEAR ? rounded : null);
      low.push(rounded);
      high.push(rounded);
    } else {
      value *= 1 + PROJECTED_GROWTH / 100;
      const rounded = round1(value);
      const spread = 1 + SPREAD_PER_YEAR * (year - LAST_OBSERVED_YEAR) ** 1.25;
      history.push(null);
      expected.push(rounded);
      low.push(round1(rounded / spread));
      high.push(round1(rounded * spread));
    }
  }
  return { unit: 'miles de millones de USD', source: 'Datos de prueba (inventados)', years, history, expected, low, high };
}

export const GDP_MOCK: GdpData = build();

/** The same data for the 3D line chart. */
export function gdpLinesSpec(data: GdpData): Lines3DSpec {
  return linesSpec({
    title: 'PBI de la Argentina',
    unit: data.unit,
    xLabels: data.years.map(String),
    series: [
      { name: 'PBI observado', values: data.history, tone: 'highlight' },
      { name: 'Proyección esperada', values: data.expected, tone: 'accent', color: tokens.blue }
    ],
    band: { lower: data.low, upper: data.high },
    marker: data.years.indexOf(LAST_OBSERVED_YEAR)
  });
}
