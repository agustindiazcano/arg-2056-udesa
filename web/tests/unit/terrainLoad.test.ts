import { describe, it, expect, vi } from 'vitest';
import { loadTerrain, terrainVersion } from '../../src/terrain/load.js';
import { makeMeta, PLANE, planeRgba } from './terrainFixtures.js';

interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  blob: () => Promise<Blob>;
}

function response(ok: boolean, status: number, body: unknown = {}): FakeResponse {
  return { ok, status, json: async () => body, blob: async () => new Blob(['png']) };
}

function deps(routes: Record<string, FakeResponse | Error>, image = { rgba: planeRgba(), width: 3, height: 3 }) {
  const fetch = vi.fn(async (url: string) => {
    const route = routes[url];
    if (route === undefined) throw new Error(`unexpected url ${url}`);
    if (route instanceof Error) throw route;
    return route;
  });
  const decodeImage = vi.fn(async (_blob: Blob) => image);
  return { fetch, decodeImage };
}

const routes = (): Record<string, FakeResponse | Error> => ({
  'terrain/region_a.json': response(true, 200, makeMeta()),
  'terrain/region_a.height.png?v=aaaaaaaaaaaa': response(true, 200)
});

describe('loadTerrain', () => {
  it('loads the metadata and decodes the height image', async () => {
    const d = deps(routes());
    const terrain = await loadTerrain('terrain', 'region_a', d);
    expect(terrain.meta).toEqual(makeMeta());
    expect(Array.from(terrain.heights)).toEqual(PLANE);
    expect(d.fetch.mock.calls.map((c) => c[0])).toEqual(['terrain/region_a.json', 'terrain/region_a.height.png?v=aaaaaaaaaaaa']);
    expect(d.decodeImage).toHaveBeenCalledTimes(1);
  });

  it('tolerates a trailing slash in the base url', async () => {
    const d = deps(routes());
    await loadTerrain('terrain/', 'region_a', d);
    expect(d.fetch.mock.calls.map((c) => c[0])).toEqual(['terrain/region_a.json', 'terrain/region_a.height.png?v=aaaaaaaaaaaa']);
  });

  it('fails when the image size differs from the metadata', async () => {
    const d = deps(routes(), { rgba: new Uint8ClampedArray(2 * 3 * 4), width: 2, height: 3 });
    await expect(loadTerrain('terrain', 'region_a', d)).rejects.toThrow(
      'Terrain image region_a is 2x3 but its metadata says 3x3'
    );
  });

  it('fails with a descriptive error when the metadata is invalid', async () => {
    const d = deps({ ...routes(), 'terrain/region_a.json': response(true, 200, { id: 'region_a' }) });
    await expect(loadTerrain('terrain', 'region_a', d)).rejects.toThrow('Invalid terrain metadata for region_a');
    expect(d.decodeImage).not.toHaveBeenCalled();
  });

  it('fails when the metadata request returns an error status', async () => {
    const d = deps({ ...routes(), 'terrain/region_a.json': response(false, 404) });
    await expect(loadTerrain('terrain', 'region_a', d)).rejects.toThrow(
      'Failed to fetch terrain/region_a.json: HTTP 404'
    );
  });

  it('fails when the image request returns an error status', async () => {
    const d = deps({ ...routes(), 'terrain/region_a.height.png?v=aaaaaaaaaaaa': response(false, 500) });
    await expect(loadTerrain('terrain', 'region_a', d)).rejects.toThrow(
      'Failed to fetch terrain/region_a.height.png?v=aaaaaaaaaaaa: HTTP 500'
    );
  });

  it('fails when the network fails', async () => {
    const d = deps({ ...routes(), 'terrain/region_a.json': new Error('network down') });
    await expect(loadTerrain('terrain', 'region_a', d)).rejects.toThrow(
      'Failed to fetch terrain/region_a.json: network down'
    );
  });

  it('fails when the image cannot be decoded', async () => {
    const d = deps(routes());
    d.decodeImage.mockRejectedValueOnce(new Error('bad png'));
    await expect(loadTerrain('terrain', 'region_a', d)).rejects.toThrow(
      'Failed to decode terrain image region_a: bad png'
    );
  });
});

describe('terrainVersion', () => {
  it('is the first 12 hex characters of the only DEM input hash', () => {
    expect(terrainVersion(makeMeta())).toBe('aaaaaaaaaaaa');
    expect(terrainVersion(makeMeta({ dem_inputs: [{ path: 'a.tif', sha256: '0123456789abcdef'.repeat(4) }] }))).toBe('0123456789ab');
  });

  it('mixes every input, so changing any one of them changes the version', () => {
    const a = { path: 'a.tif', sha256: '1'.repeat(64) };
    const b = { path: 'b.tif', sha256: '2'.repeat(64) };
    const b2 = { path: 'b.tif', sha256: '3'.repeat(64) };
    expect(terrainVersion(makeMeta({ dem_inputs: [a, b] }))).toBe('333333333333');
    expect(terrainVersion(makeMeta({ dem_inputs: [a, b2] }))).toBe('444444444444');
    expect(terrainVersion(makeMeta({ dem_inputs: [b, a] }))).toBe('333333333333');
  });

  it('has no version when there are no inputs', () => {
    expect(terrainVersion(makeMeta({ dem_inputs: [] }))).toBeNull();
  });

  it('asks for the height image without a query when there is no version', async () => {
    const d = deps({
      'terrain/region_a.json': response(true, 200, makeMeta({ dem_inputs: [] })),
      'terrain/region_a.height.png': response(true, 200)
    });
    await loadTerrain('terrain', 'region_a', d);
    expect(d.fetch.mock.calls.map((c) => c[0])).toEqual(['terrain/region_a.json', 'terrain/region_a.height.png']);
  });
});
