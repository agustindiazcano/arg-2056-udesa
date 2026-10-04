import type { ProvincesGeo } from '../../geo/provinces.js';
import type { ResourceProductionRecord } from '../../types/index.js';
import type { MapValues } from '../forecast/mapSelectors.js';

/**
 * The values of the province map for observed production: the value of each province for the resource and year,
 * ranked from the highest. There is no range (p10 = p50 = p90 = the value). The national total (`AR`), other
 * resources and null values are never a province value; a province without one is listed as missing, never zero.
 * The color domain covers every year of the resource, so the colors do not jump while the year moves.
 */
export function resourceMapValues(
  records: ResourceProductionRecord[],
  geo: ProvincesGeo,
  q: { resource: string; year: number }
): MapValues {
  const ids = geo.features.map((f) => f.properties.id as string);
  const known = new Set(ids);
  const ofResource = records.filter(
    (r) => r.resource === q.resource && r.geo !== 'AR' && known.has(r.geo) && r.value !== null
  );

  const ofYear = ofResource
    .filter((r) => r.year === q.year)
    .map((r) => ({ id: r.geo, value: r.value as number }))
    .sort((a, b) => b.value - a.value || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const values: MapValues['values'] = {};
  ofYear.forEach((item, i) => {
    values[item.id] = { plotted: item.value, p10: item.value, p50: item.value, p90: item.value, rank: i + 1 };
  });

  const missing = ids.filter((id) => values[id] === undefined);
  const all = ofResource.map((r) => r.value as number);
  return {
    values,
    missing,
    domain: all.length === 0 ? null : [Math.min(...all), Math.max(...all)],
    excluded: missing.length
  };
}
