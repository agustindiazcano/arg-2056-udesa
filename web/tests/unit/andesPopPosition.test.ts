import { describe, expect, it } from 'vitest';
import { popPosition } from '../../src/scenes/andes/popPosition';

const area = { width: 1000, height: 700 };
const margins = { top: 100, right: 20, bottom: 20, left: 20 };
const card = { width: 300, height: 200 };

describe('popPosition', () => {
  it('goes above the point, centered on it, when it fits there', () => {
    const at = popPosition({ x: 500, y: 450 }, card, area, margins);
    expect(at.x).toBe(350);
    expect(at.y + card.height).toBeLessThan(450);
  });

  it('goes below the point when there is no room above (a far force, near the sky), toward the center of the screen', () => {
    const at = popPosition({ x: 500, y: 150 }, card, area, margins);
    expect(at.y).toBeGreaterThan(150);
  });

  it('never leaves the area: it is kept off the edges by the margins', () => {
    for (const p of [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 0, y: 700 }, { x: 1000, y: 700 }, { x: 500, y: 350 }]) {
      const at = popPosition(p, card, area, margins);
      expect(at.x).toBeGreaterThanOrEqual(margins.left);
      expect(at.x + card.width).toBeLessThanOrEqual(area.width - margins.right);
      expect(at.y).toBeGreaterThanOrEqual(margins.top);
      expect(at.y + card.height).toBeLessThanOrEqual(area.height - margins.bottom);
    }
  });

  it('keeps the card at the top margin when the force is above the screen', () => {
    expect(popPosition({ x: 500, y: -300 }, card, area, margins).y).toBeGreaterThanOrEqual(margins.top);
  });

  it('still returns a place when the card is bigger than the area', () => {
    const at = popPosition({ x: 500, y: 350 }, { width: 2000, height: 2000 }, area, margins);
    expect(at.x).toBe(margins.left);
    expect(at.y).toBe(margins.top);
  });
});
