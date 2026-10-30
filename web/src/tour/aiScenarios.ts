import { tokens } from '../styles/tokens.js';

/**
 * The three scenarios of the slide "Cuarta revolución industrial: el impacto de la IA en la economía": growth accounting (capital, labor, TFP)
 * plus a boost to TFP from AI, as written in the report the human pasted on 2026-10-15 (an AI-written report, not verified against its
 * sources), except the optimistic one, which the human asked to make truly optimistic with the figures of the second report: the Anthropic / Korinek
 * extreme case (+32.4 % on the level of GDP by 2030 over the base, which is about 10.5 % a year in 2027-2030 on top of a 3.0 % base) and then the
 * Goldman Sachs +1.5 points of yearly productivity (4.25 % in 2031-2056). Both come from US studies and are not about Argentina. The chart uses the MIDDLE of each range: 2027-2030 at the middle of its 2026-2030 average and 2031-2035 at the
 * middle of its 2031-2035 average. The report stops at 2035: from 2036 to 2056 (the human asked for the horizon of the project) each scenario goes on
 * at the rate of its 2031-2035 period, an assumption and not a figure of the report. 2026 is the IMF estimate shared by every slide (`gdpFacts.ts`).
 */
export interface AiScenario {
  id: 'base' | 'moderate' | 'optimistic';
  name: string;
  color: string;
  /** average yearly growth 2026-2030, % (low, high) as the report gives it */
  growth2030: readonly [number, number];
  /** level of 2030 against 2025, % (low, high) */
  level2030: readonly [number, number];
  /** average yearly growth 2031-2035, % (low, high) */
  growth2035: readonly [number, number];
  /** what AI adds to the TFP growth, percentage points a year (low, high) */
  aiPoints: readonly [number, number];
  comment: string;
}

export const AI_SCENARIOS: readonly AiScenario[] = [
  {
    id: 'base',
    name: 'Base',
    color: tokens.scenario.pessimistic,
    growth2030: [2.8, 3.2],
    level2030: [15, 18],
    growth2035: [2.5, 3.0],
    aiPoints: [0.1, 0.2],
    comment: 'Estabilización y recursos; la IA aporta lo mínimo'
  },
  {
    id: 'moderate',
    name: 'Moderado',
    color: tokens.scenario.expected,
    growth2030: [3.3, 3.8],
    level2030: [18, 22],
    growth2035: [3.0, 3.5],
    aiPoints: [0.3, 0.4],
    comment: 'Adopción media de la IA y el RIGI funciona'
  },
  {
    id: 'optimistic',
    name: 'Optimista',
    color: tokens.scenario.optimistic,
    growth2030: [10.0, 11.0],
    level2030: [50, 55],
    growth2035: [4.0, 4.5],
    aiPoints: [1.5, 7.3],
    comment: 'IA transformadora: el nivel del PBI sube 32,4 % hasta 2030 sobre el base (escenario extremo de Anthropic) y después la productividad suma 1,5 puntos por año (Goldman Sachs)'
  }
];

export interface CurveCountryFlag {
  country: string;
  flag: string;
}

/** Representative countries on each curve: Frontier compute exporters (Optimistic/Green), Fast followers (Moderate/Blue), and Emerging economies with structural/tax friction like Argentina (Base/Red). */
export const SCENARIO_CURVE_FLAGS: Readonly<Record<AiScenario['id'], readonly CurveCountryFlag[]>> = {
  optimistic: [
    { country: 'Estados Unidos', flag: '/flags/us.svg' },
    { country: 'Australia', flag: '/flags/au.svg' },
    { country: 'Alemania', flag: '/flags/de.svg' }
  ],
  moderate: [
    { country: 'España', flag: '/flags/es.svg' },
    { country: 'Chile', flag: '/flags/cl.svg' },
    { country: 'Uruguay', flag: '/flags/uy.svg' }
  ],
  base: [
    { country: 'Argentina', flag: '/flags/ar.svg' },
    { country: 'Brasil', flag: '/flags/br.svg' },
    { country: 'México', flag: '/flags/mx.svg' }
  ]
};

export type AiProjectionScope = 'arg' | 'world' | 'groups';

export interface ScopeScenarioRate {
  id: 'base' | 'moderate' | 'optimistic';
  name: string;
  color: string;
  annualGrowthPct: number;
  aiBoostPp: string;
  countriesLabel: string;
  detail: string;
}

/**
 * Calibrated annual growth rates (2026-2056) for World and Frontier vs. Emerging-with-friction groups,
 * synthesized from Goldman Sachs (Briggs & Kodnani, 2023), IMF WP/25/76 ("Mind the Gap"), IMF AIPI (0.68 vs 0.47),
 * Acemoglu (NBER w32487, Hulten's theorem) and Anthropic Economic Index (arXiv:2511.15080).
 */
export const WORLD_RATES: readonly ScopeScenarioRate[] = [
  {
    id: 'base',
    name: 'Pesimista mundial',
    color: tokens.scenario.pessimistic,
    annualGrowthPct: 2.62,
    aiBoostPp: '+0,12 pp/año IA (+0,08 a +0,15)',
    countriesLabel: 'Promedio global con fricción energética y regulatoria (Acemoglu)',
    detail: 'Base global 2,50 % + 0,12 pp de IA: automatización acotada a tareas rutinarias sin transformación estructural.'
  },
  {
    id: 'moderate',
    name: 'Neutro mundial',
    color: tokens.scenario.expected,
    annualGrowthPct: 3.0,
    aiBoostPp: '+0,50 pp/año IA (+0,40 a +0,60)',
    countriesLabel: 'Consenso FMI (WP/25/76) y OCDE para el PBI global',
    detail: 'Base global 2,50 % + 0,50 pp de IA: difusión gradual con brecha persistente entre economías avanzadas y emergentes.'
  },
  {
    id: 'optimistic',
    name: 'Optimista mundial',
    color: tokens.scenario.optimistic,
    annualGrowthPct: 3.45,
    aiBoostPp: '+0,95 pp/año IA (+0,80 a +1,10)',
    countriesLabel: 'Escenario global de alta difusión agéntica (Goldman Sachs +7 % PBI)',
    detail: 'Base global 2,50 % + 0,95 pp de IA: despliegue masivo de agentes autónomos e I+D acelerada.'
  }
];

