import { errorsText, validator } from '../validation/validators';

const validate = validator<ProjectRecord[]>('projects');

export type ProjectStatus = 'operating' | 'ramp_up' | 'construction' | 'approved' | 'feasibility' | 'prefeasibility' | 'exploration' | 'announced';

export interface ProjectRecord {
  id: string;
  name: string;
  resource: 'lithium' | 'copper' | 'gold' | 'silver' | 'oil' | 'gas' | 'soy' | 'wheat' | 'corn' | 'other';
  geo: string;
  status: ProjectStatus;
  company?: string | null;
  owners?: string[] | null;
  capex_usd: number | null;
  start_year: number | null;
  capacity_per_year: number | null;
  capacity_unit: string | null;
  source: string;
  retrieved_at: string;
  note?: string;
}

export function parseProjects(json: unknown): ProjectRecord[] {
  if (validate(json)) {
    return json;
  }
  throw new Error(`Invalid projects data: ${errorsText(validate.errors)}`);
}

export function selectProjects(
  records: ProjectRecord[],
  filters: { resource?: string; status?: ProjectStatus }
): ProjectRecord[] {
  let filtered = records;
  if (filters.resource) {
    filtered = filtered.filter(r => r.resource === filters.resource);
  }
  if (filters.status) {
    filtered = filtered.filter(r => r.status === filters.status);
  }
  
  return filtered.sort((a, b) => {
    if (a.capex_usd === null && b.capex_usd === null) return 0;
    if (a.capex_usd === null) return 1; // nulls last
    if (b.capex_usd === null) return -1;
    return b.capex_usd - a.capex_usd; // descending
  });
}
