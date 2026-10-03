export interface ResourceProductionRecord {
  resource: string;
  geo: string;
  year: number;
  value: number | null;
  unit: string;
  source: string;
  retrieved_at: string;
  note?: string;
}

export function parseResourceProduction(json: any): ResourceProductionRecord[] {
  // Simple passthrough since schema validation is done offline by Python checks
  return json as ResourceProductionRecord[];
}
