import type { MapValues } from '../scenes/forecast/mapSelectors.js';
import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import { PROVINCE_VALUES } from './tourData.js';

/** The unit of every made-up production value by province. */
export const PRODUCTION_UNIT = 'millones de USD';

export type Sector = 'mineria' | 'agro' | 'hidrocarburos';

export const SECTOR_LABELS: Record<Sector, string> = { mineria: 'Minería', agro: 'Agro', hidrocarburos: 'Hidrocarburos' };

/**
 * Made-up production of each sector by province, in the order of `PROVINCES` (Salta, Buenos Aires, CABA, San Luis, Entre Ríos,
 * La Rioja, Santiago del Estero, Chaco, San Juan, Catamarca, La Pampa, Mendoza, Misiones, Formosa, Neuquén, Río Negro, Santa Fe,
 * Tucumán, Chubut, Tierra del Fuego, Corrientes, Córdoba, Jujuy, Santa Cruz). Every province has a value: none is zero.
 */
export const SECTOR_VALUES: Record<Sector, ReadonlyArray<number>> = {
  mineria: [1800, 350, 20, 160, 90, 420, 40, 10, 2600, 3200, 120, 540, 5, 5, 150, 230, 120, 60, 380, 20, 8, 280, 1900, 2900],
  agro: [1500, 15500, 30, 1300, 3900, 250, 2700, 2100, 450, 220, 2800, 2300, 1200, 650, 300, 1100, 12800, 1400, 350, 40, 1700, 11800, 450, 280],
  hidrocarburos: [900, 600, 5, 20, 5, 5, 5, 5, 10, 5, 400, 4200, 5, 5, 9800, 2400, 5, 5, 4900, 1500, 5, 5, 5, 4100]
};

/** The short names that fit under a bar. */
const SHORT: Partial<Record<ProvinceId, string>> = {
  'AR-C': 'CABA',
  'AR-B': 'Buenos Aires',
  'AR-G': 'Santiago del Estero',
  'AR-V': 'Tierra del Fuego'
};

export interface ProvinceRow {
  id: ProvinceId;
  name: string;
  /** the name for the bars and the ranking */
  short: string;
  value: number;
}

/** The provinces ranked from the highest value of the sector. */
export function rankedProvinces(values: ReadonlyArray<number>): ProvinceRow[] {
  return PROVINCES.map((p, i) => ({ id: p.id, name: p.name, short: SHORT[p.id] ?? p.name, value: values[i] ?? 0 })).sort(
    (a, b) => b.value - a.value || a.short.localeCompare(b.short, 'es')
  );
}

/** The values of the province map from a list in the order of `PROVINCES`, ranked from the highest. */
export function mapValuesOf(values: ReadonlyArray<number> = PROVINCE_VALUES): MapValues {
  const ranked = rankedProvinces(values);
  const byId: MapValues['values'] = {};
  ranked.forEach((r, i) => {
    byId[r.id] = { plotted: r.value, p10: r.value, p50: r.value, p90: r.value, rank: i + 1 };
  });
  const all = ranked.map((r) => r.value);
  return { values: byId, missing: [], domain: [Math.min(...all), Math.max(...all)], excluded: 0 };
}
