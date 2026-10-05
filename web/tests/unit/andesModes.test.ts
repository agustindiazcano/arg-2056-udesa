import { describe, expect, it } from 'vitest';
import { CAMERA_MODES, isRigMode, rigFor } from '../../src/scenes/andes/camera';

describe('camera modes', () => {
  it('has the free camera, following, cinematic, aerial and map', () => {
    expect([...CAMERA_MODES].sort()).toEqual(['aerial', 'cine', 'follow', 'free', 'map']);
  });

  it('writes the camera at every tick of the clock only in the cinematic and the aerial mode', () => {
    expect(CAMERA_MODES.filter(isRigMode).sort()).toEqual(['aerial', 'cine']);
  });

  it('has a rig for those two and none for the others', () => {
    expect(rigFor('cine')).not.toBeNull();
    expect(rigFor('aerial')).not.toBeNull();
    for (const mode of ['free', 'follow', 'map'] as const) expect(rigFor(mode)).toBeNull();
  });

  it('has the cinematic camera low behind the whole column', () => {
    const rig = rigFor('cine')!;
    expect(rig.height).toBeLessThan(0.5);
    expect(rig.behindColumn).toBe(true);
  });

  it('has the aerial camera high above the army, looking steeply down (within the distance where the figures show)', () => {
    const rig = rigFor('aerial')!;
    expect(rig.height).toBeGreaterThanOrEqual(4);
    expect(rig.height).toBeGreaterThan(rig.back * 3);
    expect(Math.hypot(rig.height, rig.back)).toBeLessThan(8); // FIGURE_NEAR: farther than that the figures give way to the marker
    expect(rig.behindColumn).toBe(false);
  });
});
