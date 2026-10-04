import { validator } from '../validation/validators';
import type { ProvinceId, Scenario } from './index.js';

const validate = validator<ForecastOutput>('forecast');

export type Indicator = 'gdp_constant_usd' | 'gdp_per_capita_usd' | 'population' | 'hdi' | 'resource_production';
export type ResourceId = 'lithium' | 'copper' | 'gold' | 'silver' | 'oil' | 'gas' | 'soy' | 'wheat' | 'corn' | 'other';
export type AiOverlay = 'off' | 'on';

export interface ForecastPoint {
  year: number;
  p10: number;
  p50: number;
  p90: number;
}

export interface ForecastSeries {
  indicator: Indicator;
  resource?: ResourceId;
  geo: 'AR' | ProvinceId;
  scenario: Scenario;
  ai_overlay: AiOverlay;
  unit: string;
  points: ForecastPoint[];
}

export interface ForecastOutput {
  model_version: string;
  generated_at: string;
  source: string;
  horizon: {
    start_year: number;
    end_year: number;
  };
  series: ForecastSeries[];
}

export function parseForecastOutput(json: unknown): ForecastOutput {
  if (!validate(json)) {
    const err = validate.errors?.[0];
    throw new Error(`Forecast validation failed: ${err?.instancePath} ${err?.message}`);
  }
  return json;
}

export function selectSeries(
  out: ForecastOutput,
  q: {
    indicator: Indicator;
    resource?: ResourceId;
    geo: 'AR' | ProvinceId;
    scenario: Scenario;
    aiOverlay: AiOverlay;
  }
): ForecastSeries | undefined {
  return out.series.find(s => 
    s.indicator === q.indicator &&
    s.resource === q.resource &&
    s.geo === q.geo &&
    s.scenario === q.scenario &&
    s.ai_overlay === q.aiOverlay
  );
}
