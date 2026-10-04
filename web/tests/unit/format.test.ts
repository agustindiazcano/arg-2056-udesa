import { describe, it, expect } from 'vitest';
import { APP_LOCALE, formatDate, formatDecimal, formatNumber, formatPercent, formatValue, ordinal } from '../../src/charts/format.js';

describe('APP_LOCALE', () => {
  it('is Argentine Spanish', () => {
    expect(APP_LOCALE).toBe('es-AR');
  });
});

describe('formatValue', () => {
  it('formats null or undefined as "-"', () => {
    expect(formatValue(null, 't')).toBe('-');
    expect(formatValue(undefined, 't')).toBe('-');
  });

  it('formats numbers below 10,000 with Argentine separators', () => {
    expect(formatValue(9999, 't')).toBe('9.999 t');
    expect(formatValue(150.5, 'USD')).toBe('150,5 USD');
  });

  it('formats numbers above 10,000 with compact notation', () => {
    expect(formatValue(10000, 't').replace(/ /g, ' ')).toBe('10 k t');
    expect(formatValue(1500000, 't').replace(/ /g, ' ')).toBe('1,5 M t');
  });

  it('always includes the unit', () => {
    expect(formatValue(42, 'gatos')).toMatch(/gatos$/);
  });
});

describe('ordinal', () => {
  it('uses the Spanish masculine ordinal sign', () => {
    expect(ordinal(1)).toBe('1.º');
    expect(ordinal(2)).toBe('2.º');
    expect(ordinal(11)).toBe('11.º');
  });
});

describe('formatNumber', () => {
  it('fixes the number of decimals and uses the decimal comma and the thousands dot', () => {
    expect(formatNumber(1.2249)).toBe('1,2');
    expect(formatNumber(1.2249, 2)).toBe('1,22');
    expect(formatNumber(1082.4, 1)).toBe('1.082,4');
    expect(formatNumber(14, 1)).toBe('14,0');
  });
});

describe('formatDecimal', () => {
  it('shows up to two decimals and none when the number is whole', () => {
    expect(formatDecimal(7)).toBe('7');
    expect(formatDecimal(5.5)).toBe('5,5');
    expect(formatDecimal(0.125)).toBe('0,13');
  });
});

describe('formatPercent', () => {
  it('uses the decimal comma, one decimal and no space before the sign', () => {
    expect(formatPercent(144.44)).toBe('144,4%');
    expect(formatPercent(-3.05)).toBe('-3,1%');
  });

  it('can force the plus sign for gaps', () => {
    expect(formatPercent(144.44, { signed: true })).toBe('+144,4%');
    expect(formatPercent(0, { signed: true })).toBe('+0,0%');
    expect(formatPercent(-2, { signed: true })).toBe('-2,0%');
  });
});

describe('formatDate', () => {
  it('formats an ISO date in Argentine Spanish', () => {
    expect(formatDate('2026-10-04')).toBe('4 de octubre de 2026');
  });

  it('returns the input when it is not a date', () => {
    expect(formatDate('sin fecha')).toBe('sin fecha');
  });
});
