import { describe, expect, it } from 'vitest';
import { OTHER_CROPS, otherCropsMt } from '../../src/tour/agroOtherCrops';
import { breakdown } from '../../src/tour/resourcesData';

describe('Otros cultivos', () => {
  it('keeps the four main crops out and names the file they come from', () => {
    const names = OTHER_CROPS.rows.map((r) => r.crop);
    for (const main of ['soja', 'maíz', 'trigo', 'girasol']) expect(names.some((n) => n.toLowerCase().startsWith(main))).toBe(false);
    expect(names).toContain('Sorgo');
    expect(OTHER_CROPS.source).toMatch(/MAGyP/);
  });

  it('adds one part «Otros cultivos» to the agro breakdown, equal to the sum of the rows in million tonnes', () => {
    const sum = OTHER_CROPS.rows.reduce((s, r) => s + r.tonnes, 0) / 1e6;
    expect(otherCropsMt()).toBeCloseTo(sum, 9);
    expect(breakdown('agro').parts.find((p) => p.label === 'Otros cultivos')!.value).toBeCloseTo(sum, 9);
  });

  it('is for the same campaign as the main crops of the slide', () => {
    expect(OTHER_CROPS.campaign).toBe('2024/25');
    expect(otherCropsMt()).toBeGreaterThan(10);
  });
});
