import { linesSpec } from '../charts3d/specs';
import type { Lines3DSpec } from '../charts3d/types';
import { tokens } from '../styles/tokens';

/** The last year of the history; the projection starts from it. */
export const LAST_OBSERVED_YEAR = 2025;
const FIRST_YEAR = 1990;
const LAST_YEAR = 2056;

/** The names a band chart uses for its three parts and for the subject in its text alternative. */
export interface BandLabels {
  subject: string;
  history: string;
  expected: string;
  range: string;
}

export const GDP_SOURCE = 'Historia 1990-2025: Banco Mundial (dólares constantes de 2015); proyección y rango: datos de prueba (inventados)';

export const GDP_LABELS: BandLabels = { subject: 'PBI de la Argentina', history: 'PBI observado', expected: 'Proyección esperada', range: 'Rango' };

export interface GdpData {
  /** the last observed year when it is not `LAST_OBSERVED_YEAR` (another series of the Recorrido) */
  lastObserved?: number;
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

/**
 * The GDP of Argentina 1990 to 2025 in billions of constant 2015 US dollars. Real: World Bank, WDI `NY.GDP.MKTP.KD`
 * (<https://api.worldbank.org/v2/country/ARG/indicator/NY.GDP.MKTP.KD>), read on 2026-10-12.
 */
const OBSERVED: Readonly<Record<number, number>> = {
  1990: 265.8, 1991: 290.1, 1992: 313.1, 1993: 338.8, 1994: 358.6, 1995: 348.4, 1996: 367.6, 1997: 397.5, 1998: 412.8, 1999: 398.8,
  2000: 395.6, 2001: 378.2, 2002: 337.0, 2003: 366.8, 2004: 399.9, 2005: 435.3, 2006: 470.3, 2007: 512.7, 2008: 533.5, 2009: 501.9,
  2010: 552.7, 2011: 585.9, 2012: 579.9, 2013: 593.9, 2014: 578.9, 2015: 594.7, 2016: 582.4, 2017: 598.8, 2018: 583.1, 2019: 571.5,
  2020: 514.9, 2021: 568.6, 2022: 602.9, 2023: 591.7, 2024: 583.7, 2025: 609.2
};

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
  let value = OBSERVED[LAST_OBSERVED_YEAR]!;
  for (let year = FIRST_YEAR; year <= LAST_YEAR; year += 1) {
    years.push(year);
    if (year <= LAST_OBSERVED_YEAR) {
      const rounded = OBSERVED[year]!;
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
  return { unit: 'miles de millones de USD de 2015', source: GDP_SOURCE, years, history, expected, low, high };
}

export const GDP_MOCK: GdpData = build();

/** The same data for the 3D line chart. */
export function gdpLinesSpec(data: GdpData, labels: BandLabels = GDP_LABELS): Lines3DSpec {
  return linesSpec({
    title: labels.subject,
    unit: data.unit,
    xLabels: data.years.map(String),
    series: [
      { name: labels.history, values: data.history, tone: 'highlight' },
      { name: labels.expected, values: data.expected, tone: 'accent', color: tokens.blue, dashed: true }
    ],
    band: { lower: data.low, upper: data.high },
    marker: data.years.indexOf(data.lastObserved ?? LAST_OBSERVED_YEAR)
  });
}
