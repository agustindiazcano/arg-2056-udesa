/**
 * The validators of the app: name -> stem of its JSON Schema in data/schemas. scripts/gen-validators.ts compiles each
 * one at build time into src/validation/generated.js, so the browser never compiles a schema (no eval, which the
 * Content-Security-Policy forbids).
 */
export const SCHEMA_FILES = {
  aiEstimates: 'ai_estimates',
  andesEvents: 'andes_events',
  baseRates: 'base_rates',
  composition: 'composition',
  datasetCatalog: 'dataset_catalog',
  economy: 'economy_series',
  externalForecasts: 'external_forecasts',
  forecast: 'forecast_output',
  forecastVintages: 'forecast_vintages',
  geoMeta: 'geo_meta',
  population: 'population',
  productionProjections: 'production_projections',
  projects: 'projects',
  provincesGeo: 'provinces_geo',
  references: 'references',
  terrainMeta: 'terrain_meta'
} as const;

export type SchemaName = keyof typeof SCHEMA_FILES;
