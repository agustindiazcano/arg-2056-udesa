import React from 'react';
import { INDICATORS_SOURCE, TOUR_INDICATORS } from './indicatorsMock';

/** A small box with six headline indicators, shown over steps 1 and 2 of the Recorrido. */
export function TourIndicators() {
  return (
    <aside className="tour-indicators">
      <ul aria-label="Indicadores de la Argentina">
        {TOUR_INDICATORS.map((i) => (
          <li key={i.label}>
            <span className="tour-ind-label">{i.label}</span>
            <span className="tour-ind-value">{i.value}</span>
            <span className="tour-ind-unit">{i.unit}</span>
          </li>
        ))}
      </ul>
      <p className="tour-ind-source">{INDICATORS_SOURCE}</p>
    </aside>
  );
}
