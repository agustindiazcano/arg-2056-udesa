import { MOCK_SOURCE } from './tourData.js';

export { MOCK_SOURCE };

export const WORLD_UNIT = 'miles de millones de USD';
export const FIRST_YEAR = 1900;
export const LAST_YEAR = 2026;

/** Made-up growth of the Argentine economy by year, in %: a shape with booms and crises, not a measurement. */
function growth(year: number): number {
  if (year <= 1913) return 6;
  if (year <= 1918) return -2;
  if (year <= 1929) return 4;
  if (year <= 1932) return -3;
  if (year <= 1945) return 3.5;
  if (year <= 1974) return 3.2;
  if (year <= 1982) return year % 3 === 0 ? -3 : 1.5;
  if (year <= 1990) return year % 2 === 0 ? -1.5 : 2;
  if (year <= 1998) return 5;
  if (year <= 2002) return -5;
  if (year <= 2011) return 6.5;
  if (year <= 2019) return 0.4;
  if (year === 2020) return -9.9;
  if (year <= 2022) return 7;
  if (year <= 2024) return -1.3;
  return 3;
}

export interface LongSeries {
  years: number[];
  values: number[];
}

/** Step 0: the GDP of Argentina from 1900 to 2026, made up. */
export function argentinaSince1900(): LongSeries {
  const years: number[] = [];
  const values: number[] = [];
  let value = 18;
  for (let year = FIRST_YEAR; year <= LAST_YEAR; year += 1) {
    if (year > FIRST_YEAR) value *= 1 + growth(year) / 100;
    years.push(year);
    values.push(Math.round(value * 10) / 10);
  }
  return { years, values };
}

export interface CountryGdp {
  country: string;
  value: number;
}

/** Made-up GDP of the world's economies, in billions of USD (Argentina takes its value from the series above). */
const OTHERS: CountryGdp[] = [
  { country: 'Estados Unidos', value: 28000 },
  { country: 'China', value: 18500 },
  { country: 'Alemania', value: 4600 },
  { country: 'Japón', value: 4200 },
  { country: 'India', value: 3900 },
  { country: 'Reino Unido', value: 3500 },
  { country: 'Francia', value: 3100 },
  { country: 'Italia', value: 2300 },
  { country: 'Brasil', value: 2200 },
  { country: 'Canadá', value: 2150 },
  { country: 'Rusia', value: 2100 },
  { country: 'México', value: 1900 },
  { country: 'Corea del Sur', value: 1800 },
  { country: 'Australia', value: 1750 },
  { country: 'España', value: 1700 },
  { country: 'Indonesia', value: 1500 },
  { country: 'Turquía', value: 1400 },
  { country: 'Países Bajos', value: 1200 },
  { country: 'Arabia Saudita', value: 1150 },
  { country: 'Suiza', value: 950 },
  { country: 'Polonia', value: 880 },
  { country: 'Taiwán', value: 800 },
  { country: 'Bélgica', value: 720 },
  { country: 'Tailandia', value: 590 },
  { country: 'Suecia', value: 560 },
  { country: 'Irlanda', value: 520 }
];

export const HOME = 'Argentina';

export interface RankedCountry extends CountryGdp {
  rank: number;
}

/** Every economy ranked from the largest, Argentina included. */
export function worldRanking(argentina: number): RankedCountry[] {
  return [...OTHERS, { country: HOME, value: argentina }].sort((a, b) => b.value - a.value).map((c, i) => ({ ...c, rank: i + 1 }));
}

/** Made-up GDP of the region (Latin America), in billions of USD. */
const REGION: CountryGdp[] = [
  { country: 'Brasil', value: 2200 },
  { country: 'México', value: 1900 },
  { country: 'Colombia', value: 420 },
  { country: 'Chile', value: 360 },
  { country: 'Perú', value: 300 },
  { country: 'Ecuador', value: 130 },
  { country: 'Rep. Dominicana', value: 125 },
  { country: 'Guatemala', value: 110 },
  { country: 'Panamá', value: 90 },
  { country: 'Uruguay', value: 85 }
];

/** The largest economies of the region, Argentina included, ranked. */
export function regionRanking(argentina: number): RankedCountry[] {
  return [...REGION, { country: HOME, value: argentina }].sort((a, b) => b.value - a.value).map((c, i) => ({ ...c, rank: i + 1 }));
}
