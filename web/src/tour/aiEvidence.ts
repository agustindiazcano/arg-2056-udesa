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
  note: '8.000 millones de tokens en los últimos 30 días en Claude Code (≈266,7 M/día; 156,8× la mediana de ingeniería P50 = 51 M de Jellyfish).'
} as const;

export interface TokenPyramidTier {
  id: string;
  tier: string;
  title: string;
  monthlyTokens: string;
  actors: string;
  detail: string;
  refs: readonly string[];
}

export const TOKEN_PYRAMID_TIERS: readonly TokenPyramidTier[] = [
  {
    id: 't1',
    tier: 'Nivel 1 · Cúspide 24/7',
    title: 'Enjambres autónomos y loops continuos',
    monthlyTokens: '25.000 M – 100.000 M+ / mes',
    actors: 'Clusters agénticos 24/7 y refactorización continua sin intervención humana',
    detail: 'Casos extremos documentados de hasta 99.500–100.000 M tokens/mes (top usuario público citado por OpenAI y telemetría de loops multi-agente continuos con ~99,5 % de lectura de caché).',
    refs: ['AI57', 'AI70', 'AI72']
  },
  {
    id: 't2',
    tier: 'Nivel 2 · Frontera / P99',
    title: 'Cola extrema P99 de ingeniería e investigadores de frontera',
    monthlyTokens: '1.350 M – 5.000 M / mes',
    actors: 'P99 corporativo (≥1.350 M), top 2 % de ingeniería (~2.000–2.200 M/mes) y P99 de Claude Code (~4.800 M/mes)',
    detail: 'Respaldado por Jellyfish (umbral P99 = 1.350 M; quintil empresarial más intensivo ≈ 2.500 M/mes por desarrollador; top 2 % ≈ 500 M/semana; P99 de gasto ≈ 2.452 USD/mes), VibeCafé (P95–P99 general: 1.900–7.400 M/mes; P99 en Claude Code ≈ 4.800 M/mes) y OpenAI/Epoch AI (investigadores internos: P50 >600 USD/día y P90 >7.000 USD/día API).',
    refs: ['AI55', 'AI68', 'AI69', 'AI70', 'AI72', 'AI73']
  },
  {
    id: 't3',
    tier: 'Nivel 3 · P90 Ingeniería',
    title: 'Power users agénticos (planes Max / Ultra / Enterprise)',
    monthlyTokens: '250 M – 1.000 M / mes (P90 = 380 M)',
    actors: 'Top 10 % de desarrolladores profesionales con agentes en consola e IDE',
    detail: 'Telemetría empresarial de Jellyfish ubica el P90 en 380 M tokens/mes. Según Cursor Insights, el 10 % superior de usuarios concentra cerca de 2/3 de todos los tokens consumidos.',
    refs: ['AI56', 'AI68', 'AI71', 'AI74']
  },
  {
    id: 't4',
    tier: 'Nivel 4 · P50 Ingeniería',
    title: 'Desarrollador profesional activo (mediana corporativa)',
    monthlyTokens: '40 M – 150 M / mes (P50 = 51 M)',
    actors: 'Mediana de ingenieros de software en empresas con herramientas de IA',
    detail: 'Jellyfish registra una mediana P50 = 51 M tokens/mes (~81 USD/mes; más de la mitad bajo 100 USD/mes). Anthropic documenta un promedio enterprise en Claude Code de ~13 USD/día activo (~150–250 USD/mes, con 90 % bajo 30 USD/día).',
    refs: ['AI56', 'AI57', 'AI68', 'AI73']
  },
  {
    id: 't5',
    tier: 'Nivel 5 · Suscriptor Pro',
    title: 'Profesional con suscripción paga estándar (20 USD)',
    monthlyTokens: '5 M – 30 M / mes',
    actors: 'Suscriptores pagos de ChatGPT, Claude Pro, Gemini Advanced y Copilot',
    detail: 'Uso diario de modelos de razonamiento, síntesis documental y asistencia profesional (~75–100 M de personas en el mundo).',
    refs: ['AI38', 'AI30', 'AI32']
  },
  {
    id: 't6',
    tier: 'Nivel 6 · Base gratuita',
    title: 'Chat web gratuito y resto del mundo',
    monthlyTokens: '0 a 3 M / mes',
    actors: '>1.200 M usuarios gratuitos de LLMs y población sin uso directo',
    detail: 'Consultas puntuales en modelos rápidos con límites de contexto y sin ejecución agéntica.',
    refs: ['AI66', 'AI38']
  }
];

