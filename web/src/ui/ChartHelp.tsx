import React, { useEffect, useId, useState } from 'react';
import { RefList } from './RefLink.js';

export interface ChartHelpProps {
  title: string;
  /** the clarifying line (unit, what is measured): the first line read, in sky blue */
  lead?: string;
  paragraphs: readonly string[];
  how?: string;
  refs?: readonly string[];
}

/**
 * Question-mark (`?`) trigger for chart/slide explanatory texts:
 * - Never uses native browser `title` attributes.
 * - On hover/focus: shows a custom styled floating tooltip with the explanatory text.
 * - On click: opens a styled modal popup with the full explanation, reading guide, and numbered references.
 */
export function ChartHelp({ title, lead, paragraphs, how, refs = [] }: ChartHelpProps) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);
  const dialogTitleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <span
      className="chart-help-wrap"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        className="chart-help-btn"
        aria-label={`Explicación: ${title}`}
        aria-expanded={open}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ?
      </button>

      {hover && !open && (
        <div role="tooltip" className="chart-help-tooltip">
          <strong className="chart-help-tooltip-title">{title}</strong>
          {lead && <p className="chart-help-lead">{lead}</p>}
          {paragraphs.map((p, i) => (
            <p key={i} className="chart-help-tooltip-p">
              {p}
            </p>
          ))}
          {how && (
            <p className="chart-help-tooltip-how">
              <strong>Cómo leerlo:</strong> {how}
            </p>
          )}
          <span className="chart-help-tooltip-hint">Click en ? para fijar en ventana</span>
        </div>
      )}

      {open && (
        <div className="chart-help-backdrop">
          <button
            type="button"
            className="chart-help-backdrop-close"
            tabIndex={-1}
            aria-label="Cerrar fondo de explicación"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="chart-help-modal"
          >
            <div className="chart-help-modal-head">
              <h4 id={dialogTitleId}>{title}</h4>
              <button
                type="button"
                className="btn"
                aria-label="Cerrar explicación"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            </div>
            <div className="chart-help-modal-body">
              {lead && <p className="chart-help-lead">{lead}</p>}
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {how && (
                <div className="chart-help-modal-how">
                  <strong>Cómo leer este gráfico</strong>
                  <p>{how}</p>
                </div>
              )}
              {refs.length > 0 && (
                <div className="chart-help-modal-refs">
                  <strong>Referencias</strong>
                  <RefList ids={refs} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
