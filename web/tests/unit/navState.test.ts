import { describe, expect, it } from 'vitest';
import { BUTTON_FACTOR, ZOOM_MAX, ZOOM_MIN, clampCenter, clampZoom, geoBbox, zoomFactorFor } from '../../src/charts/navState';

describe('clampZoom', () => {
  it('keeps the zoom between 1 and 8 times', () => {
    expect(ZOOM_MIN).toBe(1);
    expect(ZOOM_MAX).toBe(8);
    expect(clampZoom(0.5)).toBe(1);
    expect(clampZoom(3)).toBe(3);
    expect(clampZoom(20)).toBe(8);
  });
});

describe('zoomFactorFor', () => {
  it('is the factor asked for while the result stays in range', () => {
    expect(zoomFactorFor(2, BUTTON_FACTOR)).toBeCloseTo(BUTTON_FACTOR, 10);
    expect(zoomFactorFor(2, 1 / BUTTON_FACTOR)).toBeCloseTo(1 / BUTTON_FACTOR, 10);
  });

  it('is cut so that the zoom stops at 8 and at 1', () => {
    expect(zoomFactorFor(7, 2)).toBeCloseTo(8 / 7, 10);
    expect(zoomFactorFor(1.2, 0.5)).toBeCloseTo(1 / 1.2, 10);
    expect(zoomFactorFor(8, 1.25)).toBe(1);
    expect(zoomFactorFor(1, 0.8)).toBe(1);
  });
});

describe('geoBbox', () => {
  it('is the union of the boxes of the provinces', () => {
    const geo = {
      features: [{ properties: { bbox: [-70, -40, -60, -30] } }, { properties: { bbox: [-65, -50, -55, -35] } }]
    };
    expect(geoBbox(geo as never)).toEqual([-70, -50, -55, -30]);
  });
});

describe('clampCenter', () => {
  const bbox: [number, number, number, number] = [-70, -50, -50, -30]; // 20 by 20, middle (-60, -40)

  it('cannot move at zoom 1: the whole territory is in the frame', () => {
    expect(clampCenter([-55, -35], 1, bbox)).toEqual([-60, -40]);
  });

  it('lets the centre move by half the box times (1 - 1/zoom)', () => {
    // zoom 2: the window is half the box, so the centre may be 5 degrees from the middle
    expect(clampCenter([-100, -100], 2, bbox)).toEqual([-65, -45]);
    expect(clampCenter([100, 100], 2, bbox)).toEqual([-55, -35]);
    expect(clampCenter([-62, -41], 2, bbox)).toEqual([-62, -41]);
  });
});
