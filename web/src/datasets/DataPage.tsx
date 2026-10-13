import React, { useMemo, useRef, useState } from 'react';
import { formatDecimal } from '../charts/format.js';
import { downloadCsv, referencesCsv, slideCsv, slug, tableCsv } from './csv.js';
import { REFERENCES } from './references.js';
import { buildSlides } from './slides.js';
import type { Cell, DataTable, SlideData } from './types.js';

const cell = (c: Cell): string => (c === null ? '—' : typeof c === 'number' ? formatDecimal(c) : c);
const fileOf = (s: SlideData): string => `diapositiva-${slug(`${s.id} ${s.title}`)}`;

function Table({ slide, table }: { slide: SlideData; table: DataTable }) {
  return (
    <div className="data-table-block">
      <div className="data-table-head">
        <strong>{table.title}</strong>
        <span className="data-count">{`${table.rows.length} filas`}</span>
        <button type="button" className="btn" aria-label={`Descargar CSV: ${table.title}`} onClick={() => downloadCsv(`${fileOf(slide)}-${table.id}.csv`, tableCsv(table))}>
          Descargar CSV
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
 * The Data section: one scrolling page with the data behind every slide of the Recorrido (and the simulator) as tables, a selector
 * of slide to download its data as CSV, and at the end the links of the references.
 */
export function DataPage() {
  const slides = useMemo(buildSlides, []);
  const [selected, setSelected] = useState(slides[0]!.id);
  const current = slides.find((s) => s.id === selected) ?? slides[0]!;
  const refsById = useMemo(() => new Map(REFERENCES.map((r) => [r.id, r])), []);

  // only the tables of the chosen slide are on the page: the page goes back to the top when another one is chosen
  const page = useRef<HTMLDivElement>(null);
  const choose = (id: string) => {
    setSelected(id);
    page.current?.scrollTo?.({ top: 0 });
  };

  return (
    <div className="data-page" ref={page}>
      <header className="data-bar">
        <h2>Data</h2>
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
        <button type="button" className="btn btn--primary" onClick={() => downloadCsv(`${fileOf(current)}.csv`, slideCsv(current))}>
          Descargar CSV de la diapositiva
        </button>
        <button type="button" className="btn" onClick={() => downloadCsv('referencias.csv', referencesCsv(REFERENCES))}>
          Descargar referencias (CSV)
        </button>
      </header>

      <p className="data-intro">
        Elegí una diapositiva para ver sus tablas. Las cifras marcadas «Datos de prueba» son inventadas y se reemplazan por series con fuente antes del lanzamiento.
      </p>

      {[current].map((s) => (
        <article key={s.id} id={`data-slide-${s.id}`} className="data-slide" aria-labelledby={`data-title-${s.id}`}>
          <h3 id={`data-title-${s.id}`}>{s.label}</h3>
          <p className={s.mock ? 'data-badge data-badge--mock' : 'data-badge'}>{s.mock ? 'Datos de prueba (inventados)' : 'Datos reales, sin verificar por una persona'}</p>
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

      <article id="data-referencias" className="data-slide" aria-labelledby="data-title-refs">
        <h3 id="data-title-refs">Referencias</h3>
        <p className="data-intro">Todos los enlaces de los datos, con el estado de cada uno. Las fuentes de los Andes están en la página «Fuentes y métodos».</p>
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
    </div>
  );
}
