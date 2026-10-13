import { describe, expect, it } from 'vitest';
import { ARG_GDP_2026, ARG_GDP_LAST, ARG_GROWTH_2026, ARG_POPULATION_LAST } from '../../src/tour/gdpFacts';
import { GDP_MOCK } from '../../src/tour/gdpMock';
import { TOUR_INDICATORS } from '../../src/tour/indicatorsMock';
import { SIM_START, SIM_START_GDP, simulate, DEFAULT_SIM } from '../../src/tour/simModel';
import { aiImpactData } from '../../src/tour/tourData';
import { LAST_YEAR, argentinaReal, regionCountries, regionValuesAt, worldRankingAt } from '../../src/tour/worldData';

const round1 = (v: number) => Math.round(v * 10) / 10;

/** The GDP of Argentina must be one figure everywhere: REAL, constant 2015 US dollars, from `gdpFacts`. */
describe('one figure for the GDP and the population of Argentina', () => {
  it('2025 (observed): the ranking, the region, the line of step 0, the indicators and the GDP chart say the same', () => {
    expect(ARG_GDP_LAST).toBeCloseTo(609.2, 1);
    expect(argentinaReal().values.at(-1)).toBe(ARG_GDP_LAST);
    expect(regionValuesAt(LAST_YEAR)[regionCountries().indexOf('Argentina')]).toBe(ARG_GDP_LAST);
    expect(worldRankingAt(LAST_YEAR).find((c) => c.country === 'Argentina')!.value).toBe(ARG_GDP_LAST);
    const i = GDP_MOCK.years.indexOf(2025);
    expect(GDP_MOCK.history[i]).toBe(round1(ARG_GDP_LAST));
    const shown = TOUR_INDICATORS.find((x) => x.label === 'PBI real')!.value;
    expect(shown).toBe(round1(ARG_GDP_LAST).toLocaleString('es-AR', { minimumFractionDigits: 1 }));
  });

  it('2026 (the real GDP of 2025 grown by the IMF growth): the GDP chart, the AI chart and the simulator all start from the same figure', () => {
    expect(ARG_GROWTH_2026).toBeCloseTo(2.06, 1);
    expect(ARG_GDP_2026).toBeCloseTo(ARG_GDP_LAST * (1 + ARG_GROWTH_2026 / 100), 6);
    const i = GDP_MOCK.years.indexOf(2026);
    expect(GDP_MOCK.expected[i]).toBe(round1(ARG_GDP_2026));
    const ai = aiImpactData();
    expect(ai.years[0]).toBe(2026);
    expect(ai.series[0]!.values[0]).toBe(round1(ARG_GDP_2026));
    expect(ai.series[1]!.values[0]).toBe(round1(ARG_GDP_2026));
    expect(SIM_START).toBe(2026);
    expect(SIM_START_GDP).toBe(round1(ARG_GDP_2026));
    expect(simulate(DEFAULT_SIM).gdp[0]).toBe(SIM_START_GDP);
  });

  it('the population is the official one of the INDEC (46.387 million in 2025), in the indicators and in the region', () => {
    expect(ARG_POPULATION_LAST).toBeCloseTo(46.387, 3);
    expect(regionValuesAt(LAST_YEAR, 'population')[regionCountries().indexOf('Argentina')]).toBe(ARG_POPULATION_LAST);
    expect(TOUR_INDICATORS.find((x) => x.label === 'Población')!.value).toBe('46,4');
  });
});
