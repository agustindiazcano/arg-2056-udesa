import { errorsText, validator } from '../validation/validators';

const validate = validator<EconomyRecord[]>('economy');

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
  throw new Error(`Invalid economy data: ${errorsText(validate.errors)}`);
}
