import { describe, expect, it } from 'vitest';
import { battlePose, overviewPose } from '../../src/scenes/andes/camera';
import { sceneScale, toScene } from '../../src/scenes/andes/terrainMesh';
import { syntheticTerrain } from '../../src/terrain/synthetic';
import { sampleElevation } from '../../src/terrain/decode';

const terrain = syntheticTerrain([-71, -34, -69, -32], 40, 40);
const scale = sceneScale(terrain, { longSide: 20, exaggeration: 4 });

describe('overviewPose', () => {
  it('looks at the middle of the terrain from a distance that shows all of it', () => {
    const p = overviewPose(scale);
    expect(p.x).toBe(0);
    expect(p.z).toBe(0);
    expect(p.radius).toBeGreaterThan(scale.depth);
    expect(p.phi).toBeGreaterThan(0.3);
    expect(p.phi).toBeLessThan(1.4);
  });
});

describe('battlePose', () => {
  const event = { lon: -69.6, lat: -32.5558, elevation_m: 3100 };

  it('looks at the event on the terrain (not in the air or under it), closer than the overview', () => {
    const p = battlePose(scale, terrain, event);
    const ground = sampleElevation(terrain, -69.6, -32.5558)!;
    const at = toScene(scale, -69.6, -32.5558, ground);
    expect([p.x, p.y, p.z]).toEqual([at.x, at.y, at.z]);
    expect(p.radius).toBeLessThan(overviewPose(scale).radius);
  });

  it('uses the altitude of the event when the point is outside the terrain', () => {
    const p = battlePose(scale, terrain, { lon: 10, lat: 10, elevation_m: 3100 });
    expect(p.y).toBeCloseTo(toScene(scale, 10, 10, 3100).y, 6);
  });

  it('falls back to the lowest point of the terrain, never 0, with no altitude anywhere', () => {
    const p = battlePose(scale, terrain, { lon: 10, lat: 10, elevation_m: null });
    expect(p.y).toBeCloseTo(toScene(scale, 10, 10, terrain.meta.elevation_min_m).y, 6);
    expect(p.y).toBeGreaterThan(0);
  });
});
