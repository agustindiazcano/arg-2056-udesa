import { describe, expect, it } from 'vitest';
import { LIVESTOCK, LITRES_TO_TONNES, livestockParts } from '../../src/tour/livestockArgentina';
import { breakdown, totals } from '../../src/tour/resourcesData';

describe('agro breakdown with livestock', () => {
  it('keeps the four crops and adds beef, poultry, pork and milk, in million tonnes', () => {
    const labels = breakdown('agro').parts.map((p) => p.label);
    for (const crop of ['Soja', 'Maíz', 'Trigo', 'Girasol']) expect(labels).toContain(crop);
    for (const item of ['Carne bovina', 'Carne aviar', 'Carne porcina', 'Leche']) expect(labels).toContain(item);
    expect(breakdown('agro').unit).toBe('millones de toneladas');
  });

  it('converts the litres of milk to tonnes with the stated density and keeps the meat as reported', () => {
    const parts = livestockParts();
    const milk = parts.find((p) => p.label === 'Leche')!;
    expect(milk.value).toBeCloseTo((LIVESTOCK.milk_million_litres * LITRES_TO_TONNES) / 1000, 6);
    expect(parts.find((p) => p.label === 'Carne bovina')!.value).toBeCloseTo(3.1, 6);
    expect(parts.find((p) => p.label === 'Carne porcina')!.value).toBeCloseTo(0.809, 6);
  });

  it('keeps the harvest total of the four crops apart from the livestock', () => {
    const harvest = totals('agro').find((t) => t.label.startsWith('Cosecha'))!;
    const crops = breakdown('agro').parts.filter((p) => ['Soja', 'Maíz', 'Trigo', 'Girasol'].includes(p.label)).reduce((s, p) => s + p.value, 0);
    expect(harvest.value).toBe(crops.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  });

  it('adds a livestock total with the sources named in the data', () => {
    expect(totals('agro').some((t) => t.label.includes('carne'))).toBe(true);
    expect(LIVESTOCK.source).toMatch(/Bolsa de Comercio de Rosario/);
  });
});
