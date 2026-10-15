import React from 'react';
import { REFERENCES } from '../datasets/references.js';
import { useTourLayout } from './useTourLayout.js';
import { STEP_INFO } from './stepInfo.js';

const BY_ID = new Map(REFERENCES.map((r) => [r.id, r]));

/**
 * The panel on the side of a chart of the Recorrido: what it shows, how to read it, how real its data is and the references. It opens by
 * default and the button hides it (the choice stays when the step changes).
 */
export function TourSidebar({ step }: { step: number }) {
  const open = useTourLayout((s) => s.sideOpen);
  const toggle = useTourLayout((s) => s.toggleSide);
  const info = STEP_INFO[step];
  if (!info) return null;
  const refs = info.refs.map((id) => BY_ID.get(id)).filter((r) => r !== undefined);

  if (!open) {
    return (
      <button type="button" className="tour-side-open" aria-expanded="false" aria-controls="tour-side" onClick={toggle}>
        Mostrar texto
      </button>
    );
  }
  return (
    <aside id="tour-side" className="tour-side" aria-label="Texto y referencias del gráfico">
      <div className="tour-side-head">
        <button type="button" className="btn" aria-expanded="true" aria-controls="tour-side" onClick={toggle}>
          Ocultar texto
        </button>
      </div>
      <h3>{info.heading}</h3>
      {info.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <details open>
        <summary>Cómo leer este gráfico</summary>
        <p>{info.how}</p>
      </details>
      {refs.length > 0 && (
        <div className="tour-side-refs">
          <strong>Referencias</strong>
          <ul>
            {refs.map((r) => (
              <li key={r.id}>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