export const TOKEN_LOG_BENCHMARKS = [
  { label: 'Chat web gratuito (~2 M)', tokensMillions: 2, exp: 6.3, tone: 'muted' },
  { label: 'Suscriptor Pro 20 USD (~15 M)', tokensMillions: 15, exp: 7.18, tone: 'blue' },
  { label: 'Ingeniero mediana P50 Jellyfish (51 M)', tokensMillions: 51, exp: 7.71, tone: 'blue' },
  { label: 'Ingeniero P90 Jellyfish (380 M)', tokensMillions: 380, exp: 8.58, tone: 'blue' },
  { label: 'Umbral P99 corporativo Jellyfish (1.350 M)', tokensMillions: 1350, exp: 9.13, tone: 'warning' },
  { label: 'Quintil superior Jellyfish (~2.500 M)', tokensMillions: 2500, exp: 9.4, tone: 'warning' },
  { label: 'Claude Code P99 VibeCafé (~4.800 M)', tokensMillions: 4800, exp: 9.68, tone: 'author' },
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
  estimatedAllLlmPaidRange: [75_000_000, 100_000_000] as const,
  worldPopulation: 8_200_000_000,
  documentedSharePct: 0.61,
  estimatedAllLlmSharePctRange: [0.91, 1.22] as const,
  headline: '0,61 % piso documentado (>50 M en ChatGPT) a ~0,9–1,2 % estimado global (~75–100 M sumando Claude, Gemini, Copilot y Cursor sobre 8.200 M)',
  whyItMatters: 'Quienes pagan una suscripción (~0,61 % documentado en ChatGPT; ~0,9 % a 1,2 % o ~75–100 M sumando Claude Pro/Max, Gemini Advanced, Microsoft Copilot, Cursor y Perplexity) acceden a los modelos verdaderamente inteligentes —razonamiento extendido, contexto profundo y agentes de código— que incrementan la productividad de forma alta. En el mercado empresarial de LLMs, Anthropic Claude lidera con ~40 %, seguido por OpenAI (~27 %) y Google Gemini (~21 %) según Menlo Ventures.'
} as const;

