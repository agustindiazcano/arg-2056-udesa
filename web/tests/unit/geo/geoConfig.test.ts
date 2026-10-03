import { describe, it, expect } from 'vitest';
import { validateConfig } from '../../../scripts/geo/lib.js';
import { baseConfig, idMap } from './geoFixtures.js';

describe('validateConfig', () => {
  it('accepts a valid config', () => {
    const cfg = validateConfig(baseConfig());
    expect(cfg.dataset_id).toBe('geo_example');
    expect(cfg.input_file).toBe('input.geojson');
    expect(cfg.id_property).toBe('code');
    expect(Object.keys(cfg.id_map)).toHaveLength(24);
    expect(cfg.target_max_bytes).toBe(100000);
    expect(cfg.max_area_change_pct).toBe(2);
    expect(cfg.min_island_area_km2).toBe(0);
    expect(cfg.coordinate_decimals).toBe(3);
    expect(cfg.sanity_bounds).toEqual({ lon: [-80, -50], lat: [-60, -20] });
  });

  it('applies the documented defaults', () => {
    const raw = baseConfig();
    delete raw.max_area_change_pct;
    delete raw.min_island_area_km2;
    delete raw.coordinate_decimals;
    const cfg = validateConfig(raw);
    expect(cfg.max_area_change_pct).toBe(2);
    expect(cfg.min_island_area_km2).toBe(0);
    expect(cfg.coordinate_decimals).toBe(3);
  });

  it('accepts a max_area_change_pct of 0', () => {
    expect(validateConfig(baseConfig({ max_area_change_pct: 0 })).max_area_change_pct).toBe(0);
  });

  const withoutLast = () => {
    const map = idMap();
    delete map.P24;
    return map;
  };
  const withExtra = () => ({ ...idMap(), P25: 'AR-ZZ' });
  const withDuplicate = () => ({ ...idMap(), P24: 'AR-A' });

  const bad: Array<[string, unknown, string]> = [
    ['id_map missing a province id', baseConfig({ id_map: withoutLast() }), 'id_map is missing province id AR-Z'],
    ['id_map with an extra id', baseConfig({ id_map: withExtra() }), 'id_map has unknown province id AR-ZZ'],
    ['id_map with a duplicate target id', baseConfig({ id_map: withDuplicate() }), 'id_map has duplicate target id AR-A'],
    ['id_map that is not an object', baseConfig({ id_map: [] }), 'id_map must be an object'],
    ['unknown field', baseConfig({ extra: 1 }), 'unknown field extra'],
    ['missing field', (() => { const c = baseConfig(); delete c.dataset_id; return c; })(), 'missing field dataset_id'],
    ['wrong type for target_max_bytes', baseConfig({ target_max_bytes: '100' }), 'target_max_bytes must be a positive integer'],
    ['zero target_max_bytes', baseConfig({ target_max_bytes: 0 }), 'target_max_bytes must be a positive integer'],
    ['negative max_area_change_pct', baseConfig({ max_area_change_pct: -1 }), 'max_area_change_pct must be a non-negative number'],
    ['negative min_island_area_km2', baseConfig({ min_island_area_km2: -1 }), 'min_island_area_km2 must be a non-negative number'],
    ['fractional coordinate_decimals', baseConfig({ coordinate_decimals: 1.5 }), 'coordinate_decimals must be an integer between 0 and 8'],
    ['coordinate_decimals above 8', baseConfig({ coordinate_decimals: 9 }), 'coordinate_decimals must be an integer between 0 and 8'],
    ['empty dataset_id', baseConfig({ dataset_id: '' }), 'dataset_id must be a non-empty string'],
    ['input_file with a parent directory', baseConfig({ input_file: '../x.geojson' }), 'input_file must be a relative path inside the dataset'],
    ['sanity_bounds with min above max', baseConfig({ sanity_bounds: { lon: [10, 5], lat: [-60, -20] } }), 'sanity_bounds.lon must be [min, max] with min < max'],
    ['sanity_bounds with unknown key', baseConfig({ sanity_bounds: { lon: [-80, -50], lat: [-60, -20], z: [0, 1] } }), 'unknown field z in sanity_bounds'],
    ['non-object config', 'nope', 'config must be an object']
  ];

  it.each(bad)('rejects %s', (_name, raw, fragment) => {
    expect(() => validateConfig(raw)).toThrow(fragment);
  });
});
