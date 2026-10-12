// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { isBaked } from '../../src/terrain/baked';

describe('isBaked', () => {
  it('is true only for a terrain that the build found in /terrain', () => {
    expect(isBaked('andes', ['andes', 'patagonia'])).toBe(true);
    expect(isBaked('andes', [])).toBe(false);
    expect(isBaked('andes', ['patagonia'])).toBe(false);
  });
});
