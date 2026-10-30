import { AI_EVIDENCE_REFS } from './aiEvidenceRefs.js';

export const EVIDENCE_DATE = '2026-10-30';
const source = (id: string) => {
  const ref = AI_EVIDENCE_REFS.find((r) => r.id === id);
  if (!ref) throw new Error(`Missing AI reference: ${id}`);
  return { name: ref.label, url: ref.url };
};

export interface ApiPrice {
  id: string;
  model: string;
  input: number;
  output: number;
  cached: number | null;
  scope: string;
  ref: string;
  source: { name: string; url: string };
  retrieved_at: string;
}

/** USD per million tokens. Named snapshots, not an assertion of equivalent capabilities. */
export const API_PRICES: readonly ApiPrice[] = [
  { id: 'sonnet', model: 'Claude Sonnet 4.6', input: 3, output: 15, cached: 0.3, scope: 'Standard; caché de lectura, sin escritura', ref: 'AI30', source: source('AI30'), retrieved_at: EVIDENCE_DATE },
  { id: 'sol', model: 'GPT-6.1 Sol', input: 2, output: 10, cached: 0.1, scope: 'Standard; contexto corto', ref: 'AI31', source: source('AI31'), retrieved_at: EVIDENCE_DATE },
  { id: 'gemini', model: 'Gemini 2.5 Pro', input: 1.25, output: 10, cached: 0.125, scope: 'Standard; prompt ≤200.000 tokens; sin almacenamiento', ref: 'AI32', source: source('AI32'), retrieved_at: EVIDENCE_DATE },
  { id: 'grok', model: 'Grok 4.7', input: 2, output: 6, cached: null, scope: 'Tarifa de la ficha del modelo; caché no incluida aquí', ref: 'AI33', source: source('AI33'), retrieved_at: EVIDENCE_DATE }
];

export function apiCost(price: ApiPrice, usage: { input: number; output: number; cached: number }): number {
  if (Object.values(usage).some((v) => !Number.isFinite(v) || v < 0)) throw new RangeError('Token counts must be finite and nonnegative');
  if (usage.cached > 0 && price.cached === null) throw new RangeError('No comparable cache price');
  return (usage.input * price.input + usage.output * price.output + usage.cached * (price.cached ?? 0)) / 1_000_000;
}

/** Explicit absolute surcharge bands, not a ranking of countries or a judgment of service quality. */
export const accessBand = (pct: number | null): 'low' | 'middle' | 'high' | 'missing' => pct === null ? 'missing' : pct < 20 ? 'low' : pct <= 25 ? 'middle' : 'high';

export function paidPopulationShare(subscribers: number, population: number): number {
  if (!Number.isFinite(population) || population <= 0 || !Number.isFinite(subscribers) || subscribers < 0) throw new RangeError('Invalid population ratio');
  return subscribers / population * 100;
}

export const ADOPTION = [
  { label: 'IT: algún uso', value: 77, population: 'Empleados de tecnología, EE. UU.', period: 'Q4 2025', ref: 'AI35', source: source('AI35'), retrieved_at: EVIDENCE_DATE },
  { label: 'IT: uso frecuente', value: 57, population: 'Empleados de tecnología, EE. UU.', period: 'Q4 2025', ref: 'AI35', source: source('AI35'), retrieved_at: EVIDENCE_DATE },
  { label: 'IT: uso diario', value: 31, population: 'Empleados de tecnología, EE. UU.', period: 'Q4 2025', ref: 'AI35', source: source('AI35'), retrieved_at: EVIDENCE_DATE }
] as const;

export const ENTERPRISE = [
  { label: 'Integración profunda', value: 11, ref: 'AI36', source: source('AI36'), period: 'S&P 500, 2025; análisis de 10-K', retrieved_at: EVIDENCE_DATE },
  { label: 'Uso productivo adicional', value: 10, ref: 'AI36', source: source('AI36'), period: 'S&P 500, 2025; categoría separada', retrieved_at: EVIDENCE_DATE },
  { label: 'Sin impacto en productividad', value: 89, ref: 'AI37', source: source('AI37'), period: 'Encuestas de empresas en EE. UU., Reino Unido, Alemania y Australia; nov. 2025–ene. 2026', retrieved_at: EVIDENCE_DATE }
] as const;

export const PERSONAL_USAGE = {
  tokens: 8_000_000_000, days: 30, percentile: null, cacheIncluded: null,
  ratioVsEngineerMedian: 156.8,
  source: { name: 'Consumo personal declarado por el autor en Claude Code, últimos 30 días; conversación del 30-10-2026', url: null },
  retrieved_at: EVIDENCE_DATE,
  note: '8.000 millones de tokens en los últimos 30 días (≈266,7 M/día; 156,8× la mediana de ingeniería P50 = 51 M de Jellyfish). En agentes de consola como Claude Code, ~99,5 % corresponde a lectura de caché e input continuo del código.'
} as const;

export interface TokenPyramidTier {
  id: string;
  tier: string;
  title: string;
  monthlyTokens: string;
  actors: string;
  detail: string;
  ref: string;
}

