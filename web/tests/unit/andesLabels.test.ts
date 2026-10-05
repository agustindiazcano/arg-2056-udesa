import { describe, expect, it } from 'vitest';
import { LABEL_FAR, LABEL_NEAR, labelOpacity, toScreen } from '../../src/scenes/andes/labels';

describe('labelOpacity', () => {
  it('is fully visible up to the near distance and gone from the far one', () => {
    expect(labelOpacity(LABEL_NEAR * 0.5)).toBe(1);
    expect(labelOpacity(LABEL_NEAR)).toBe(1);
    expect(labelOpacity(LABEL_FAR)).toBe(0);
    expect(labelOpacity(LABEL_FAR * 3)).toBe(0);
  });

  it('fades smoothly in between, never going up with distance', () => {
    expect(LABEL_FAR).toBeGreaterThan(LABEL_NEAR);
    let last = 1;
    for (let d = LABEL_NEAR; d <= LABEL_FAR; d += (LABEL_FAR - LABEL_NEAR) / 20) {
      const o = labelOpacity(d);
      expect(o).toBeLessThanOrEqual(last + 1e-12);
      last = o;
    }
    const mid = labelOpacity((LABEL_NEAR + LABEL_FAR) / 2);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it('shows every place from the overview distance of the scene (about 25 units)', () => {
    expect(labelOpacity(25)).toBeGreaterThan(0.2);
  });
});

describe('toScreen', () => {
  it('maps the middle of the view to the middle of the screen and the corners to the corners', () => {
    expect(toScreen({ x: 0, y: 0, z: 0.5 }, 800, 400)).toEqual({ x: 400, y: 200, visible: true });
    expect(toScreen({ x: -1, y: 1, z: 0.5 }, 800, 400)).toMatchObject({ x: 0, y: 0 });
    expect(toScreen({ x: 1, y: -1, z: 0.5 }, 800, 400)).toMatchObject({ x: 800, y: 400 });
  });

  it('hides what is behind the camera or beyond the far plane, and what is well outside the view', () => {
    expect(toScreen({ x: 0, y: 0, z: 1.2 }, 800, 400).visible).toBe(false);
    expect(toScreen({ x: 0, y: 0, z: -1.2 }, 800, 400).visible).toBe(false);
    expect(toScreen({ x: 1.5, y: 0, z: 0.5 }, 800, 400).visible).toBe(false);
    expect(toScreen({ x: 0, y: -1.5, z: 0.5 }, 800, 400).visible).toBe(false);
  });

  it('keeps a label that is just at the edge, so it does not pop in and out', () => {
    expect(toScreen({ x: 1.03, y: 0, z: 0.5 }, 800, 400).visible).toBe(true);
  });
});
