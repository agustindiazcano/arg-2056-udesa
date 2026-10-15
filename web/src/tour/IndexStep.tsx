import React, { useMemo } from 'react';
import { Reveal } from '../motion/Reveal.js';
import { useStore } from '../state/store.js';
import { indexItems } from './indexData.js';

/**
 * The first slide of the Recorrido: the text "Argentina 2056" and the index, the list of the other slides with their number and title.
 * Choosing one opens it.
 */
export function IndexStep() {
  const dispatch = useStore((s) => s.dispatch);
  const items = useMemo(() => indexItems(), []);
  return (
    <section className="gdp-step index-step" aria-label="Argentina 2056">
      <Reveal k="title" className="index-head">
        <h1 className="index-title">
          <span className="a">Argentina</span> <span className="n">2056</span>
        </h1>
      </Reveal>
      <Reveal k="list" delay={0.1} className="gdp-chart index-card">
        <nav aria-label="Índice">
          <ol className="index-list">
            {items.map((item) => (
              <li key={item.id}>
                <button type="button" className="index-item" onClick={() => dispatch({ type: 'tourSet', step: item.id })}>
                  {`${item.number} · ${item.title}`}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </Reveal>
    </section>
  );
}
