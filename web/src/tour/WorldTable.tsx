import React from 'react';
import { formatValue } from '../charts/format.js';
import { SEQUENTIAL_BLUE, tokens } from '../styles/tokens.js';
import { HOME, rankingTable } from './worldData.js';
import type { RankMetric } from './worldData.js';

/** How many of the others each table lists (it scrolls inside its box). */
const LISTED = 20;

/** The light blue of the cell of Argentina. */
const HOME_BG = SEQUENTIAL_BLUE[8] ?? tokens.blue;

/**
 * One ranking of the world in a year. Argentina is a cell of its own over the list, always in the same place, with its place
 * among everyone and its value; under it the other countries move up and down as the years go by.
 */
export function WorldTable({ metric, title, unit, year }: { metric: RankMetric; title: string; unit: string; year: number }) {
  const { home, others } = rankingTable(year, metric, LISTED);
  const number = (value: number) => formatValue(Math.round(value), '');
  return (
    <div className="world-rank">
      <div className="world-rank-head">
        <strong>{title}</strong>
        <span className="gdp-sub">{unit}</span>
      </div>
      <div className="world-home" data-home="true" data-testid={`home-${metric === 'gdp' ? 'gdp' : 'percapita'}`} style={{ background: HOME_BG, color: tokens.page }}>
        <span>{home.rank}</span>
        <strong>{HOME}</strong>
        <span>{number(home.value)}</span>
      </div>
      <table className="world-table" aria-label={title}>
        <thead>
          <tr>
            <th scope="col" aria-label="Puesto">#</th>
            <th scope="col">País</th>
            <th scope="col">{metric === 'gdp' ? 'PBI' : 'USD'}</th>
          </tr>
        </thead>
        <tbody>
          {others.map((c) => (
            <tr key={c.country}>
              <td>{c.rank}</td>
              <td>{c.country}</td>
              <td>{number(c.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
