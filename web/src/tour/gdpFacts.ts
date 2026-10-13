import imf from './imfWeo.json';
import world from './worldGdp.json';

/**
 * The one place where the GDP of Argentina comes from, so that no chart, table or text of the project says one figure here and another there.
 *
 * Always REAL GDP at constant prices, in billions of 2015 US dollars (human decision of 2026-10-13: never nominal in current dollars, never PPP):
 * - up to 2025, observed: World Bank (WDI `NY.GDP.MKTP.KD`), `worldGdp.json` (scripts/build_world_gdp.py).
 * - 2026, an estimate: the 2025 value grown by the real growth that the IMF projects for 2026 (World Economic Outlook, `imfWeo.json`,
 *   scripts/imf_compare.py; update of 2026-09-30), because the IMF does not publish the real GDP in constant dollars.
 * Every projection of the Recorrido (steps 1 and 3, the simulator) starts from the 2026 figure and goes on from there with made-up growth.
 */
const arg = world.countries.find((c) => c.code === 'ARG')!;

/** The real GDP of Argentina by year, 1960 to 2025, billions of constant 2015 USD (World Bank). */
export const ARG_REAL: Readonly<Record<number, number>> = Object.fromEntries(world.years.map((y, i) => [y, arg.gdp[i]]).filter(([, v]) => v !== null)) as Record<number, number>;

export const LAST_OBSERVED = world.lastYear;
/** The population of Argentina in the last observed year, in millions: the official one of the INDEC (Censo 2022 projection), not the World Bank or the IMF. */
export const ARG_POPULATION_LAST = arg.pop[world.years.indexOf(world.lastYear)]!;
export const ARG_GDP_LAST = ARG_REAL[LAST_OBSERVED]!;
/** The real growth of 2026 that the IMF projects for Argentina, in %. */
export const ARG_GROWTH_2026 = (imf.argentina.NGDP_RPCH as Record<string, number>)['2026']!;
/** The real GDP of 2026: the first year of every projection. */
export const ARG_GDP_2026 = ARG_GDP_LAST * (1 + ARG_GROWTH_2026 / 100);
export const GDP_UNIT = 'miles de millones de USD de 2015';
export const GDP_KIND = 'PBI real, a precios constantes de 2015';
export const GDP_SOURCE_HISTORY = 'Banco Mundial (WDI), PBI real en dólares constantes de 2015';
export const GDP_SOURCE_2026 = `2026: el valor de 2025 por el crecimiento real que proyecta el FMI (${ARG_GROWTH_2026.toLocaleString('es-AR')} %, actualización del ${imf.vintage_update_date_argentina})`;
