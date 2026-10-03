import { describe, it, expect } from 'vitest';
import {
  decodeTerrarium,
  sampleElevation,
  lonLatToPixel,
  pixelToLonLat,
  elevationRange
} from '../../src/terrain/decode.js';
import { makeMeta, planeRgba } from './terrainFixtures.js';

const terrain = () => ({ meta: makeMeta(), heights: decodeTerrarium(planeRgba(), 3, 3) });

describe('decodeTerrarium', () => {
  it('decodes hand-built RGBA to exact heights', () => {
    // R*256 + G + B/256 - 32768 for: 0 m, -100 m, 0.5 m, 6962 m
    const rgba = new Uint8ClampedArray([128, 0, 0, 255, 127, 156, 0, 255, 128, 0, 128, 255, 155, 50, 0, 255]);
    const heights = decodeTerrarium(rgba, 4, 1);
    expect(heights).toBeInstanceOf(Float32Array);
    expect(Array.from(heights)).toEqual([0, -100, 0.5, 6962]);
  });

  it('decodes the extremes of the range', () => {
    const rgba = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 0, 255]);
    expect(Array.from(decodeTerrarium(rgba, 2, 1))).toEqual([-32768, 32767]);
  });

  it('ignores alpha and rejects a buffer of the wrong size', () => {
    expect(Array.from(decodeTerrarium(new Uint8ClampedArray([128, 5, 0, 0]), 1, 1))).toEqual([5]);
    expect(() => decodeTerrarium(new Uint8ClampedArray(7), 1, 1)).toThrow('RGBA buffer has 7 values, expected 4');
  });
});

describe('sampleElevation', () => {
  it('returns exact heights at pixel centers', () => {
    const t = terrain();
    expect(sampleElevation(t, 0.5, 2.5)).toBe(0);
    expect(sampleElevation(t, 1.5, 1.5)).toBe(110);
    expect(sampleElevation(t, 2.5, 0.5)).toBe(220);
  });

  it('interpolates bilinearly at midpoints and quarter points', () => {
    const t = terrain();
    expect(sampleElevation(t, 1.0, 2.5)).toBe(5); // halfway between 0 and 10
    expect(sampleElevation(t, 0.5, 2.0)).toBe(50); // halfway between 0 and 100
    expect(sampleElevation(t, 1.0, 2.0)).toBe(55); // mean of 0, 10, 100, 110
    expect(sampleElevation(t, 0.75, 2.5)).toBe(2.5); // a quarter of the way from 0 to 10
    expect(sampleElevation(t, 2.25, 0.75)).toBe(192.5); // x = 1.75, y = 1.75 on the plane 10x + 100y
  });

  it('returns null outside the bbox, never 0', () => {
    const t = terrain();
    expect(sampleElevation(t, -0.1, 1.5)).toBeNull();
    expect(sampleElevation(t, 3.1, 1.5)).toBeNull();
    expect(sampleElevation(t, 1.5, -0.1)).toBeNull();
    expect(sampleElevation(t, 1.5, 3.1)).toBeNull();
  });

  it('returns null on the outer edge, beyond the last pixel center', () => {
    const t = terrain();
    expect(sampleElevation(t, 3, 1.5)).toBeNull(); // east edge
    expect(sampleElevation(t, 0, 1.5)).toBeNull(); // west edge
    expect(sampleElevation(t, 1.5, 3)).toBeNull(); // north edge
    expect(sampleElevation(t, 1.5, 0)).toBeNull(); // south edge
    expect(sampleElevation(t, 2.6, 1.5)).toBeNull(); // inside the half-pixel border
    expect(sampleElevation(t, 2.5, 1.5)).toBe(120); // exactly the last pixel center is inside
  });
});

describe('lonLatToPixel and pixelToLonLat', () => {
  const meta = makeMeta();
  it('use the pixel-center convention', () => {
    expect(lonLatToPixel(meta, 0.5, 2.5)).toEqual({ x: 0, y: 0 });
    expect(lonLatToPixel(meta, 1.0, 2.0)).toEqual({ x: 0.5, y: 0.5 });
    expect(lonLatToPixel(meta, 3, 0)).toEqual({ x: 2.5, y: 2.5 });
    expect(pixelToLonLat(meta, 0, 0)).toEqual({ lon: 0.5, lat: 2.5 });
    expect(pixelToLonLat(meta, 2, 2)).toEqual({ lon: 2.5, lat: 0.5 });
  });

  it('round trip', () => {
    const m = makeMeta({ bbox: [-70, -34, -69, -33], pixel_size_deg: { x: 1 / 3, y: 1 / 3 } });
    for (const [x, y] of [[0, 0], [1.25, 2.5], [2, 1]] as const) {
      const { lon, lat } = pixelToLonLat(m, x, y);
      const back = lonLatToPixel(m, lon, lat);
      expect(back.x).toBeCloseTo(x, 10);
      expect(back.y).toBeCloseTo(y, 10);
    }
  });
});

describe('elevationRange', () => {
  it('returns the min and max of the heights', () => {
    expect(elevationRange(terrain())).toEqual({ min: 0, max: 220 });
  });
  it('handles negative heights', () => {
    const t = { meta: makeMeta({ width: 2, height: 1 }), heights: new Float32Array([-5.5, 3]) };
    expect(elevationRange(t)).toEqual({ min: -5.5, max: 3 });
  });
});
