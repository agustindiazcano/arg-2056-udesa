import { validator } from '../validation/validators';

/** Publisher types in the order of the schema enum (the order of the sections on the page). */
export const PUBLISHER_TYPES = [
  'official',
  'international',
  'peer_reviewed',
  'working_paper',
  'technical_report',
  'company',
  'association',
  'bank',
  'consultancy',
  'think_tank',
  'archive',
  'press'
] as const;

export type PublisherType = (typeof PUBLISHER_TYPES)[number];

export interface ReferenceSource {
  id: string;
  url: string;
  title: string;
  authors_or_publisher: string;
  publisher_type: PublisherType;
  publication_date: string | null;
  retrieved_at: string;
  language: string | null;
  license_or_terms: string | null;
  derived_from: string | null;
  used_by: string[];
  record_count: number;
}

export interface ReferenceLead {
  id: string;
  url: string;
  title: string;
  authors_or_publisher: string;
}

export interface ReferenceAttribution {
  label: 'Terrain' | 'Province boundaries';
  text: string;
  source_url: string | null;
}

export interface ReferenceStats {
  published_files: number;
  records_total: number;
  records_without_url: number;
  sources_used: number;
  retrieved_min: string | null;
  retrieved_max: string | null;
}

export interface References {
  sources: ReferenceSource[];
  leads: ReferenceLead[];
  attributions: ReferenceAttribution[];
  stats: ReferenceStats;
  mock: boolean;
}

const validate = validator<References>('references');

export function parseReferences(json: unknown): References {
  if (!validate(json)) {
    const err = validate.errors?.[0];
    const params = (err?.params ?? {}) as { additionalProperty?: string; missingProperty?: string };
    const name = params.additionalProperty ?? params.missingProperty ?? '';
    throw new Error(`Invalid references data: ${err?.instancePath} ${name} ${err?.message}`);
  }
  return json;
}
