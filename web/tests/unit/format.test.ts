import { describe, it, expect } from 'vitest';
import { formatValue } from '../../src/charts/format.js';

describe('formatValue', () => {
  it('formats null or undefined as "-"', () => {
    expect(formatValue(null, 't')).toBe('-');
    expect(formatValue(undefined, 't')).toBe('-');
  });

  it('formats numbers below 10,000 without compact notation', () => {
    expect(formatValue(9999, 't')).toBe('9,999 t'); // depends on en-US locale
    expect(formatValue(150.5, 'USD')).toBe('150.5 USD');
  });

  it('formats numbers above 10,000 with compact notation', () => {
    expect(formatValue(10000, 't')).toBe('10K t');
    expect(formatValue(1500000, 't')).toBe('1.5M t');
  });

  it('always includes the unit', () => {
    expect(formatValue(42, 'cats')).toMatch(/cats$/);
  });
});
