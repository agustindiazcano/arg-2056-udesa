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
  source: { name: 'Consumo personal declarado por el autor, últimos 30 días; conversación del 30-10-2026', url: null },
  retrieved_at: EVIDENCE_DATE,
  note: 'Sin desglose entre entrada, salida y caché. No se convierte a factura API ni se extrapola a otros usuarios.'
} as const;

export const TOKEN_PROVIDERS = [
  { name: 'Claude', figure: 'Distribución por conversación', scope: 'Chat y Cowork: p10, p25, p50, p75 y p90 normalizados por artefacto; no tokens mensuales por persona.', monthlyUserPercentiles: null, ref: 'AI40', source: source('AI40'), retrieved_at: EVIDENCE_DATE },
  { name: 'Grok', figure: 'Tráfico en OpenRouter', scope: 'El estudio incluye modelos de xAI; su muestra de tráfico no equivale al total de usuarios de Grok.', monthlyUserPercentiles: null, ref: 'AI43', source: source('AI43'), retrieved_at: EVIDENCE_DATE },
  { name: 'Cursor', figure: 'Cobro según modelo y plan', scope: 'La documentación detalla precios y límites; no aporta una distribución mensual por usuario comparable.', monthlyUserPercentiles: null, ref: 'AI34', source: source('AI34'), retrieved_at: EVIDENCE_DATE },
  { name: 'Gemini', figure: '>3,2 × 10¹⁵ tokens/mes', scope: 'Google, junio de 2026: conjunto de productos y APIs; no solamente la app Gemini.', monthlyUserPercentiles: null, ref: 'AI41', source: source('AI41'), retrieved_at: EVIDENCE_DATE },
  { name: 'ChatGPT', figure: '>15.000 M tokens/min', scope: 'OpenAI, abril de 2026: tráfico de API; no tráfico exclusivo de ChatGPT.', monthlyUserPercentiles: null, ref: 'AI42', source: source('AI42'), retrieved_at: EVIDENCE_DATE }
] as const;

export const PYRAMID_LEVELS = [
  { label: 'Suscriptores de consumo de ChatGPT', count: 50_000_000, qualifier: 'Más de', period: '27-02-2026', ref: 'AI38', note: 'Incluye planes de consumo pagos; la fuente no los separa por precio ni proveedor competidor.', source: source('AI38'), retrieved_at: EVIDENCE_DATE },
  { label: 'Usuarios semanales de ChatGPT', count: 900_000_000, qualifier: 'Más de', period: '27-02-2026', ref: 'AI38', note: 'Incluye usuarios gratuitos y pagos; no se suma con otras plataformas.', source: source('AI38'), retrieved_at: EVIDENCE_DATE },
  { label: 'Población mundial de referencia', count: 8_200_000_000, qualifier: 'Aproximadamente', period: '2024', ref: 'AI39', note: 'Referencia demográfica anterior a las métricas del producto; razón de escala, no tasa de adopción mundial de todos los LLM.', source: source('AI39'), retrieved_at: EVIDENCE_DATE }
] as const;

export const RESEARCH_PLATFORMS = [
  { platform: 'Preprints.org', count: 31_691, period: '2025', measure: 'Preprints publicados', ref: 'AI45', source: source('AI45'), retrieved_at: EVIDENCE_DATE },
  { platform: 'SocArXiv', count: 3_162, period: '2025', measure: 'Trabajos aceptados', ref: 'AI46', source: source('AI46'), retrieved_at: EVIDENCE_DATE }
] as const;

export const AI_EVIDENCE_SLIDES = [
  { id: 27, title: 'Adopción de IA: de probar a transformar', lead: 'Incluso en IT y en grandes empresas, usar IA no equivale a integrarla en el trabajo', refs: ['AI35', 'AI36', 'AI37'] },
  { id: 28, title: 'Tokens: quién consume y cuánto', lead: 'Usuarios, conversaciones y tráfico de API son unidades distintas', refs: ['AI40', 'AI41', 'AI42', 'AI43', 'AI34', 'AI55'] },
  { id: 26, title: 'La pirámide de adopción de los LLM', lead: 'Acceso masivo, suscripciones concentradas: una vista de escala con cifras publicadas', refs: ['AI38', 'AI39', 'AI54'] },
  { id: 29, title: 'IA e I+D: más publicaciones, ciclos más cortos', lead: 'La producción de preprints crece; el volumen por sí solo no mide calidad ni causalidad', refs: ['AI44', 'AI45', 'AI46', 'AI47', 'AI55'] }
] as const;
