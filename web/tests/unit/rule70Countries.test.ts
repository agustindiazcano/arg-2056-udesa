import { describe, expect, it } from 'vitest';
import { PRESETS, analyse, countriesTable, countryList, seriesOf } from '../../src/tour/rule70Countries';

const close = (a: number, b: number, tol: number) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(tol);

function ok(code: string, indicator: 'gdp' | 'percapita', from: number, to: number) {
  const a = analyse(code, indicator, from, to);
  if (!a.ok) throw new Error(a.reason);
  return a;
}

describe('the cases of the explorer', () => {
  it('has the five presets of the brief: Argentina, China 1979-2010, South Korea 1960-1990, India and the United States', () => {
    expect(PRESETS.map((p) => p.code)).toEqual(['ARG', 'CHN', 'KOR', 'IND', 'USA']);
    const china = PRESETS.find((p) => p.code === 'CHN')!;
    expect([china.from, china.to]).toEqual([1979, 2010]);
    const korea = PRESETS.find((p) => p.code === 'KOR')!;
    expect([korea.from, korea.to, korea.indicator]).toEqual([1960, 1990, 'percapita']);
  });

  it('lists the countries of the data, by name, with the five of the presets among them', () => {
    const list = countryList();
    expect(list.length).toBeGreaterThan(40);
    for (const p of PRESETS) expect(list.some((c) => c.code === p.code)).toBe(true);
    expect([...list].map((c) => c.name)).toEqual([...list.map((c) => c.name)].sort((a, b) => a.localeCompare(b)));
  });
});

describe('the series', () => {
  it('has real GDP in billions and GDP per person as GDP over population, one value per year from 1960', () => {
    const gdp = seriesOf('KOR', 'gdp');
    expect(gdp[0]).toMatchObject({ year: 1960 });
    expect(gdp.at(-1)).toMatchObject({ year: 2025 });
    const pc = seriesOf('KOR', 'percapita');
    close(pc.find((p) => p.year === 1960)!.value!, 1037.9, 0.5); // 25.96 billion / 25.012 million people
    close(pc.find((p) => p.year === 1990)!.value!, 9672.7, 0.5);
  });

  it('keeps the years without a value as null: nothing is filled in', () => {
    const all = countryList().flatMap((c) => seriesOf(c.code, 'gdp'));
    expect(all.some((p) => p.value === null)).toBe(true);
    expect(all.filter((p) => p.value !== null).every((p) => p.value! > 0)).toBe(true);
  });
});

describe('the analysis of a period', () => {
  it('South Korea, real GDP per person 1960 to 1990: 7.72 % a year between the endpoints (the vector of the brief, within 0.05 points)', () => {
    const a = ok('KOR', 'percapita', 1960, 1990);
    close(a.cagrPct, 7.72, 0.05);
    close(a.doublingExact, 9.32, 0.05); // ln 2 / ln(1.0772)
    expect(a.doublings).toBeGreaterThan(3.1);
    expect(a.doublings).toBeLessThan(3.3);
    expect(a.years).toBe(30);
  });

  it('China, real GDP 1979 to 2010: about 10 % a year, doubling every 7.2 years, 4.3 doublings', () => {
    const a = ok('CHN', 'gdp', 1979, 2010);
    close(a.cagrPct, 10.04, 0.05);
    close(a.doublingExact, 7.25, 0.1);
    close(a.doublings, Math.log2(7711.4 / 397.28), 0.01);
    close(a.rule70!, 70 / a.cagrPct, 1e-9);
    close(a.rule72!, 72 / a.cagrPct, 1e-9);
  });

  it('gives the fitted rate and its R2 next to the endpoint rate: they are not the same number', () => {
    const a = ok('ARG', 'gdp', 1960, 2025);
    expect(a.fit.r2).toBeGreaterThan(0.9);
    expect(a.fit.r2).toBeLessThan(1);
    expect(a.fit.ratePct).not.toBeCloseTo(a.cagrPct, 6);
    close(a.fit.ratePct, a.cagrPct, 1.0);
  });

  it('draws the real series against the constant-rate path, which starts and ends at the endpoints', () => {
    const a = ok('KOR', 'percapita', 1960, 1990);
    expect(a.points).toHaveLength(31);
    expect(a.points[0]).toMatchObject({ year: 1960 });
    close(a.points[0]!.constant, a.v0, 1e-9);
    close(a.points.at(-1)!.constant, a.v1, 1e-6);
    expect(a.points.every((p) => p.actual !== null)).toBe(true);
    expect(a.maxDeviationPct).toBeGreaterThan(0);
  });

  it('has a rolling doubling time over 10-year windows (rolling window ends inside the period)', () => {
    const a = ok('KOR', 'percapita', 1960, 1990);
    expect(a.rolling[0]!.year).toBe(1970);
    expect(a.rolling.at(-1)!.year).toBe(1990);
    expect(a.rolling.every((r) => Number.isFinite(r.doublingYears) && r.doublingYears > 0)).toBe(true);
  });

  it('says there is no doubling when the level did not grow', () => {
    const shrink = countryList()
      .map((c) => c.code)
      .map((code) => {
        for (let from = 1960; from <= 2000; from += 5) {
          const a = analyse(code, 'gdp', from, from + 10);
          if (a.ok && a.cagrPct <= 0) return a;
        }
        return null;
      })
      .find((a) => a !== null);
    expect(shrink).toBeDefined();
    expect(shrink!.doublingExact).toBe(Infinity);
    expect(shrink!.rule70).toBeNull();
  });

  it('refuses a period with no value at an endpoint, or too short, instead of filling it in', () => {
    const missing = countryList().flatMap((c) => seriesOf(c.code, 'gdp').filter((p) => p.value === null).map((p) => ({ code: c.code, year: p.year })))[0]!;
    const a = analyse(missing.code, 'gdp', missing.year, 2025);
    expect(a.ok).toBe(false);
    expect(!a.ok && a.reason).toMatch(/sin dato/i);
    const short = analyse('ARG', 'gdp', 2000, 2001);
    expect(short.ok).toBe(false);
    expect(analyse('ARG', 'gdp', 2010, 2000).ok).toBe(false);
  });
});

describe('the Data table of the cases', () => {
  it('has one row per preset with the endpoints, the two rates and the doublings', () => {
    const t = countriesTable();
    expect(t.id).toBe('rule70-countries');
    expect(t.rows).toHaveLength(5);
    const korea = t.rows.find((r) => String(r[0]).startsWith('Corea'))!;
    close(korea[6] as number, 7.72, 0.05);
  });
});
