import { describe, expect, it } from 'vitest';
import { barsSpec } from '../../src/charts3d/specs';

describe('barsSpec', () => {
  const rows = [
    { label: 'CHL', value: 210 },
    { label: 'ARG', value: 150 },
    { label: 'BRA', value: 70 }
  ];

  it('turns rows into bars with the value formatted in es-AR and the highlighted one marked', () => {
    const spec = barsSpec(rows, { title: 'Ranking', unit: 'USD', highlight: 'ARG' });
    expect(spec.kind).toBe('bars');
    expect(spec.title).toBe('Ranking');
    expect(spec.unit).toBe('USD');
    expect(spec.bars).toEqual([
      { label: 'CHL', value: 210, display: '210 USD', short: '210', highlight: false },
      { label: 'ARG', value: 150, display: '150 USD', short: '150', highlight: true },
      { label: 'BRA', value: 70, display: '70 USD', short: '70', highlight: false }
    ]);
  });

  it('marks nothing when no highlight is given', () => {
    expect(barsSpec(rows, { title: 'T', unit: 'u' }).bars.some((b) => b.highlight)).toBe(false);
  });

  it('drops rows without a value instead of drawing them as zero', () => {
    const spec = barsSpec([...rows, { label: 'PER', value: null }], { title: 'T', unit: 'u' });
    expect(spec.bars.map((b) => b.label)).toEqual(['CHL', 'ARG', 'BRA']);
  });

  it('carries the text alternative it is given', () => {
    expect(barsSpec(rows, { title: 'T', unit: 'u', summary: 'resumen' }).summary).toBe('resumen');
  });

  it('writes a default text alternative from the numbers', () => {
    const spec = barsSpec(rows, { title: 'Ranking', unit: 'USD' });
    expect(spec.summary).toBe('Ranking, vista 3D de barras: CHL 210 USD, ARG 150 USD, BRA 70 USD');
  });
});
