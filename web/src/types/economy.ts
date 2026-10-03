import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schema from '../../../data/schemas/economy_series.schema.json' with { type: 'json' };

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile<EconomyRecord[]>(schema);

export type EconomyIndicator =
  | 'gdp_constant_usd'
  | 'gdp_per_capita_usd'
  | 'population'
  | 'hdi'
  | 'exports_usd'
  | 'imports_usd';

export interface EconomyRecord {
  country: string;
  year: number;
  indicator: EconomyIndicator;
  value: number | null;
  unit: string;
  source: string;
  retrieved_at: string;
  note?: string;
}

export function parseEconomySeries(json: unknown): EconomyRecord[] {
  if (validate(json)) {
    return json;
  }
  throw new Error(`Invalid economy data: ${ajv.errorsText(validate.errors)}`);
}
