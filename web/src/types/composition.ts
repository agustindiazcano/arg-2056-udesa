import { errorsText, validator } from '../validation/validators';

const validate = validator<CompositionRecord[]>('composition');

export type CompositionKind = 'gdp_by_sector' | 'exports_by_product';

export interface CompositionRecord {
  kind: CompositionKind;
  year: number;
  group: string;
  category: string;
  label: string;
  value_usd: number | null;
  source: string;
  retrieved_at: string;
  note?: string;
}

export function parseComposition(json: unknown): CompositionRecord[] {
  if (validate(json)) {
    return json;
  }
  throw new Error(`Invalid composition data: ${errorsText(validate.errors)}`);
}

export function selectComposition(
  records: CompositionRecord[],
  filters: { kind: CompositionKind; year: number }
): CompositionRecord[] {
  return records.filter(r => r.kind === filters.kind && r.year === filters.year);
}
