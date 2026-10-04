import React, { useEffect, useMemo, useRef, useState } from 'react';
import { parseReferences, PUBLISHER_TYPES } from '../types/references.js';
import type { PublisherType, ReferenceSource, References } from '../types/references.js';
import { formatCitation } from './citation.js';
import { formatDate } from '../charts/format.js';
import { versionedUrl } from '../data/version.js';
import { SceneError, SceneLoading } from '../ui/SceneStatus.js';
import { VisitsSection } from '../analytics/VisitsSection.js';
import { filterReferences, groupByType, resolveDerived } from './selectors.js';

const TYPE_LABEL: Record<PublisherType, string> = {
  official: 'Oficial',
  international: 'Internacional',
  peer_reviewed: 'Revisada por pares',
  working_paper: 'Documento de trabajo',
  technical_report: 'Informe técnico',
  company: 'Empresa',
  association: 'Asociación',
  bank: 'Banco',
  consultancy: 'Consultora',
  think_tank: 'Centro de estudios',
  archive: 'Archivo',
  press: 'Prensa'
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
        {source.publication_date ? `Publicado el ${formatDate(source.publication_date)}` : 'fecha no indicada'}
      </div>
      <div style={{ color: 'var(--ink-2)' }}>{`Consultado el ${formatDate(source.retrieved_at)}`}</div>
      {source.language !== null && <div style={{ color: 'var(--ink-2)' }}>{`Idioma: ${source.language}`}</div>}
      {source.license_or_terms !== null && (
        <div style={{ color: 'var(--ink-2)' }}>{`Licencia: ${source.license_or_terms}`}</div>
      )}
      {source.derived_from !== null &&
        (derivedTitle !== null && anchorsInList ? (
          <div style={{ color: 'var(--ink-2)' }}>
            Derivado de <a href={`#${source.derived_from}`}>{derivedTitle}</a>
          </div>
        ) : (
          <div style={{ color: 'var(--ink-2)' }}>{`Derivado de ${source.derived_from}`}</div>
        ))}
      <div style={{ color: 'var(--ink-2)' }}>{`Usado por: ${source.used_by.join(', ')}`}</div>
      <div data-print="hide">
        <button onClick={() => onCopy(source)}>Copiar cita</button>{' '}
        <span aria-live="polite">{copy === 'copied' ? 'Copiado' : copy === 'failed' ? 'No se pudo copiar' : ''}</span>
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
      ? ` Consultadas entre ${formatDate(stats.retrieved_min)} y ${formatDate(stats.retrieved_max)}.`
      : '';

  return (
    <main style={{ maxWidth: '60rem', margin: '0 auto', padding: 'var(--space-lg) var(--space-md)', color: 'var(--ink)' }}>
      <header>
        <h1>Fuentes y atribuciones</h1>
        {sources.length === 0 ? (
          <p>Todavía no hay fuentes registradas.</p>
        ) : (
          <p>{`${n} ${plural(n, 'fuente respalda', 'fuentes respaldan')} ${stats.published_files} ${plural(stats.published_files, 'archivo publicado', 'archivos publicados')}.${range}`}</p>
        )}
        {mock && <p style={{ color: 'var(--state-warning)' }}>Datos de muestra: no son fuentes reales</p>}
        {stats.records_without_url > 0 && (
          <p style={{ color: 'var(--ink-2)' }}>
            {`${stats.records_without_url} de ${stats.records_total} registros no tienen enlace a una página de la fuente.`}
          </p>
        )}
      </header>

      {sources.length > 0 && (
        <>
          <section aria-label="Filtros" data-print="hide" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <label>
              Buscar fuentes{' '}
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
              Limpiar filtros
            </button>
          </section>
          <div role="status" aria-live="polite" style={{ color: 'var(--ink-2)' }}>
            {`${filtered.length} ${plural(filtered.length, 'fuente mostrada', 'fuentes mostradas')}`}
          </div>
          {filtered.length === 0 && <p>Ninguna fuente coincide con los filtros.</p>}

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
          <h2 id="attributions">Atribuciones</h2>
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
          <summary>Pistas sin verificar</summary>
          <p>Estas páginas no se abrieron; ninguna cifra de esta aplicación depende de ellas.</p>
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
        <a href="index.html">Volver a la aplicación</a>
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
    versionedUrl('/data/references.json')
      .then((url) => fetch(url))
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

  if (state.status === 'loading') return <SceneLoading />;
  if (state.status === 'error') return <SceneError />;
  return <ReferencesPage references={state.references} extra={<VisitsSection />} />;
}
