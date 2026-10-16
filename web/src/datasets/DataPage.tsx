import React, { useMemo, useRef, useState } from 'react';
import { formatDecimal } from '../charts/format.js';
import {
  downloadCsv,
  downloadJson,
  referencesCsv,
  referencesJson,
  slideCsv,
  slideJson,
  slug,
  tableCsv,
  tableJson
} from './csv.js';
import { MethodologyView } from './MethodologyView.js';
import { REFERENCES } from './references.js';
import { buildSlides } from './slides.js';
import type { Cell, DataTable, SlideData } from './types.js';

export type DataTab = 'data' | 'references' | 'methodology';

const cell = (c: Cell): string => (c === null ? '—' : typeof c === 'number' ? formatDecimal(c) : c);
const fileOf = (s: SlideData): string => `diapositiva-${slug(`${s.id} ${s.title}`)}`;

function Table({ slide, table }: { slide: SlideData; table: DataTable }) {
  return (
    <div className="data-table-block">
      <div className="data-table-head">
        <strong>{table.title}</strong>
        <span className="data-count">{`${table.rows.length} filas`}</span>
        <button
          type="button"
          className="btn"
          aria-label={`Descargar CSV: ${table.title}`}
          onClick={() => downloadCsv(`${fileOf(slide)}-${table.id}.csv`, tableCsv(table))}
        >
          Descargar CSV
        </button>
        <button
          type="button"
          className="btn"
          aria-label={`Descargar JSON: ${table.title}`}
          onClick={() => downloadJson(`${fileOf(slide)}-${table.id}.json`, tableJson(table))}
        >
          Descargar JSON
        </button>
      </div>
      <div className="data-scroll">
        <table aria-label={table.title}>
          <thead>
            <tr>
              {table.columns.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{cell(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * The Data section: provides three views via title tabs:
 * 1. Data: tables behind each slide of the Recorrido, with CSV and JSON downloads.
 * 2. Referencias: official sources and links categorized with their verification state.
 * 3. Metodología: technical data pipeline description and slide-specific methodologies.
 */
export function DataPage() {
  const [tab, setTab] = useState<DataTab>('data');
  const slides = useMemo(buildSlides, []);
  const [selected, setSelected] = useState(slides[0]!.id);
  const current = slides.find((s) => s.id === selected) ?? slides[0]!;
  const refsById = useMemo(() => new Map(REFERENCES.map((r) => [r.id, r])), []);

  const page = useRef<HTMLDivElement>(null);
  const choose = (id: string) => {
    setSelected(id);
    page.current?.scrollTo?.({ top: 0 });
  };

  const switchTab = (nextTab: DataTab) => {
    setTab(nextTab);
    page.current?.scrollTo?.({ top: 0 });
  };

  return (
    <div className="data-page" ref={page}>
      <header className="data-bar">
        <nav className="data-tabs" aria-label="Secciones de datos">
          <button
            type="button"
            className={`data-tab-btn ${tab === 'data' ? 'data-tab-btn--active' : ''}`}
            onClick={() => switchTab('data')}
            aria-pressed={tab === 'data'}
          >
            Data
          </button>
          <button
            type="button"
            className={`data-tab-btn ${tab === 'references' ? 'data-tab-btn--active' : ''}`}
            onClick={() => switchTab('references')}
            aria-pressed={tab === 'references'}
          >
            Referencias
          </button>
          <button
            type="button"
            className={`data-tab-btn ${tab === 'methodology' ? 'data-tab-btn--active' : ''}`}
            onClick={() => switchTab('methodology')}
            aria-pressed={tab === 'methodology'}
          >
            Metodología
          </button>
        </nav>

        {tab === 'data' && (
          <>
            <label className="data-select">
              <span>Diapositiva</span>
              <select aria-label="Diapositiva" value={selected} onChange={(e) => choose(e.target.value)}>
                {slides.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => downloadCsv(`${fileOf(current)}.csv`, slideCsv(current))}
            >
              Descargar CSV de la diapositiva
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => downloadJson(`${fileOf(current)}.json`, slideJson(current))}
            >
              Descargar JSON de la diapositiva
            </button>
          </>
        )}

        {tab === 'references' && (
          <>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => downloadCsv('referencias.csv', referencesCsv(REFERENCES))}
            >
              Descargar referencias (CSV)
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => downloadJson('referencias.json', referencesJson(REFERENCES))}
            >
              Descargar referencias (JSON)
            </button>
          </>
        )}
      </header>

      {tab === 'data' && (
        <>
          <p className="data-intro">
            Elegí una diapositiva para ver sus tablas y descargar los datos en formato CSV o JSON.
          </p>

          {[current].map((s) => (
            <article key={s.id} id={`data-slide-${s.id}`} className="data-slide" aria-labelledby={`data-title-${s.id}`}>
              <h3 id={`data-title-${s.id}`}>{s.label}</h3>
              <div className="data-cards">
                {s.tables.map((t) => (
                  <Table key={t.id} slide={s} table={t} />
                ))}
              </div>
              {s.refs.length > 0 && (
                <p className="data-refs">
                  Fuentes:{' '}
                  {s.refs.map((id, i) => {
                    const r = refsById.get(id)!;
                    return (
                      <React.Fragment key={id}>
                        {i > 0 && ', '}
                        <a href={r.url} target="_blank" rel="noopener noreferrer">
                          {r.label}
                        </a>
                      </React.Fragment>
                    );
                  })}
                </p>
              )}
            </article>
          ))}
        </>
      )}

      {tab === 'references' && (
        <article id="data-referencias" className="data-slide" aria-labelledby="data-title-refs">
          <h3 id="data-title-refs">Referencias</h3>
          <p className="data-intro">
            Todos los enlaces y fuentes oficiales utilizados en el proyecto, organizados por temática y con el estado de verificación de cada uno.
          </p>
          {Array.from(new Set(REFERENCES.map((r) => r.group))).map((group) => (
            <div key={group} className="data-table-block">
              <strong>{group}</strong>
              <ul className="data-reflist">
                {REFERENCES.filter((r) => r.group === group).map((r) => (
                  <li key={r.id}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      {r.label}
                    </a>
                    <span className="data-status">{r.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </article>
      )}

      {tab === 'methodology' && <MethodologyView />}
    </div>
  );
}
