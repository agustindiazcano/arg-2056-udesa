import type { MapValue, MapValues } from '../scenes/forecast/mapSelectors';
import type { ProvincesGeo } from '../geo/provinces';
import { barsSpec } from './specs';
import type { Bars3DSpec } from './types';

/**
 * A made-up value for a province, always the same for the same id: 10 plus the sum of each character code times its
 * 1-based position, modulo 91. It is test data to look at the 3D effects, not a figure of the model.
 */
export function demoValue(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i) * (i + 1);
  return 10 + (sum % 91);
}

/** A value for every province of the geometry, ranked from the highest; the color domain runs from lowest to highest. */
export function demoMapValues(geo: ProvincesGeo): MapValues {
  const ids = geo.features.map((f) => f.properties.id);
  const ranked = [...ids].sort((a, b) => demoValue(b) - demoValue(a) || a.localeCompare(b));
  const values: Record<string, MapValue> = {};
  ranked.forEach((id, index) => {
    const v = demoValue(id);
    values[id] = { plotted: v, p10: v, p50: v, p90: v, rank: index + 1 };
  });
  const plotted = ids.map(demoValue);
  return {
    values,
    missing: [],
    domain: plotted.length > 0 ? [Math.min(...plotted), Math.max(...plotted)] : null,
    excluded: 0
  };
}

/** A short name for a bar label: the text before the first comma, and CABA for the city. */
export function demoLabel(id: string, name: string): string {
  if (id === 'AR-C') return 'CABA';
  return (name.split(',')[0] ?? name).trim();
}

/** A 3D bar chart of the `count` highest provinces, the first highlighted. */
export function demoBarsSpec(values: MapValues, names: Record<string, string>, count: number): Bars3DSpec {
  const rows = Object.entries(values.values)
    .sort(([, a], [, b]) => a.rank - b.rank)
    .slice(0, count)
    .map(([id, v]) => ({ label: demoLabel(id, names[id] ?? id), value: v.plotted }));
  return barsSpec(rows, {
    title: 'Provincias con mayor valor (datos de prueba)',
    unit: 'pts',
    highlight: rows[0]?.label ?? null
  });
}
