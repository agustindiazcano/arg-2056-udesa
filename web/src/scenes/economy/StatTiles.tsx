import React from 'react';
import { formatPercent, formatValue, ordinal } from '../../charts/format.js';
import { CountUp } from '../../motion/CountUp.js';
import { Tile, TileGrid } from '../../ui/Tile.js';
import type { EconomyIndicator, EconomyRecord } from '../../types/index.js';
import { gapPct, peerMedian, rankAt } from './selectors.js';

interface StatTilesProps {
  records: EconomyRecord[];
  indicator: EconomyIndicator;
  year: number;
  home: string;
  countries: string[];
  unit: string;
}

const NO_DATA = 'sin datos';

function Value({ text }: { text: string | null }) {
  return (
    <div style={{ fontSize: 'var(--font-xl)', color: text === null ? 'var(--muted)' : 'var(--ink)' }}>
      {text ?? NO_DATA}
    </div>
  );
}

export function StatTiles({ records, indicator, year, home, countries, unit }: StatTilesProps) {
  const value = records.find((r) => r.indicator === indicator && r.country === home && r.year === year)?.value ?? null;
  const { rows } = rankAt(records, { indicator, year, countries });
  const row = rows.find((r) => r.geo === home);
  const median = peerMedian(records, { indicator, year, country: home, countries });
  const gap = gapPct(value, median);

  return (
    <TileGrid>
      <Tile id="tile-value" label={`${home} en ${year}`}>
        <div style={{ fontSize: 'var(--font-xl)', color: value === null ? 'var(--muted)' : 'var(--ink)' }}>
          <CountUp value={value} format={(n) => formatValue(n, unit)} fallback={NO_DATA} />
        </div>
      </Tile>
      <Tile id="tile-rank" label="Puesto entre los países seleccionados">
        <Value text={row ? `${row.rank} de ${row.of}` : null} />
        {row && <div style={{ color: 'var(--ink-2)' }}>{ordinal(row.rank)}</div>}
      </Tile>
      <Tile id="tile-gap" label="Brecha frente a la mediana de los pares">
        <Value text={gap === null ? null : formatPercent(gap, { signed: true })} />
      </Tile>
    </TileGrid>
  );
}
