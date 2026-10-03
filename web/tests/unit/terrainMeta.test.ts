import { describe, it, expect } from 'vitest';
import { parseTerrainMeta } from '../../src/terrain/meta.js';
import { makeMeta } from './terrainFixtures.js';

type Doc = Record<string, unknown>;

describe('parseTerrainMeta', () => {
  it('accepts valid metadata, with null or filled source_url and license', () => {
    expect(parseTerrainMeta(makeMeta())).toEqual(makeMeta());
    const filled = makeMeta({ source_url: null, license_or_terms: 'CC' });
    expect(parseTerrainMeta(filled).license_or_terms).toBe('CC');
  });

  const bad: Array<[string, (m: Doc) => void, string]> = [
    ['wrong encoding', (m) => { m.encoding = 'mapbox'; }, '/encoding'],
    ['wrong crs', (m) => { m.crs = 'EPSG:3857'; }, '/crs'],
    ['bbox of length 3', (m) => { m.bbox = [0, 0, 3]; }, '/bbox'],
    ['missing attribution', (m) => { delete m.attribution; }, 'attribution'],
    ['empty attribution', (m) => { m.attribution = ''; }, '/attribution'],
    ['extra field', (m) => { m.extra = 1; }, 'extra'],
    ['extra field in hillshade', (m) => { (m.hillshade as Doc).extra = 1; }, 'extra'],
    ['filled_fraction above 1', (m) => { m.filled_fraction = 1.5; }, '/filled_fraction'],
    ['non-positive pixel size', (m) => { (m.pixel_size_deg as Doc).x = 0; }, '/pixel_size_deg/x'],
    ['bad date', (m) => { m.retrieved_at = '2026-13-45'; }, '/retrieved_at'],
    ['bad sha256', (m) => { (m.dem_inputs as Doc[])[0]!.sha256 = 'xyz'; }, 'sha256'],
    ['wrong generated_by', (m) => { m.generated_by = 'other'; }, '/generated_by']
  ];

  it.each(bad)('rejects %s', (_name, mutate, fragment) => {
    const doc: Doc = structuredClone({ ...makeMeta() });
    mutate(doc);
    expect(() => parseTerrainMeta(doc)).toThrow(fragment);
  });

  it('rejects non-objects', () => {
    expect(() => parseTerrainMeta(null)).toThrow('Terrain metadata validation failed');
    expect(() => parseTerrainMeta([])).toThrow('Terrain metadata validation failed');
  });
});
