import { describe, expect, it } from 'vitest';
import { FIRST_YEAR } from '../../src/tour/worldData';
import { WORLD_FIRST_YEAR } from '../../src/tour/worldYears';

describe('worldYears', () => {
  it('is the first year of the world GDP data', () => {
    expect(WORLD_FIRST_YEAR).toBe(FIRST_YEAR);
  });
});
