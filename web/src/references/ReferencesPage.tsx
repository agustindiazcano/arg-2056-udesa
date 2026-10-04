import React, { useEffect, useMemo, useRef, useState } from 'react';
import { parseReferences, PUBLISHER_TYPES } from '../types/references.js';
import type { PublisherType, ReferenceSource, References } from '../types/references.js';
import { formatCitation } from './citation.js';
import { VisitsSection } from '../analytics/VisitsSection.js';
import { filterReferences, groupByType, resolveDerived } from './selectors.js';

const TYPE_LABEL: Record<PublisherType, string> = {
  official: 'Official',
  international: 'International',
  peer_reviewed: 'Peer reviewed',
  working_paper: 'Working paper',
  technical_report: 'Technical report',
  company: 'Company',
  association: 'Association',
  bank: 'Bank',
  consultancy: 'Consultancy',
  think_tank: 'Think tank',
  archive: 'Archive',
  press: 'Press'
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

type CopyState = 'copied' | 'failed';

function Entry({
  source,
  derivedTitle,
  anchorsInList,
  copy,
  onCopy
}: {
  source: ReferenceSource;
  derivedTitle: string | null;
  anchorsInList: boolean;
  copy: CopyState | undefined;
  onCopy: (source: ReferenceSource) => void;
}) {
  return (
    <article id={source.id} style={{ borderTop: '1px solid var(--border)', padding: 'var(--space-md) 0' }}>
      <h3 style={{ margin: 0, fontSize: 'var(--font-base)' }}>
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          {source.title}
        </a>
      </h3>
      <div>{source.authors_or_publisher}</div>
      <div style={{ color: 'var(--ink-2)' }}>
        {source.publication_date ? `Published ${source.publication_date}` : 'date not stated'}
      </div>
      <div style={{ color: 'var(--ink-2)' }}>{`Retrieved ${source.retrieved_at}`}</div>
      {source.language !== null && <div style={{ color: 'var(--ink-2)' }}>{`Language: ${source.language}`}</div>}
      {source.license_or_terms !== null && (
        <div style={{ color: 'var(--ink-2)' }}>{`License: ${source.license_or_terms}`}</div>
      )}
      {source.derived_from !== null &&
        (derivedTitle !== null && anchorsInList ? (
          <div style={{ color: 'var(--ink-2)' }}>
            Derived from <a href={`#${source.derived_from}`}>{derivedTitle}</a>
          </div>
        ) : (
          <div style={{ color: 'var(--ink-2)' }}>{`Derived from ${source.derived_from}`}</div>
        ))}
      <div style={{ color: 'var(--ink-2)' }}>{`Used by: ${source.used_by.join(', ')}`}</div>
      <div data-print="hide">
        <button onClick={() => onCopy(source)}>Copy citation</button>{' '}
        <span aria-live="polite">{copy === 'copied' ? 'Copied' : copy === 'failed' ? 'Could not copy' : ''}</span>
      </div>
    </article>
  );
}

/** `extra` is shown after the sources, before the link back to the app (the visits section). */
export function ReferencesPage({ references, extra }: { references: References; extra?: React.ReactNode }) {
  const { sources, leads, attributions, stats, mock } = references;
  const [query, setQuery] = useState('');
  const [types, setTypes] = useState<PublisherType[]>([]);
  const [copies, setCopies] = useState<Record<string, CopyState>>({});
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const filtered = useMemo(() => filterReferences(sources, { query, types }), [sources, query, types]);
  const groups = useMemo(() => groupByType(filtered), [filtered]);
  const derived = useMemo(() => resolveDerived(sources), [sources]);
  const ids = useMemo(() => new Set(filtered.map((s) => s.id)), [filtered]);
  const presentTypes = PUBLISHER_TYPES.filter((t) => sources.some((s) => s.publisher_type === t));

  const copy = async (source: ReferenceSource) => {
    let result: CopyState = 'copied';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(formatCitation(source));
    } catch {
      result = 'failed';
    }
    setCopies((current) => ({ ...current, [source.id]: result }));
    timers.current.push(
      window.setTimeout(() => {
        setCopies((current) => {
          const { [source.id]: _gone, ...rest } = current;
          return rest;
        });
      }, 2500)
    );
  };

  const toggleType = (type: PublisherType) =>
    setTypes((current) => (current.includes(type) ? current.filter((t) => t !== type) : [...current, type]));

  const n = stats.sources_used;
  const range =
    stats.retrieved_min !== null && stats.retrieved_max !== null
      ? ` Retrieved between ${stats.retrieved_min} and ${stats.retrieved_max}.`
      : '';

  return (
    <main style={{ maxWidth: '60rem', margin: '0 auto', padding: 'var(--space-lg) var(--space-md)', color: 'var(--ink)' }}>
      <header>
        <h1>Sources and attributions</h1>
        {sources.length === 0 ? (
          <p>No sources are registered yet.</p>
        ) : (
          <p>{`${n} ${plural(n, 'source backs', 'sources back')} ${stats.published_files} published ${plural(stats.published_files, 'file', 'files')}.${range}`}</p>
        )}
        {mock && <p style={{ color: 'var(--state-warning)' }}>Sample data: these are not real sources</p>}
        {stats.records_without_url > 0 && (
          <p style={{ color: 'var(--ink-2)' }}>
            {`${stats.records_without_url} of ${stats.records_total} records have no link to a source page.`}
          </p>
        )}
      </header>

      {sources.length > 0 && (
        <>
          <section aria-label="Filters" data-print="hide" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <label>
              Search sources{' '}
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            {presentTypes.map((t) => (
              <button key={t} aria-pressed={types.includes(t)} onClick={() => toggleType(t)}>
                {TYPE_LABEL[t]}
              </button>
            ))}
            <button
              onClick={() => {
                setQuery('');
                setTypes([]);
              }}
            >
              Clear filters
            </button>
          </section>
          <div role="status" aria-live="polite" style={{ color: 'var(--ink-2)' }}>
            {`${filtered.length} ${plural(filtered.length, 'source', 'sources')} shown`}
          </div>
          {filtered.length === 0 && <p>No source matches the filters.</p>}

          {groups.map((group) => (
            <section key={group.type} aria-labelledby={`group-${group.type}`}>
              <h2 id={`group-${group.type}`}>{`${TYPE_LABEL[group.type]} (${group.sources.length})`}</h2>
              {group.sources.map((s) => (
                <Entry
                  key={s.id}
                  source={s}
                  derivedTitle={derived[s.id] ?? null}
                  anchorsInList={s.derived_from !== null && ids.has(s.derived_from)}
                  copy={copies[s.id]}
                  onCopy={copy}
                />
              ))}
            </section>
          ))}
        </>
      )}

      {attributions.length > 0 && (
        <section aria-labelledby="attributions">
          <h2 id="attributions">Attributions</h2>
          <ul>
            {attributions.map((a) => (
              <li key={`${a.label}:${a.text}`}>
                {a.source_url === null ? (
                  `${a.label}: ${a.text}`
                ) : (
                  <>
                    {a.label}:{' '}
                    <a href={a.source_url} target="_blank" rel="noopener noreferrer">
                      {a.text}
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {leads.length > 0 && (
        <details>
          <summary>Not verified leads</summary>
          <p>These pages were not opened; no figure in this app relies on them.</p>
          <ul>
            {leads.map((lead) => (
              <li key={lead.id}>
                <a href={lead.url} target="_blank" rel="noopener noreferrer">
                  {lead.title}
                </a>{' '}
                {lead.authors_or_publisher}
              </li>
            ))}
          </ul>
        </details>
      )}

      {extra}

      <footer data-print="hide" style={{ marginTop: 'var(--space-lg)' }}>
        <a href="index.html">Back to the app</a>
      </footer>
    </main>
  );
}

/** Loads /data/references.json and renders the page. */
export function ReferencesApp() {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error' } | { status: 'ok'; references: References }>({
    status: 'loading'
  });

  useEffect(() => {
    let active = true;
    fetch('/data/references.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (active) setState({ status: 'ok', references: parseReferences(json) });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'loading') return <div style={{ color: 'var(--ink)' }}>Loading...</div>;
  if (state.status === 'error') return <div style={{ color: 'var(--state-critical)' }}>Error loading data.</div>;
  return <ReferencesPage references={state.references} extra={<VisitsSection />} />;
}
