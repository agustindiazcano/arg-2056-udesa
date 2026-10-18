import { describe, expect, it } from 'vitest';
import { COMPARE_OPTIONS, DEFAULT_COMPARE, compareSeries, flagSrc, isSquashed } from '../../src/tour/worldCompare';
import { mainSeries } from '../../src/tour/worldData';
import { existsSync } from 'node:fs';

describe('compare options', () => {
  it('starts with Argentina plus Brasil and México, and offers the other seven as flags', () => {
    expect(DEFAULT_COMPARE).toEqual(['Brasil', 'México']);
    expect(COMPARE_OPTIONS.map((o) => o.name)).toEqual(['Brasil', 'México', 'Estados Unidos', 'Australia', 'Japón', 'Alemania', 'Chile', 'Uruguay', 'España']);
  });

  it('has a flag file for every country and for Argentina, in public/flags', () => {
    for (const name of ['Argentina', ...COMPARE_OPTIONS.map((o) => o.name)]) {
      const src = flagSrc(name);
      expect(src.startsWith('/flags/')).toBe(true);
      expect(existsSync(`public${src}`), src).toBe(true);
    }
  });
});

describe('compareSeries', () => {
  it('puts Argentina first, then the chosen countries in the order of the options, with the data of the metric', () => {
    const lines = compareSeries(['Chile', 'Brasil'], 'gdp');
    expect(lines.map((l) => l.country)).toEqual(['Argentina', 'Brasil', 'Chile']);
    expect(lines[0]!.values).toEqual(mainSeries('gdp').values);
    expect(lines[1]!.values).toEqual(mainSeries('gdp', 'Brasil').values);
  });

  it('never repeats Argentina nor an unknown country, and works with per capita', () => {
    const lines = compareSeries(['Argentina', 'Narnia', 'Uruguay'], 'percapita');
    expect(lines.map((l) => l.country)).toEqual(['Argentina', 'Uruguay']);
    expect(lines[1]!.values).toEqual(mainSeries('percapita', 'Uruguay').values);
  });
});

describe('isSquashed', () => {
  it('is false when every line reaches at least a tenth of the highest one', () => {
    expect(isSquashed(compareSeries(['Brasil', 'México'], 'gdp'))).toBe(false);
  });

  it('is true when a line stays under a tenth of the highest one (Argentina next to Estados Unidos)', () => {
    expect(isSquashed(compareSeries(['Estados Unidos'], 'gdp'))).toBe(true);
  });

  it('is false for a single line', () => {
    expect(isSquashed(compareSeries([], 'gdp'))).toBe(false);
  });
});
