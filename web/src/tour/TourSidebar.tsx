import React from 'react';
import { REFERENCES } from '../datasets/references.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefLink } from '../ui/RefLink.js';
import { useTourLayout } from './useTourLayout.js';
import { STEP_INFO } from './stepInfo.js';
import { useSlideReferences } from '../ui/SlideReferences.js';

const BY_ID = new Map(REFERENCES.map((r) => [r.id, r]));

/**
 * The panel on the side of a chart of the Recorrido: what it shows, how to read it, how real its data is and the references. It opens by
 * default and the button hides it (the choice stays when the step changes).
 */
export function TourSidebar({ step }: { step: number }) {
  const open = useTourLayout((s) => s.sideOpen);
  const toggle = useTourLayout((s) => s.toggleSide);
  const info = STEP_INFO[step];
  const collected = useSlideReferences((info?.refs ?? []).map((id) => ({ id })));
  if (!info) return null;
  const refs = info.refs.map((id) => BY_ID.get(id)).filter((r) => r !== undefined);

  if (!open) {
    return (
      <div className="tour-side-collapsed">
        <ChartHelp title={info.heading} paragraphs={info.paragraphs} how={info.how} refs={info.refs} />
        <button type="button" className="tour-side-open" aria-expanded="false" aria-controls="tour-side" onClick={toggle}>
          Mostrar texto
        </button>
      </div>
    );
  }
  return (
    <aside id="tour-side" className="tour-side" aria-label="Texto y referencias del gráfico">
      <div className="tour-side-head">
        <ChartHelp title={info.heading} paragraphs={info.paragraphs} how={info.how} refs={info.refs} />
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
      {!collected && refs.length > 0 && (
        <div className="tour-side-refs">
          <strong>Referencias</strong>
          <ul className="ref-chip-ul">
            {refs.map((r) => (
              <li key={r.id}>
                <RefLink id={r.id} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
