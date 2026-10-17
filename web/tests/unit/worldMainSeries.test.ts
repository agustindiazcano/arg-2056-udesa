import { describe, expect, it } from 'vitest';
import { FIRST_YEAR, HOME, LAST_YEAR, argentinaReal, gdpPerCapitaAt, mainSeries } from '../../src/tour/worldData';

describe('mainSeries', () => {
  it('is the real GDP of Argentina for the gdp metric', () => {
    expect(mainSeries('gdp')).toEqual(argentinaReal());
  });

  it('is the real GDP per person of Argentina, one value per year, for the per capita metric', () => {
    const s = mainSeries('percapita');
    expect(s.years[0]).toBe(FIRST_YEAR);
    expect(s.years.at(-1)).toBe(LAST_YEAR);
    expect(s.values).toHaveLength(s.years.length);
    expect(s.values.at(-1)).toBeCloseTo(gdpPerCapitaAt(HOME, LAST_YEAR)!, 6);
    expect(s.values.every((v) => v > 0)).toBe(true);
  });

  it('has no NaN: where the data has no value the series holds 0, never an invented figure', () => {
    const s = mainSeries('percapita', 'Argentina');
    expect(s.values.some((v) => Number.isNaN(v))).toBe(false);
  });
});
