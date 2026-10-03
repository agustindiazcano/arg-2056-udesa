import { describe, it, expect, vi } from 'vitest';
import { checkProvinceIds, featureById, loadProvinces, parseProvincesGeo } from '../../../src/geo/provinces.js';
import { parseGeoMeta } from '../../../src/geo/meta.js';
import { validFeature, validGeo, validGeoMeta, type GeoDoc } from './geoWebFixtures.js';

type Doc = Record<string, unknown>;

describe('parseProvincesGeo', () => {
  it('accepts a valid 24-feature fixture', () => {
    const geo = parseProvincesGeo(validGeo());
    expect(geo.features).toHaveLength(24);
    expect(geo.features[0]!.properties.id).toBe('AR-A');
  });

  const mutate = (fn: (geo: GeoDoc) => void) => {
    const geo = structuredClone(validGeo());
    fn(geo);
    return geo;
  };

  const bad: Array<[string, unknown, string]> = [
    ['a feature without id', mutate((g) => { delete g.features[0]!.properties.id; }), 'id'],
    ['a bad id pattern', mutate((g) => { g.features[0]!.properties.id = 'AR-99'; }), '/properties/id'],
    ['a Point geometry', mutate((g) => { g.features[0]!.geometry = { type: 'Point', coordinates: [-65, -35] }; }), '/geometry'],
    ['a property out of the list', mutate((g) => { g.features[0]!.properties.population = 5; }), 'population'],
    ['an extra field in a feature', mutate((g) => { g.features[0]!.extra = 1; }), 'extra'],
    ['an extra top-level field', mutate((g) => { g.extra = 1; }), 'extra'],
    ['23 features', mutate((g) => { g.features.pop(); }), '/features'],
    ['a short ring', mutate((g) => { g.features[0]!.geometry = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [0, 0]]] }; }), '/geometry'],
    ['a position with three numbers', mutate((g) => { g.features[0]!.geometry = { type: 'Polygon', coordinates: [[[0, 0, 1], [1, 0], [1, 1], [0, 0]]] }; }), '/geometry'],
    ['a centroid of one number', mutate((g) => { g.features[0]!.properties.centroid = [1]; }), '/centroid'],
    ['a non-boolean centroid_inside', mutate((g) => { g.features[0]!.properties.centroid_inside = 'yes'; }), '/centroid_inside'],
    ['a wrong collection type', mutate((g) => { g.type = 'Feature'; }), '/type']
  ];

  it.each(bad)('rejects %s', (_name, doc, fragment) => {
    expect(() => parseProvincesGeo(doc)).toThrow('Provinces geometry validation failed');
    expect(() => parseProvincesGeo(doc)).toThrow(fragment);
  });

  it('accepts MultiPolygon geometries', () => {
    const geo = validGeo();
    geo.features[0]!.geometry = {
      type: 'MultiPolygon',
      coordinates: [[[[-70, -40], [-60, -40], [-60, -30], [-70, -40]]]]
    } as never;
    expect(parseProvincesGeo(geo).features[0]!.geometry.type).toBe('MultiPolygon');
  });
});

describe('checkProvinceIds and featureById', () => {
  it('returns no problems for the 24 ids', () => {
    expect(checkProvinceIds(parseProvincesGeo(validGeo()))).toEqual([]);
  });

  it('returns exact messages for missing, extra and duplicate ids', () => {
    const geo = parseProvincesGeo(validGeo());
    const features = [...geo.features];
    features.shift(); // AR-A missing
    features.push({ ...features[0]!, properties: { ...features[0]!.properties, id: 'AR-ZZ' as never } }); // extra
    features.push(features[1]!); // AR-C duplicated
    const problems = checkProvinceIds({ ...geo, features });
    expect(problems).toEqual(['missing province id AR-A', 'extra province id AR-ZZ', 'duplicate province id AR-C']);
  });

  it('finds a feature by id', () => {
    const geo = parseProvincesGeo(validGeo());
    expect(featureById(geo, 'AR-C')!.properties.name).toBe('Ciudad Autónoma de Buenos Aires');
    expect(featureById({ ...geo, features: [] }, 'AR-C')).toBeUndefined();
  });
});

interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}
const ok = (body: unknown): FakeResponse => ({ ok: true, status: 200, json: async () => body });