export const PYRAMID_LEVELS = [
  {
    label: 'Cúspide agéntica y planes Pro / Max / API (Claude Code, Cursor, ChatGPT Pro, Gemini, Copilot)',
    shortTitle: 'Cúspide agéntica y empresarial (Claude ~40 %, OpenAI ~27 %, Gemini ~21 %)',
    shareBadge: '~0,1–0,2 % del mundo (~8–16 M) · Piso pago >50 M (0,61 %)',
    count: 50_000_000,
    qualifier: 'Más de',
    period: '2025–2026',
    ref: 'AI67',
    note: 'En adopción empresarial y programación agéntica, Anthropic Claude lidera con ~40 % de cuota, seguido por OpenAI (~27 %) y Google Gemini (~21 %) según Menlo Ventures (2025). Incluye planes Max/Pro de 100–200 USD, Cursor y uso intensivo de API.',
    source: source('AI67'),
    retrieved_at: EVIDENCE_DATE
  },
  {
    label: 'Suscriptores pagos de modelos de lenguaje (ChatGPT Plus, Claude Pro, Gemini Advanced, Copilot Pro)',
    shortTitle: 'Suscriptores pagos de LLMs (~75–100 M globales; >50 M en ChatGPT)',
    shareBadge: '0,61 % piso a ~0,9–1,2 % del mundo (~75–100 M)',
    count: 85_000_000,
    qualifier: 'Alrededor de',
    period: '2026',
    ref: 'AI38',
    note: '0,61 % de la población mundial documentado solo en ChatGPT (>50 M sobre 8.200 M) y ~0,9–1,2 % (~75–100 M) sumando Claude Pro/Team, Google One AI Premium (Gemini), Microsoft 365 Copilot y Perplexity. Acceden a los modelos verdaderamente inteligentes que incrementan la productividad de forma alta.',
    source: source('AI38'),
    retrieved_at: EVIDENCE_DATE
  },
  {
    label: 'Usuarios gratuitos de modelos de lenguaje (ChatGPT, Gemini, Meta AI, Copilot, Claude, DeepSeek)',
    shortTitle: 'Usuarios gratuitos de LLMs (ChatGPT, Gemini, Meta AI, Copilot, DeepSeek)',
    shareBadge: '~15 %–18 % del mundo (~1.200–1.500 M personas)',
    count: 1_300_000_000,
    qualifier: 'Alrededor de',
    period: '2026',
    ref: 'AI66',
    note: 'El Microsoft AI Economy Institute (2026) estima que el 18,8 % de la población mundial en edad activa utiliza IA generativa (~1.200–1.500 M de personas entre ChatGPT >900 M semanales, Gemini, Meta AI, Copilot, Claude y DeepSeek), con brecha entre Norte Global (28,8 %) y Sur Global (16,2 %).',
    source: source('AI66'),
    retrieved_at: EVIDENCE_DATE
  },
  {
    label: 'Población mundial fuera de los LLM (sobre 8.200 M de habitantes)',
    shortTitle: 'Población mundial sin uso de LLMs (~6.700–7.000 M de 8.200 M)',
    shareBadge: '~82 %–85 % sin uso directo (base 8.200 M ONU)',
    count: 8_200_000_000,
    qualifier: 'Aproximadamente',
    period: '2024',
    ref: 'AI39',
    note: 'Referencia demográfica de la ONU (8.200 millones de habitantes): entre 82 % y 85 % de la población mundial aún no utiliza modelos de lenguaje y cerca del 99 % no accede a modelos pagos de frontera.',
    source: source('AI39'),
    retrieved_at: EVIDENCE_DATE
  }
] as const;

export const RESEARCH_PLATFORMS = [
  { platform: 'Preprints.org', count: 31_691, period: '2025', measure: 'Preprints publicados', ref: 'AI45', source: source('AI45'), retrieved_at: EVIDENCE_DATE },
  { platform: 'SocArXiv', count: 3_162, period: '2025', measure: 'Trabajos aceptados', ref: 'AI46', source: source('AI46'), retrieved_at: EVIDENCE_DATE }
] as const;

export const AI_EVIDENCE_SLIDES = [
  { id: 27, title: 'Adopción de IA: de probar a transformar', lead: 'Incluso en IT y en grandes empresas, usar IA no equivale a integrarla en el trabajo', refs: ['AI35', 'AI36', 'AI37'] },
  { id: 28, title: 'Tokens: quién consume y cuánto', lead: 'Pirámide triangular de consumo mensual de tokens: de la consulta gratuita a la cola P99 y agentes 24/7', refs: ['AI40', 'AI41', 'AI42', 'AI43', 'AI34', 'AI55', 'AI56', 'AI57', 'AI58', 'AI66', 'AI68', 'AI69', 'AI70', 'AI71', 'AI72', 'AI73', 'AI74'] },
  { id: 26, title: 'La pirámide de adopción de los LLM', lead: 'ChatGPT, Claude, Gemini, Copilot, Meta AI y DeepSeek: menos del 1,2 % del mundo paga por los modelos que multiplican la productividad', refs: ['AI38', 'AI39', 'AI66', 'AI67', 'AI30', 'AI32', 'AI54'] },
  { id: 29, title: 'IA e I+D: más publicaciones, ciclos más cortos', lead: 'La producción de preprints crece; el volumen por sí solo no mide calidad ni causalidad', refs: ['AI44', 'AI45', 'AI46', 'AI47', 'AI55'] }
] as const;