export const GROUP_COMPARISON_RATES: readonly ScopeScenarioRate[] = [
  {
    id: 'base',
    name: 'Como Argentina (fricción +51 %, AIPI 0,47)',
    color: tokens.scenario.pessimistic,
    annualGrowthPct: 2.17,
    aiBoostPp: '+0,17 pp/año IA (rango 0,00 a +0,42 pp)',
    countriesLabel: 'Argentina, Brasil, México (importadores netos de cómputo con alta informalidad)',
    detail: 'Descuento estructural por teorema de Hulten, AIPI 0,47 vs. 0,68, ~45 % de informalidad y recargo impositivo del +48,5 % al +51 % sobre tokens importados.'
  },
  {
    id: 'moderate',
    name: 'Seguidores rápidos (AIPI ~0,60)',
    color: tokens.scenario.expected,
    annualGrowthPct: 2.52,
    aiBoostPp: '+0,52 pp/año IA (rango +0,35 a +0,72 pp)',
    countriesLabel: 'España, Chile, Uruguay (adopción abierta sin aranceles al cómputo)',
    detail: 'Economías integradas que importan tecnología sin sobrecostos cambiarios y capturan ganancias en servicios modernos.'
  },
  {
    id: 'optimistic',
    name: 'Se suben a la ola: Frontera (AIPI 0,68+)',
    color: tokens.scenario.optimistic,
    annualGrowthPct: 3.2,
    aiBoostPp: '+1,40 pp/año IA (rango +0,72 a +1,60 pp)',
    countriesLabel: 'EE. UU., Australia, Alemania (productores de cómputo y modelos frontera)',
    detail: 'Capturan la renta de infraestructura de IA, la compresión del ciclo de I+D y el salto de productividad de Goldman Sachs (+1,5 pp/año).'
  }
];

export function buildScopeIndexSeries(scope: 'world' | 'groups', years: number[]): { unit: string; series: Array<{ name: string; color: string; values: number[] }>; rates: readonly ScopeScenarioRate[] } {
  const rates = scope === 'world' ? WORLD_RATES : GROUP_COMPARISON_RATES;
  const series = rates.map((r) => {
    let level = 100;
    const values = years.map((y, i) => {
      if (i > 0 && y > 2026) level *= 1 + r.annualGrowthPct / 100;
      return Math.round(level * 10) / 10;
    });
    return { name: r.name, color: r.color, values };
  });
  return { unit: 'Índice 2026 = 100 (PBI real)', series, rates };
}

const mid = (r: readonly [number, number]): number => (r[0] + r[1]) / 2;

/** The yearly growth used for a scenario in a year after 2026, % (the middle of the range of its period). */
export const growthIn = (s: AiScenario, year: number): number => mid(year <= 2030 ? s.growth2030 : s.growth2035);

/** What other analysts estimate for the effect of AI on the level of GDP (second pasted report; scope and horizon differ, so they are not one scale). */
export const AI_ANALYSTS: ReadonlyArray<{ who: string; scope: string; horizon: string; effect: string }> = [
  { who: 'Acemoglu (MIT)', scope: 'EE.UU.', horizon: '10 años', effect: '1 a 1,8' },
  { who: 'Penn Wharton Budget Model', scope: 'EE.UU.', horizon: '2035', effect: '1,5' },
  { who: 'Anthropic / Korinek, escenario moderado', scope: 'EE.UU.', horizon: '2030', effect: '1,6' },
  { who: 'Oxford Economics', scope: 'EE.UU.', horizon: '10 años', effect: '3,5' },
  { who: 'CEPR, escenario alto de PTF', scope: 'Mundo', horizon: '10 años', effect: 'casi 4' },
  { who: 'Goldman Sachs', scope: 'Mundo', horizon: '10 años', effect: '7' },
  { who: 'Anthropic / Korinek, escenario sustancial', scope: 'EE.UU.', horizon: '2030', effect: '8,3' },
  { who: 'OMC', scope: 'Mundo', horizon: '2040', effect: '12 a 13' },
  { who: 'PwC', scope: 'Mundo', horizon: '2035', effect: 'hasta 15' },
  { who: 'Anthropic / Korinek, escenario extremo', scope: 'EE.UU.', horizon: '2030', effect: '32,4' }
];

/** The same scenarios for the United States, as the report gives them (a comparison, not a chart). */
export const US_SCENARIOS = [
  { name: 'Base', growth2030: [2.0, 2.3], level2030: [11, 13], growth2035: [1.8, 2.1], aiPoints: [0.1, 0.3] },
  { name: 'Moderado', growth2030: [2.5, 2.9], level2030: [14, 17], growth2035: [2.3, 2.7], aiPoints: [0.4, 0.7] },
  { name: 'Optimista', growth2030: [3.2, 4.0], level2030: [18, 25], growth2035: [2.8, 3.5], aiPoints: [0.4, 0.8] }
] as const;
