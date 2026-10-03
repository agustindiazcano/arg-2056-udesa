import { describe, it, expect } from 'vitest';
import { formatCitation } from '../../src/references/citation.js';
import { filterReferences, groupByType, resolveDerived } from '../../src/references/selectors.js';
import { parseReferences } from '../../src/types/references.js';
import type { ReferenceSource } from '../../src/types/references.js';

function src(id: string, over: Partial<ReferenceSource> = {}): ReferenceSource {
  return {
    id,
    url: `https://example.com/${id}`,
    title: `Title ${id}`,
    authors_or_publisher: 'Publisher',
    publisher_type: 'official',
    publication_date: '2020-05-01',
    retrieved_at: '2026-01-10',
    language: 'en',
    license_or_terms: null,
    derived_from: null,
    used_by: ['projects.json'],
    record_count: 1,
    ...over
  };
}

describe('filterReferences', () => {
  const list = [
    src('s:1', { title: 'Producción minera 2020', authors_or_publisher: 'Secretaría de Minería', publisher_type: 'official' }),
    src('s:2', { title: 'World Economic Outlook', authors_or_publisher: 'International Monetary Fund', publisher_type: 'international' }),
    src('s:3', { title: 'Lithium report', authors_or_publisher: 'A Consultancy', publisher_type: 'consultancy' })
  ];

  it('matches the title and the publisher, case-insensitively', () => {
    expect(filterReferences(list, { query: 'LITHIUM', types: [] }).map((s) => s.id)).toEqual(['s:3']);
    expect(filterReferences(list, { query: 'monetary', types: [] }).map((s) => s.id)).toEqual(['s:2']);
  });

  it('ignores accents in both the query and the text', () => {
    expect(filterReferences(list, { query: 'produccion', types: [] }).map((s) => s.id)).toEqual(['s:1']);
    expect(filterReferences(list, { query: 'minería', types: [] }).map((s) => s.id)).toEqual(['s:1']);
    expect(filterReferences(list, { query: 'secretaria', types: [] }).map((s) => s.id)).toEqual(['s:1']);
  });

  it('an empty or blank query and an empty type list match everything', () => {
    expect(filterReferences(list, { query: '', types: [] })).toHaveLength(3);
    expect(filterReferences(list, { query: '   ', types: [] })).toHaveLength(3);
  });

  it('filters by publisher type, and by type and query together', () => {
    expect(filterReferences(list, { query: '', types: ['international', 'consultancy'] }).map((s) => s.id)).toEqual(['s:2', 's:3']);
    expect(filterReferences(list, { query: 'report', types: ['consultancy'] }).map((s) => s.id)).toEqual(['s:3']);
    expect(filterReferences(list, { query: 'report', types: ['official'] })).toEqual([]);
  });
});

describe('groupByType', () => {
  it('groups in the order of the schema enum, sorted by normalized title with ties by id, omitting empty groups', () => {
    const list = [
      src('s:5', { publisher_type: 'press', title: 'Zeta' }),
      src('s:3', { publisher_type: 'official', title: 'Árbol' }),
      src('s:2', { publisher_type: 'official', title: 'beta' }),
      src('s:1', { publisher_type: 'official', title: 'beta' }),
      src('s:4', { publisher_type: 'bank', title: 'Only' })
    ];
    const groups = groupByType(list);
    expect(groups.map((g) => g.type)).toEqual(['official', 'bank', 'press']);
    expect(groups[0]!.sources.map((s) => s.id)).toEqual(['s:3', 's:1', 's:2']); // arbol, beta (s:1), beta (s:2)
  });

  it('returns nothing for an empty list', () => {
    expect(groupByType([])).toEqual([]);
  });
});

describe('resolveDerived', () => {
  it('resolves derived_from to the title of the entry when it is in the list, else null', () => {
    const list = [
      src('s:1', { title: 'Original' }),
      src('s:2', { derived_from: 's:1' }),
      src('s:3', { derived_from: 's:99' }),
      src('s:4')
    ];
    expect(resolveDerived(list)).toEqual({ 's:1': null, 's:2': 'Original', 's:3': null, 's:4': null });
  });
});

describe('formatCitation', () => {
  it('formats a full entry exactly', () => {
    expect(formatCitation(src('s:1', { title: 'A report', authors_or_publisher: 'Ministry' }))).toBe(
      'Ministry. A report. 2020. Retrieved 2026-01-10. https://example.com/s:1'
    );
  });

  it('uses n.d. when there is no publication date', () => {
    expect(formatCitation(src('s:1', { publication_date: null }))).toBe(
      'Publisher. Title s:1. n.d. Retrieved 2026-01-10. https://example.com/s:1'
    );
  });

  it('does not double the period when the title already ends with one', () => {
    expect(formatCitation(src('s:1', { title: 'Report v2.' }))).toBe(
      'Publisher. Report v2. 2020. Retrieved 2026-01-10. https://example.com/s:1'
    );
  });
});

describe('parseReferences', () => {
  interface Doc {
    sources: Array<Record<string, unknown>>;
    leads: Array<Record<string, unknown>>;
    attributions: Array<Record<string, unknown>>;
    stats: Record<string, unknown>;
    mock: boolean;
    [key: string]: unknown;
  }
  const valid = (): Doc => ({
    sources: [{ ...src('s:1') }],
    leads: [{ id: 's:2', url: 'https://example.com/2', title: 'T', authors_or_publisher: 'P' }],
    attributions: [{ label: 'Terrain', text: 'x', source_url: null }],
    stats: {
      published_files: 1,
      records_total: 2,
      records_without_url: 0,
      sources_used: 1,
      retrieved_min: '2026-01-10',
      retrieved_max: '2026-01-10'
    },
    mock: false
  });

  it('accepts a valid document', () => {
    expect(parseReferences(valid()).sources[0]!.id).toBe('s:1');
  });

  const bad: Array<[string, (d: Doc) => void, string]> = [
    ['an extra field', (d) => { d.extra = 1; }, 'extra'],
    ['a bad date', (d) => { d.sources[0]!.retrieved_at = '2026-13-45'; }, '/sources/0/retrieved_at'],
    ['an unknown publisher type', (d) => { d.sources[0]!.publisher_type = 'blog'; }, '/sources/0/publisher_type'],
    ['a missing used_by', (d) => { delete d.sources[0]!.used_by; }, 'used_by'],
    ['a negative record_count', (d) => { d.sources[0]!.record_count = -1; }, '/sources/0/record_count'],
    ['an invalid attribution label', (d) => { d.attributions[0]!.label = 'Other'; }, '/attributions/0/label'],
    ['a missing stats', (d) => { delete d.stats; }, 'stats']
  ];

  it.each(bad)('rejects %s naming the field', (_name, mutate, fragment) => {
    const doc = valid();
    mutate(doc);
    expect(() => parseReferences(doc)).toThrow('Invalid references data');
    expect(() => parseReferences(doc)).toThrow(fragment);
  });

  it('rejects something that is not an object', () => {
    expect(() => parseReferences(null)).toThrow('Invalid references data');
  });
});