export const TOKEN_PYRAMID_TIERS: readonly TokenPyramidTier[] = [
  {
    id: 't1',
    tier: 'Nivel 1 · Cúspide 24/7',
    title: 'Enjambres autónomos y loops continuos',
    monthlyTokens: '25.000 M – 100.000 M+ tokens/mes',
    actors: 'Clusters agénticos 24/7 y refactorización masiva sin supervisión humana',
    detail: 'Casos extremos documentados de hasta 99.500 M tokens/mes en ejecución continua multi-agente con ~99,5 % de lectura de caché.',
    ref: 'AI57'
  },
  {
    id: 'author',
    tier: '★ Punto Autor · Últimos 30 días',
    title: '8.000 millones de tokens en 30 días (Claude Code)',
    monthlyTokens: '8.000 M tokens / 30 días (≈266,7 M/día)',
    actors: 'Consumo personal declarado por el autor (30-10-2026)',
    detail: 'Equivale a 156,8 veces la mediana mensual de un ingeniero de software (P50 = 51 M, Jellyfish) y ~5,9 veces el umbral P99 corporativo (1.350 M).',
    ref: 'AI57'
  },
  {
    id: 't2',
    tier: 'Nivel 2 · Frontera / P99',
    title: 'Investigadores de OpenAI e ingenieros P99',
    monthlyTokens: '1.350 M – 5.000 M tokens/mes',
    actors: 'Investigadores internos de OpenAI (P50 >600 USD/día; P90 >7.000 USD/día API) y top 1 % de ingeniería (P99 = 1.350 M)',
    detail: 'Uso de múltiples agentes en paralelo para investigación, pruebas y generación de código.',
    ref: 'AI55'
  },
  {
    id: 't3',
    tier: 'Nivel 3 · P90 Ingeniería',
    title: 'Power users agénticos (planes Max / Ultra)',
    monthlyTokens: '250 M – 1.000 M tokens/mes (P90 = 380 M)',
    actors: 'Top 10 % de desarrolladores profesionales con agentes integrados en consola e IDE',
    detail: 'Telemetría empresarial de Jellyfish ubica el percentil 90 de ingenieros activos en 380 millones de tokens mensuales.',
    ref: 'AI56'
  },
  {
    id: 't4',
    tier: 'Nivel 4 · P50 Ingeniería',
    title: 'Desarrollador profesional activo (mediana)',
    monthlyTokens: '40 M – 150 M tokens/mes (P50 = 51 M)',
    actors: 'Mediana de ingenieros de software en empresas con adopción de herramientas de IA',
    detail: 'Pasó de ~12 M tokens/mes a inicios de 2025 a 51 M tokens/mes en diciembre de 2025 (+4,2× en un año).',
    ref: 'AI56'
  },
  {
    id: 't5',
    tier: 'Nivel 5 · Suscriptor Pro (20 USD)',
    title: 'Profesional con suscripción paga estándar',
    monthlyTokens: '5 M – 30 M tokens/mes',
    actors: '>50 M suscriptores pagos de ChatGPT y planes individuales de 20 USD/mes',
    detail: 'Uso diario de modelos de razonamiento, síntesis documental y asistencia profesional.',
    ref: 'AI38'
  },
  {
    id: 't6',
    tier: 'Nivel 6 · Usuario gratuito / Base',
    title: 'Chat web gratuito (~900 M semanales) y resto del mundo',
    monthlyTokens: '0 a 3 M tokens/mes',
    actors: '>900 M usuarios semanales (mayoría en nivel gratuito) y ~7.200 M de personas sin uso directo de LLMs',
    detail: 'Consultas puntuales en modelos rápidos con límites de contexto y sin ejecución agéntica.',
    ref: 'AI38'
  }
];

export const TOKEN_LOG_BENCHMARKS = [
  { label: 'Chat web gratuito (~2 M)', tokensMillions: 2, exp: 6.3, tone: 'muted' },
  { label: 'Suscriptor Pro 20 USD (~15 M)', tokensMillions: 15, exp: 7.18, tone: 'blue' },
  { label: 'Ingeniero mediana P50 (51 M)', tokensMillions: 51, exp: 7.71, tone: 'blue' },
  { label: 'Ingeniero P90 (380 M)', tokensMillions: 380, exp: 8.58, tone: 'blue' },
  { label: 'Ingeniero P99 (1.350 M)', tokensMillions: 1350, exp: 9.13, tone: 'warning' },
  { label: '★ Autor últimos 30 días (8.000 M)', tokensMillions: 8000, exp: 9.9, tone: 'author' },
  { label: 'Loop autónomo 24/7 (99.500 M)', tokensMillions: 99500, exp: 11.0, tone: 'optimistic' }
] as const;