describe('loadProvinces', () => {
  const routes = (over: Record<string, FakeResponse | Error> = {}): Record<string, FakeResponse | Error> => ({
    'geo/provinces.geojson': ok(validGeo()),
    'geo/provinces.meta.json': ok(validGeoMeta()),
    ...over
  });
  const fakeFetch = (table: Record<string, FakeResponse | Error>) =>
    vi.fn(async (url: string) => {
      const route = table[url];
      if (route === undefined) throw new Error(`unexpected url ${url}`);
      if (route instanceof Error) throw route;
      return route;
    });

  it('fetches and parses both files', async () => {
    const f = fakeFetch(routes());
    const { geo, meta } = await loadProvinces('geo', f);
    expect(geo.features).toHaveLength(24);
    expect(meta.provinces_count).toBe(24);
    expect(f.mock.calls.map((c) => c[0])).toEqual(['geo/provinces.geojson', 'geo/provinces.meta.json']);
  });

  it('tolerates a trailing slash in the base url', async () => {
    const f = fakeFetch(routes());
    await loadProvinces('geo/', f);
    expect(f.mock.calls.map((c) => c[0])).toEqual(['geo/provinces.geojson', 'geo/provinces.meta.json']);
  });

  it('fails on an HTTP error', async () => {
    const f = fakeFetch(routes({ 'geo/provinces.geojson': { ok: false, status: 404, json: async () => ({}) } }));
    await expect(loadProvinces('geo', f)).rejects.toThrow('Failed to fetch geo/provinces.geojson: HTTP 404');
  });

  it('fails when the network fails', async () => {
    const f = fakeFetch(routes({ 'geo/provinces.meta.json': new Error('network down') }));
    await expect(loadProvinces('geo', f)).rejects.toThrow('Failed to fetch geo/provinces.meta.json: network down');
  });

  it('fails on invalid JSON', async () => {
    const bad: FakeResponse = {
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      }
    };
    const f = fakeFetch(routes({ 'geo/provinces.geojson': bad }));
    await expect(loadProvinces('geo', f)).rejects.toThrow('Invalid JSON in geo/provinces.geojson: Unexpected token');
  });

  it('fails when the geometry does not match the schema', async () => {
    const f = fakeFetch(routes({ 'geo/provinces.geojson': ok({ type: 'FeatureCollection', features: [] }) }));
    await expect(loadProvinces('geo', f)).rejects.toThrow('Invalid provinces geometry');
  });

  it('fails when the province ids are inconsistent', async () => {
    const geo = validGeo();
    geo.features[1] = validFeature(0); // AR-A twice, AR-B missing
    const f = fakeFetch(routes({ 'geo/provinces.geojson': ok(geo) }));
    await expect(loadProvinces('geo', f)).rejects.toThrow(
      'Province ids are inconsistent: missing province id AR-B; duplicate province id AR-A'
    );
  });

  it('fails when the metadata is invalid', async () => {
    const f = fakeFetch(routes({ 'geo/provinces.meta.json': ok({ source: 'x' }) }));
    await expect(loadProvinces('geo', f)).rejects.toThrow('Invalid geo metadata');
  });
});

describe('parseGeoMeta', () => {
  it('accepts valid metadata', () => {
    expect(parseGeoMeta(validGeoMeta()).provinces_count).toBe(24);
    expect(parseGeoMeta({ ...validGeoMeta(), source_url: null, license_or_terms: 'CC' }).license_or_terms).toBe('CC');
  });

  const bad: Array<[string, (m: Doc) => void, string]> = [
    ['provinces_count other than 24', (m) => { m.provinces_count = 23; }, '/provinces_count'],
    ['missing attribution', (m) => { delete m.attribution; }, 'attribution'],
    ['empty attribution', (m) => { m.attribution = ''; }, '/attribution'],
    ['an extra field', (m) => { m.extra = 1; }, 'extra'],
    ['a generation timestamp', (m) => { m.generated_at = '2026-01-01'; }, 'generated_at'],
    ['a bad input hash', (m) => { m.input_sha256 = 'xyz'; }, '/input_sha256'],
    ['a bad date', (m) => { m.retrieved_at = '2026-13-45'; }, '/retrieved_at'],
    ['a wrong generated_by', (m) => { m.generated_by = 'other'; }, '/generated_by'],
    ['an extra field in simplification', (m) => { (m.simplification as Doc).extra = 1; }, 'extra'],
    ['a non-numeric area change', (m) => { (m.area_change_pct as Doc)['AR-A'] = 'a lot'; }, 'area_change_pct']
  ];

  it.each(bad)('rejects %s', (_name, change, fragment) => {
    const doc = structuredClone(validGeoMeta());
    change(doc);
    expect(() => parseGeoMeta(doc)).toThrow('Geo metadata validation failed');
    expect(() => parseGeoMeta(doc)).toThrow(fragment);
  });
});
