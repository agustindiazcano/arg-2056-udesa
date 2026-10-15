import { doublingTimeExact, yearReached } from '../core/doubling.js';
import type { DataTable } from '../datasets/types.js';
import data from './imfCountries.json';

/**
 * The real GDP growth that the IMF projects for each country of the data, 2026 to 2031 (World Economic Outlook, via the pipeline:
 * `data/processed/external_forecasts.json` -> `scripts/build_external_summary.py` -> `imfCountries.json`), and what a constant rate equal
 * to its average would mean for the doubling time. It is the IMF's projection, not ours.
 */
export interface ImfCountry {
  code: string;
  name: string;
  vintage: string;
  growth: Record<string, number>;
}

export const IMF_FIRST_YEAR = 2026;
export const IMF_LAST_YEAR = 2031;

export const imfCountries = (): ImfCountry[] => data.countries as ImfCountry[];

const vintages = imfCountries().map((c) => c.vintage).sort();

export const IMF_VINTAGE_NOTE = `Proyecciones del FMI, World Economic Outlook, actualizaciones del ${vintages[0]} al ${vintages.at(-1)}. India: el FMI informa por año fiscal (de abril a marzo), no por año calendario.`;

/** The one constant rate (percent a year) that gives the same level in 2031 as the projected growth of 2026 to 2031. */
export function averageGrowth(code: string): number {
  const c = imfCountries().find((x) => x.code === code);
  if (!c) throw new Error(`unknown country ${code}`);
  let level = 1;
  for (let y = IMF_FIRST_YEAR; y <= IMF_LAST_YEAR; y += 1) level *= 1 + c.growth[String(y)]! / 100;
  return (level ** (1 / (IMF_LAST_YEAR - IMF_FIRST_YEAR + 1)) - 1) * 100;
}

/** Years to double at that average rate, and the first year, counting from 2026, whose level is at or above double. */
export function imfImplied(code: string): { rate: number; years: number; year: number | null } {
  const rate = averageGrowth(code);
  return { rate, years: doublingTimeExact(rate), year: yearReached(IMF_FIRST_YEAR, rate, 2).year };
}

const round = (v: number, d: number): number => Math.round(v * 10 ** d) / 10 ** d;

/** The table of the Data page behind the panel of projections. */
export function imfTable(): DataTable {
  const years = Array.from({ length: IMF_LAST_YEAR - IMF_FIRST_YEAR + 1 }, (_, i) => IMF_FIRST_YEAR + i);
  return {
    id: 'rule70-imf',
    title: `Crecimiento real del PBI que proyecta el FMI, ${IMF_FIRST_YEAR} a ${IMF_LAST_YEAR} (% anual), su promedio geométrico y el tiempo de duplicación a ese ritmo. ${IMF_VINTAGE_NOTE}`,
    columns: ['País', ...years.map(String), 'Promedio geométrico (% anual)', 'Duplicación exacta (años)', 'Año en que se duplicaría desde 2026'],
    rows: imfCountries().map((c) => {
      const i = imfImplied(c.code);
      return [c.name, ...years.map((y) => round(c.growth[String(y)]!, 2)), round(i.rate, 2), round(i.years, 1), i.year];
    })
  };
}
