import { describe, expect, it } from 'vitest';
import { barsSpec, linesSpec } from '../../src/charts3d/specs';

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

describe('linesSpec', () => {
  const series = [
    { name: 'ARG', values: [1, 2, null], tone: 'highlight' as const },
    { name: 'BRA', values: [2, 3, 4], tone: 'muted' as const }
  ];

  it('carries the series, the labels, the band and the marker as they are', () => {
    const spec = linesSpec({ title: 'Largo plazo', unit: 'USD', xLabels: ['1', '2', '3'], series, marker: 1, band: { lower: [1, 1, 1], upper: [2, 2, 2] } });
    expect(spec).toMatchObject({ kind: 'lines', title: 'Largo plazo', unit: 'USD', xLabels: ['1', '2', '3'], marker: 1 });
    expect(spec.series).toEqual(series);
    expect(spec.band).toEqual({ lower: [1, 1, 1], upper: [2, 2, 2] });
  });

  it('writes a default text alternative with the series names and the span', () => {
    expect(linesSpec({ title: 'Largo plazo', unit: 'USD', xLabels: ['1880', '1890', '1900'], series }).summary).toBe(
      'Largo plazo, vista 3D de líneas, de 1880 a 1900: ARG, BRA'
    );
  });

  it('keeps the summary it is given', () => {
    expect(linesSpec({ title: 'T', unit: 'u', xLabels: ['1'], series, summary: 'resumen' }).summary).toBe('resumen');
  });
});
