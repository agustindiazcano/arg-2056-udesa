import { describe, it, expect, vi } from 'vitest';
import { loadTerrain } from '../../src/terrain/load.js';
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
  'terrain/region_a.height.png': response(true, 200)
});

describe('loadTerrain', () => {
  it('loads the metadata and decodes the height image', async () => {
    const d = deps(routes());
    const terrain = await loadTerrain('terrain', 'region_a', d);
    expect(terrain.meta).toEqual(makeMeta());
    expect(Array.from(terrain.heights)).toEqual(PLANE);
    expect(d.fetch.mock.calls.map((c) => c[0])).toEqual(['terrain/region_a.json', 'terrain/region_a.height.png']);
    expect(d.decodeImage).toHaveBeenCalledTimes(1);
  });

  it('tolerates a trailing slash in the base url', async () => {
    const d = deps(routes());
    await loadTerrain('terrain/', 'region_a', d);
    expect(d.fetch.mock.calls.map((c) => c[0])).toEqual(['terrain/region_a.json', 'terrain/region_a.height.png']);
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
    const d = deps({ ...routes(), 'terrain/region_a.height.png': response(false, 500) });
    await expect(loadTerrain('terrain', 'region_a', d)).rejects.toThrow(
      'Failed to fetch terrain/region_a.height.png: HTTP 500'
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