export const TOKEN_PROVIDERS = [
  { name: 'Claude', figure: 'Distribución por conversación', scope: 'Chat y Cowork: p10, p25, p50, p75 y p90 normalizados por artefacto; no tokens mensuales por persona.', monthlyUserPercentiles: null, ref: 'AI40', source: source('AI40'), retrieved_at: EVIDENCE_DATE },
  { name: 'Grok', figure: 'Tráfico en OpenRouter', scope: 'El estudio incluye modelos de xAI; su muestra de tráfico no equivale al total de usuarios de Grok.', monthlyUserPercentiles: null, ref: 'AI43', source: source('AI43'), retrieved_at: EVIDENCE_DATE },
  { name: 'Cursor', figure: 'Cobro según modelo y plan', scope: 'La documentación detalla precios y límites; no aporta una distribución mensual por usuario comparable.', monthlyUserPercentiles: null, ref: 'AI34', source: source('AI34'), retrieved_at: EVIDENCE_DATE },
  { name: 'Gemini', figure: '>3,2 × 10¹⁵ tokens/mes', scope: 'Google, junio de 2026: conjunto de productos y APIs; no solamente la app Gemini.', monthlyUserPercentiles: null, ref: 'AI41', source: source('AI41'), retrieved_at: EVIDENCE_DATE },
  { name: 'ChatGPT', figure: '>15.000 M tokens/min', scope: 'OpenAI, abril de 2026: tráfico de API; no tráfico exclusivo de ChatGPT.', monthlyUserPercentiles: null, ref: 'AI42', source: source('AI42'), retrieved_at: EVIDENCE_DATE }
] as const;

export const PAID_LLM_WORLD_ESTIMATE = {
  documentedChatGptPaid: 50_000_000,
  estimatedAllLlmPaidRange: [60_000_000, 80_000_000] as const,
  worldPopulation: 8_200_000_000,
  documentedSharePct: 0.61,
  estimatedAllLlmSharePctRange: [0.73, 0.98] as const,
  headline: '0,61 % a ~1 % de la población mundial (50 M a ~80 M de 8.200 M de personas)',
  whyItMatters: 'Quienes pagan una suscripción (~0,61 % documentado en ChatGPT; ~0,7 % a 1 % sumando todos los proveedores) acceden a los modelos verdaderamente inteligentes —razonamiento extendido, ventana de contexto profunda y agentes de código y trabajo autónomo— que incrementan la productividad de forma alta. El ~11 % que usa versiones gratuitas interactúa con modelos acotados de consulta rápida.'
} as const;

export const PYRAMID_LEVELS = [
  { label: 'Suscriptores de consumo de ChatGPT (modelos inteligentes pagos)', count: 50_000_000, qualifier: 'Más de', period: '27-02-2026', ref: 'AI38', note: '0,61 % de la población mundial (>50 M sobre 8.200 M; ~60–80 M o ~0,7–1 % sumando todos los LLMs pagos). Acceden a los modelos de razonamiento profundo y agentes que incrementan de forma alta la productividad.', source: source('AI38'), retrieved_at: EVIDENCE_DATE },
  { label: 'Usuarios semanales de ChatGPT (acceso mayormente gratuito)', count: 900_000_000, qualifier: 'Más de', period: '27-02-2026', ref: 'AI38', note: '≈11 % de la población mundial (>900 M sobre 8.200 M). Incluye usuarios gratuitos y pagos; el uso gratuito tiene límites estrictos de razonamiento y contexto.', source: source('AI38'), retrieved_at: EVIDENCE_DATE },
  { label: 'Población mundial de referencia', count: 8_200_000_000, qualifier: 'Aproximadamente', period: '2024', ref: 'AI39', note: 'Referencia demográfica de la ONU (8.200 millones de personas): cerca del 89 % del mundo aún no usa LLMs de forma semanal y más del 99 % no paga por modelos de frontera.', source: source('AI39'), retrieved_at: EVIDENCE_DATE }
] as const;

export const RESEARCH_PLATFORMS = [
  { platform: 'Preprints.org', count: 31_691, period: '2025', measure: 'Preprints publicados', ref: 'AI45', source: source('AI45'), retrieved_at: EVIDENCE_DATE },
  { platform: 'SocArXiv', count: 3_162, period: '2025', measure: 'Trabajos aceptados', ref: 'AI46', source: source('AI46'), retrieved_at: EVIDENCE_DATE }
] as const;

export const AI_EVIDENCE_SLIDES = [
  { id: 27, title: 'Adopción de IA: de probar a transformar', lead: 'Incluso en IT y en grandes empresas, usar IA no equivale a integrarla en el trabajo', refs: ['AI35', 'AI36', 'AI37'] },
  { id: 28, title: 'Tokens: quién consume y cuánto', lead: 'De la consulta ocasional al flujo agéntico de 8.000 millones de tokens en 30 días', refs: ['AI40', 'AI41', 'AI42', 'AI43', 'AI34', 'AI55', 'AI56', 'AI57', 'AI58'] },
  { id: 26, title: 'La pirámide de adopción de los LLM', lead: 'Menos del 1 % del mundo paga por los modelos verdaderamente inteligentes que multiplican la productividad', refs: ['AI38', 'AI39', 'AI54'] },
  { id: 29, title: 'IA e I+D: más publicaciones, ciclos más cortos', lead: 'La producción de preprints crece; el volumen por sí solo no mide calidad ni causalidad', refs: ['AI44', 'AI45', 'AI46', 'AI47', 'AI55'] }
] as const;
