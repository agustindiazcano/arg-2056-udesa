import { describe, expect, it } from 'vitest';
import {
  BEAM_OPACITY,
  INTRO_MS,
  SWEEP_MS,
  TITLE_RISE,
  projectionFrame,
  projectionPose,
  sweepHeight,
  sweepOpacity
} from '../../src/charts3d/projection';
import { demoBarsSpec, demoLabel, demoMapValues, demoValue } from '../../src/charts3d/projectionDemo';
import type { ProvinceFeature, ProvincesGeo } from '../../src/geo/provinces';
import { PROVINCES } from '../../src/types/province';

describe('projectionPose', () => {
  const pose = projectionPose({ width: 10, depth: 4, height: 4 });

  it('makes the scan plane wider than the chart by a margin on every side', () => {
    expect(pose.planeWidth).toBeCloseTo(11.2, 10);
    expect(pose.planeDepth).toBeCloseTo(5.2, 10);
  });

  it('puts the title above the chart and the beam from the title down to the base', () => {
    expect(pose.titleY).toBeCloseTo(5.2, 10);
    expect(pose.beamHeight).toBeCloseTo(5.2, 10);
  });

  it('opens the beam to half the diagonal of the plane', () => {
    expect(pose.beamRadius).toBeCloseTo(Math.hypot(11.2, 5.2) / 2, 10);
  });
});

describe('sweepHeight', () => {
  it('goes up to the top of the chart and back down in one cycle', () => {
    expect([0, 0.25, 0.5, 0.75, 1].map((p) => sweepHeight(p, 4))).toEqual([0, 2, 4, 2, 0]);
  });
});

describe('sweepOpacity', () => {
  it('is faint at the ends of the cycle and strongest at the top', () => {
    expect(sweepOpacity(0)).toBeCloseTo(0.1, 10);
    expect(sweepOpacity(0.5)).toBeCloseTo(0.4, 10);
    expect(sweepOpacity(1)).toBeCloseTo(0.1, 10);
  });
});

describe('projectionFrame', () => {
  it('starts with the title hidden and below its place, and nothing else visible', () => {
    expect(projectionFrame(0, 4, false)).toEqual({
      planeY: 0,
      planeOpacity: 0,
      titleOpacity: 0,
      titleRise: TITLE_RISE,
      beamOpacity: 0
    });
  });

  it('has the title in place and fully visible when the intro ends', () => {
    const frame = projectionFrame(INTRO_MS, 4, false);
    expect(frame.titleOpacity).toBe(1);
    expect(frame.titleRise).toBe(0);
  });

  it('moves the scan plane with the phase of the cycle after the intro', () => {
    const frame = projectionFrame(800, 4, false);
    expect(frame.planeY).toBeCloseTo(2, 10);
    expect(frame.planeOpacity).toBeCloseTo(0.1 + 0.3 * Math.sin(Math.PI / 4), 10);
    expect(frame.titleOpacity).toBe(1);
  });

  it('repeats every cycle: the top of the chart at the middle of each one', () => {
    expect(projectionFrame(SWEEP_MS + SWEEP_MS / 2, 4, false).planeY).toBeCloseTo(4, 10);
    expect(projectionFrame(SWEEP_MS / 2, 4, false).planeY).toBeCloseTo(4, 10);
  });

  it('breathes the beam around its opacity', () => {
    expect(projectionFrame(SWEEP_MS / 4, 4, false).beamOpacity).toBeCloseTo(BEAM_OPACITY, 10);
    expect(projectionFrame(SWEEP_MS, 4, false).beamOpacity).toBeCloseTo(BEAM_OPACITY * 0.85, 10);
  });

  it('under reduced motion shows the title and the beam still, with no scan plane, at any time', () => {
    const still = { planeY: 0, planeOpacity: 0, titleOpacity: 1, titleRise: 0, beamOpacity: BEAM_OPACITY };
    expect(projectionFrame(0, 4, true)).toEqual(still);
    expect(projectionFrame(1234, 4, true)).toEqual(still);
  });
});

const feature = (id: ProvinceFeature['properties']['id'], name: string): ProvinceFeature => ({
  type: 'Feature',
  properties: { id, name, area_km2: 1, centroid: [0, 0], centroid_inside: true, bbox: [0, 0, 1, 1] },
  geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] }
});

describe('demoValue', () => {
  it('is a fixed function of the id: 10 plus the weighted character sum modulo 91', () => {
    expect(demoValue('AR-A')).toBe(88);
    expect(demoValue('AR-B')).toBe(92);
    expect(demoValue('AR-Y')).toBe(93);
  });

  it('stays between 10 and 100 for every province', () => {
    for (const p of PROVINCES) {
      expect(demoValue(p.id)).toBeGreaterThanOrEqual(10);
      expect(demoValue(p.id)).toBeLessThanOrEqual(100);
    }
  });
});

describe('demoMapValues', () => {
  const geo: ProvincesGeo = {
    type: 'FeatureCollection',
    features: [feature('AR-A', 'Salta'), feature('AR-B', 'Buenos Aires'), feature('AR-Y', 'Jujuy')]
  };
  const values = demoMapValues(geo);

  it('gives every province of the geometry a value, ranked from the highest', () => {
    expect(values.values['AR-Y']).toEqual({ plotted: 93, p10: 93, p50: 93, p90: 93, rank: 1 });
    expect(values.values['AR-B']?.rank).toBe(2);
    expect(values.values['AR-A']?.rank).toBe(3);
  });

  it('has the color domain from the lowest to the highest value and no missing provinces', () => {
    expect(values.domain).toEqual([88, 93]);
    expect(values.missing).toEqual([]);
    expect(values.excluded).toBe(0);
  });
});

describe('demoLabel', () => {
  it('shortens the names that are too long for a label', () => {
    expect(demoLabel('AR-V', 'Tierra del Fuego, Antártida e Islas del Atlántico Sur')).toBe('Tierra del Fuego');
    expect(demoLabel('AR-C', 'Ciudad Autónoma de Buenos Aires')).toBe('CABA');
    expect(demoLabel('AR-Y', 'Jujuy')).toBe('Jujuy');
  });
});

describe('demoBarsSpec', () => {
  const geo: ProvincesGeo = {
    type: 'FeatureCollection',
    features: [feature('AR-A', 'Salta'), feature('AR-B', 'Buenos Aires'), feature('AR-Y', 'Jujuy')]
  };
  const spec = demoBarsSpec(demoMapValues(geo), { 'AR-A': 'Salta', 'AR-B': 'Buenos Aires', 'AR-Y': 'Jujuy' }, 2);

  it('takes the highest provinces in order and highlights the first', () => {
    expect(spec.kind).toBe('bars');
    expect(spec.bars.map((b) => [b.label, b.value, b.highlight])).toEqual([
      ['Jujuy', 93, true],
      ['Buenos Aires', 92, false]
    ]);
  });

  it('says in its title that the data is a test', () => {
    expect(spec.title).toBe('Provincias con mayor valor (datos de prueba)');
  });
});
