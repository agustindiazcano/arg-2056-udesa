import { describe, expect, it } from 'vitest';
import { detailedInfantryModel } from '../../src/scenes/andes/detailedInfantry';

describe('detailed infantry uniforms', () => {
  it('distributes the nearest possible 30 percent red uniforms across the infantry', () => {
    for (const count of [1, 3, 10, 37, 120]) {
      const models = Array.from({ length: count }, (_, index) => detailedInfantryModel(index));
      expect(models.filter((model) => model === 'soldier-red')).toHaveLength(Math.round(count * 0.3));
      expect(models.every((model) => model === 'soldier-red' || model === 'soldier-blue')).toBe(true);
    }
  });
});
