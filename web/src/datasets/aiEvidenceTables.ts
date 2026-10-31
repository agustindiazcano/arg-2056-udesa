import type { DataTable } from './types.js';
import { ADOPTION, API_PRICES, ENTERPRISE, PERSONAL_USAGE, PYRAMID_LEVELS, RESEARCH_PLATFORMS, TOKEN_PROVIDERS, TOKEN_PYRAMID_TIERS } from '../tour/aiEvidence.js';
import arxiv from '../tour/aiResearchCounts.json';

export const apiPricesTable = (): DataTable => ({
  id: 'ai-api-prices', title: 'Precios de API: USD por millón de tokens, antes de impuestos',
  columns: ['Modelo', 'Entrada', 'Salida', 'Lectura de caché', 'Condiciones', 'Fuente', 'Consulta'],
  rows: API_PRICES.map((r) => [r.model, r.input, r.output, r.cached, r.scope, r.source.url, r.retrieved_at])
});

export function aiEvidenceTables(step: number): DataTable[] {
  if (step === 27) return [{
    id: 'ai-enterprise-adoption', title: 'Adopción y resultados: muestras y definiciones diferentes',
    columns: ['Indicador', 'Porcentaje', 'Población / alcance', 'Período', 'Fuente', 'Consulta'],
    rows: [...ADOPTION.map((r) => [r.label, r.value, r.population, r.period, r.source.url, r.retrieved_at]), ...ENTERPRISE.map((r) => [r.label, r.value, r.period, '2025–2026; ver alcance', r.source.url, r.retrieved_at])]
  }];
  if (step === 28) return [{
    id: 'ai-token-pyramid', title: 'Pirámide de consumo mensual de tokens por nivel (telemetría empresarial e investigación)',
    columns: ['Nivel', 'Rango mensual', 'Título', 'Actores y alcance', 'Detalle metodológico', 'Fuentes', 'Consulta'],
    rows: TOKEN_PYRAMID_TIERS.map((t) => [t.tier, t.monthlyTokens, t.title, t.actors, t.detail, t.refs.join(', '), '2026-10-30'])
  }, {
    id: 'ai-token-publications', title: 'Métricas públicas de tokens: no comparables entre productos',
    columns: ['Producto', 'Métrica', 'Alcance', 'Percentiles mensuales por usuario', 'Fuente', 'Consulta'],
    rows: TOKEN_PROVIDERS.map((r) => [r.name, r.figure, r.scope, r.monthlyUserPercentiles, r.source.url, r.retrieved_at])
  }, {
    id: 'ai-token-percentiles', title: 'Investigadores de OpenAI: consumo equivalente a precios API, agosto 2026',
    columns: ['Percentil', 'Umbral inferior (USD/día)', 'Unidad', 'Alcance', 'Fuente', 'Consulta'],
    rows: [[50, 600, 'Más de USD equivalentes de API por día; no tokens ni factura', 'Investigadores internos de OpenAI', 'https://openai.com/index/research-acceleration-view-inside-openai/', '2026-10-30'], [90, 7000, 'Más de USD equivalentes de API por día; no tokens ni factura', 'Investigadores internos de OpenAI', 'https://openai.com/index/research-acceleration-view-inside-openai/', '2026-10-30']]
  }, {
    id: 'ai-personal-tokens', title: 'Observación personal declarada, sin percentil poblacional',
    columns: ['Tokens', 'Ventana (días)', 'Caché incluida', 'Percentil', 'Nota', 'Fuente', 'Consulta'],
    rows: [[PERSONAL_USAGE.tokens, PERSONAL_USAGE.days, PERSONAL_USAGE.cacheIncluded, PERSONAL_USAGE.percentile, PERSONAL_USAGE.note, PERSONAL_USAGE.source.name, PERSONAL_USAGE.retrieved_at]]
  }];
  if (step === 26) return [{
    id: 'ai-adoption-pyramid', title: 'Pirámide de adopción global de modelos de lenguaje (ChatGPT, Claude, Gemini, Copilot, Meta AI, DeepSeek) y población mundial',
    columns: ['Nivel', 'Cantidad', 'Calificador', 'Fecha', 'Definición', 'Fuente', 'Consulta'],
    rows: PYRAMID_LEVELS.map((r) => [r.label, r.count, r.qualifier, r.period, r.note, r.source.url, r.retrieved_at])
  }];
  return [{
    id: 'ai-research-arxiv', title: 'arXiv: nuevos envíos anuales, años completos',
    columns: ['Año', 'Nuevos envíos', 'Fuente', 'Consulta'],
    rows: arxiv.map((r) => [r.year, r.count, r.source.url, r.retrieved_at])
  }, {
    id: 'ai-research-platforms', title: 'Otros repositorios de preprints, 2025; no sumables entre sí',
    columns: ['Plataforma', 'Cantidad', 'Año', 'Qué se cuenta', 'Fuente', 'Consulta'],
    rows: RESEARCH_PLATFORMS.map((r) => [r.platform, r.count, r.period, r.measure, r.source.url, r.retrieved_at])
  }];
}
