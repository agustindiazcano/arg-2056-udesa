import imf from './imfWeo.json';
import world from './worldNominal.json';

/**
 * The one place where the GDP of Argentina comes from, so that no chart, table or text of the project says one figure here and another there.
 *
 * Always NOMINAL GDP in current US dollars (never PPP), in billions:
 * - up to 2025, observed: World Bank (WDI `NY.GDP.MKTP.CD`), `worldNominal.json` (scripts/build_world_nominal.py). The IMF has 683.6 for 2025 against 683.1.
 * - 2026, an estimate: IMF World Economic Outlook, `imfWeo.json` (scripts/imf_compare.py; update of 2026-09-30).
 * Every projection of the Recorrido (steps 1 and 3, the simulator) starts from the 2026 figure and goes on from there with made-up growth.
 */
const arg = world.countries.find((c) => c.code === 'ARG')!;

/** The nominal GDP of Argentina by year, 1960 to 2025 (World Bank). */
export const ARG_NOMINAL: Readonly<Record<number, number>> = Object.fromEntries(world.years.map((y, i) => [y, arg.gdp[i]]).filter(([, v]) => v !== null)) as Record<number, number>;

export const LAST_OBSERVED = world.lastYear;
/** The population of Argentina in the last observed year, in millions: the official one of the INDEC (Censo 2022 projection), not the World Bank or the IMF. */
export const ARG_POPULATION_LAST = arg.pop[world.years.indexOf(world.lastYear)]!;
export const ARG_GDP_LAST = ARG_NOMINAL[LAST_OBSERVED]!;
/** The estimate of the IMF for 2026: the first year of every projection. */
export const ARG_GDP_2026 = (imf.argentina.NGDPD as Record<string, number>)['2026']!;
export const GDP_UNIT = 'miles de millones de USD corrientes';
export const GDP_KIND = 'PBI nominal, en dólares corrientes (no PPA)';
export const GDP_SOURCE_HISTORY = 'Banco Mundial (WDI), PBI nominal en dólares corrientes';
export const GDP_SOURCE_2026 = `FMI, World Economic Outlook (actualización del ${imf.vintage_update_date_argentina}), estimación para 2026`;
