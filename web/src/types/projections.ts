import { errorsText, validator } from '../validation/validators';


export type EntityType = 'project' | 'province' | 'national';
export type ProjectionMetric = 'capacity_nameplate' | 'production_expected' | 'guidance' | 'forecast';
export type ProjectionUnit = 't_per_year' | 'oz_per_year' | 'bbl_per_day' | 'mm3_per_day' | 'mtpa' | 't' | 'ha' | 'other';
export type ProjectionScenario = 'base' | 'low' | 'high' | 'not_stated';
export type Confidence = 'high' | 'medium' | 'low';

export interface ProductionProjection {
  entity_type: EntityType;
  project_id?: string | null;
  geo: string;
  resource: 'lithium' | 'copper' | 'gold' | 'silver' | 'oil' | 'gas' | 'soy' | 'wheat' | 'corn' | 'other';
  metric: ProjectionMetric;
  year: number;
  period_label?: string | null;
  value?: number | null;
  value_low?: number | null;
  value_high?: number | null;
  unit: ProjectionUnit;
  unit_basis?: string | null;
  scenario: ProjectionScenario;
  stage_as_of?: string | null;
  assumptions?: string | null;
  source: string;
  source_url?: string | null;
  locator?: string | null;
  confidence?: Confidence;
  retrieved_at: string;
  note?: string;
}

const validate = validator<ProductionProjection[]>('productionProjections');

export function parseProductionProjections(json: unknown): ProductionProjection[] {
  if (validate(json)) {
    return json;
  }
  throw new Error(`Invalid production projections data: ${errorsText(validate.errors)}`);
}

export function selectProjections(
  records: ProductionProjection[],
  filters: {
    entityType?: EntityType;
    projectId?: string;
    geo?: string;
    resource?: string;
    metric?: ProjectionMetric;
    scenario?: ProjectionScenario;
  }
): ProductionProjection[] {
  let filtered = records;
  if (filters.entityType) {
    filtered = filtered.filter(r => r.entity_type === filters.entityType);
  }
  if (filters.projectId) {
    filtered = filtered.filter(r => r.project_id === filters.projectId);
  }
  if (filters.geo) {
    filtered = filtered.filter(r => r.geo === filters.geo);
  }
  if (filters.resource) {
    filtered = filtered.filter(r => r.resource === filters.resource);
  }
  if (filters.metric) {
    filtered = filtered.filter(r => r.metric === filters.metric);
  }
  if (filters.scenario) {
    filtered = filtered.filter(r => r.scenario === filters.scenario);
  }

  // sorted by year ascending, then by source
  return filtered.sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    return a.source.localeCompare(b.source);
  });
}

export function groupBySource(records: ProductionProjection[]): Record<string, ProductionProjection[]> {
  const map: Record<string, ProductionProjection[]> = {};
  for (const r of records) {
    const list = map[r.source] || [];
    list.push(r);
    map[r.source] = list;
  }
  return map;
}
