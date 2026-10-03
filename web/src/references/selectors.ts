import { PUBLISHER_TYPES } from '../types/references.js';
import type { PublisherType, ReferenceSource } from '../types/references.js';

/** Lowercase text without accents, for searching and sorting. */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export function filterReferences(
  sources: ReferenceSource[],
  q: { query: string; types: PublisherType[] }
): ReferenceSource[] {
  const needle = normalizeText(q.query.trim());
  return sources.filter((s) => {
    if (q.types.length > 0 && !q.types.includes(s.publisher_type)) return false;
    if (needle === '') return true;
    return normalizeText(s.title).includes(needle) || normalizeText(s.authors_or_publisher).includes(needle);
  });
}

function compare(a: ReferenceSource, b: ReferenceSource): number {
  const ta = normalizeText(a.title);
  const tb = normalizeText(b.title);
  if (ta !== tb) return ta < tb ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Groups in the order of the schema enum; each group sorted by normalized title, ties by id; empty groups omitted. */
export function groupByType(sources: ReferenceSource[]): Array<{ type: PublisherType; sources: ReferenceSource[] }> {
  return PUBLISHER_TYPES.map((type) => ({
    type,
    sources: sources.filter((s) => s.publisher_type === type).sort(compare)
  })).filter((g) => g.sources.length > 0);
}

/** For each entry, the title of the entry that `derived_from` points to when it is in the list, else null. */
export function resolveDerived(sources: ReferenceSource[]): Record<string, string | null> {
  const titles = new Map(sources.map((s) => [s.id, s.title]));
  return Object.fromEntries(sources.map((s) => [s.id, s.derived_from ? (titles.get(s.derived_from) ?? null) : null]));
}
