import { describe, it, expect } from 'vitest';
import { countryReferences } from '../../src/tour/countryReferences';
import { addReferenceLines } from '../../src/charts/builders/referenceLines';
import { COMPARE_OPTIONS, flagSrc } from '../../src/tour/worldCompare';
import { LAST_YEAR, gdpAtYear, gdpPerCapitaAt } from '../../src/tour/worldData';

describe('countryReferences', () => {
  it('gives the latest real GDP of each compared country, from the lowest, with its flag', () => {
    const refs = countryReferences('gdp', { min: 0, max: Infinity });
    expect(refs).toHaveLength(COMPARE_OPTIONS.length);
    expect(refs.map((r) => r.value)).toEqual([...refs.map((r) => r.value)].sort((a, b) => a - b));
    const chile = refs.find((r) => r.country === 'Chile')!;
    expect(chile.value).toBeCloseTo(gdpAtYear('Chile', LAST_YEAR)!, 6);
    expect(chile.flag).toBe(flagSrc('Chile'));
  });

  it('scales GDP per person to thousands of dollars', () => {
    const refs = countryReferences('percapita', { min: 0, max: Infinity, scale: 1000 });
    const spain = refs.find((r) => r.country === 'España')!;
    expect(spain.value).toBeCloseTo(gdpPerCapitaAt('España', LAST_YEAR)! / 1000, 6);
  });

  it('keeps only the countries inside the range of the chart (bounds included)', () => {
    const all = countryReferences('gdp', { min: 0, max: Infinity });
    const lo = all[1]!.value;
    const hi = all[3]!.value;
    const some = countryReferences('gdp', { min: lo, max: hi });
    expect(some.map((r) => r.country)).toEqual(all.slice(1, 4).map((r) => r.country));
  });

  it('returns nothing when no country falls in the range', () => {
    expect(countryReferences('gdp', { min: -2, max: -1 })).toEqual([]);
  });
});

describe('addReferenceLines', () => {
  const base = { series: [{ name: 'Base', type: 'line', data: [] }] };
  const ref = (country: string, value: number) => ({ country, value, flag: `/flags/${country}.svg` });

  it('adds one horizontal mark line per country to the first series and keeps the rest of the option', () => {
    const out = addReferenceLines({ ...base, animation: false }, [ref('Chile', 100), ref('España', 500)], { range: 1000 }) as {
      animation: boolean;
      series: Array<{ markLine?: { data: Array<{ yAxis: number }> } }>;
    };
    expect(out.animation).toBe(false);
    expect(out.series[0]!.markLine!.data.map((d) => d.yAxis)).toEqual([100, 500]);
  });

  it('shifts the flag of a line that sits too close to the previous one so labels do not pile up', () => {
    const out = addReferenceLines(base, [ref('Chile', 100), ref('Uruguay', 101), ref('España', 600)], { range: 1000 }) as {
      series: Array<{ markLine: { data: Array<{ label: { offset: [number, number] } }> } }>;
    };
    const offsets = out.series[0]!.markLine.data.map((d) => d.label.offset[0]);
    expect(offsets[0]).toBe(0);
    expect(offsets[1]).toBeLessThan(offsets[0]!);
    expect(offsets[2]).toBe(0);
  });

  it('returns the option untouched when there is nothing to draw', () => {
    expect(addReferenceLines(base, [], { range: 10 })).toBe(base);
  });
});
