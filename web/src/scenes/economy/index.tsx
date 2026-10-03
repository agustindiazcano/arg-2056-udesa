import React, { useMemo, useState } from 'react';
import { buildLongRun } from '../../charts/builders/longRun.js';
import { buildRankBars } from '../../charts/builders/rankBars.js';
import { buildRankHistory } from '../../charts/builders/rankHistory.js';
import { DataTable } from '../../charts/DataTable.js';
import { EChart } from '../../charts/EChart.js';
import { formatValue } from '../../charts/format.js';
import { ERAS } from '../../content/eras.js';
import { useDataset } from '../../data/useDataset.js';
import { useStore } from '../../state/store.js';
import { parseEconomySeries } from '../../types/index.js';
import type { EconomyIndicator } from '../../types/index.js';
import { StatTiles } from './StatTiles.js';
import { clampYear, countriesIn, longRunView, rankAt, rankHistory } from './selectors.js';
import type { LongRunMode } from './selectors.js';

/** Country code of the home country in the dataset (ISO 3166-1 alpha-3). */
const HOME = 'ARG';
const MAX_COUNTRIES = 8;
const NO_DATA = 'no data';

const INDICATOR_LABEL: Record<EconomyIndicator, string> = {
  gdp_constant_usd: 'GDP',
  gdp_per_capita_usd: 'GDP per capita',
  population: 'Population',
  hdi: 'HDI',
  exports_usd: 'Exports',
  imports_usd: 'Imports'
};

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function orderedSelection(countries: string[]): string[] {
  return [...countries].sort((a, b) => (a === HOME ? -1 : b === HOME ? 1 : a < b ? -1 : a > b ? 1 : 0));
}

export default function Scene() {
  const yearFloat = useStore((s) => s.yearFloat);
  const dispatch = useStore((s) => s.dispatch);

  const { status, data } = useDataset('economy_series', parseEconomySeries);

  const [indicatorChoice, setIndicatorChoice] = useState<EconomyIndicator | null>(null);
  const [mode, setMode] = useState<LongRunMode>('level');
  const [selection, setSelection] = useState<string[] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [longAsTable, setLongAsTable] = useState(false);
  const [barsAsTable, setBarsAsTable] = useState(false);
  const [historyAsTable, setHistoryAsTable] = useState(false);

  const records = useMemo(() => data ?? [], [data]);
  const indicators = useMemo(() => unique(records.map((r) => r.indicator)), [records]);
  const indicator: EconomyIndicator | undefined =
    indicatorChoice !== null && indicators.includes(indicatorChoice) ? indicatorChoice : indicators[0];

  const available = useMemo(() => (indicator ? countriesIn(records, indicator) : []), [records, indicator]);
  const selected = useMemo(() => {
    const base = selection ? selection.filter((c) => available.includes(c)) : available;
    const withHome = available.includes(HOME) && !base.includes(HOME) ? [HOME, ...base] : base;
    return orderedSelection(withHome).slice(0, MAX_COUNTRIES);
  }, [selection, available]);

  const view = useMemo(
    () => (indicator && selected.length > 0 ? longRunView(records, { indicator, countries: selected, mode }) : null),
    [records, indicator, selected, mode]
  );
  const year = clampYear(yearFloat, view?.years ?? []);
  const label = indicator ? INDICATOR_LABEL[indicator] : '';
  const levelUnit = records.find((r) => r.indicator === indicator)?.unit ?? '';

  const rank = useMemo(
    () => (indicator ? rankAt(records, { indicator, year, countries: selected }) : { rows: [], missing: [] }),
    [records, indicator, year, selected]
  );
  const history = useMemo(
    () => (indicator ? rankHistory(records, { indicator, country: HOME, countries: selected }) : []),
    [records, indicator, selected]
  );

  const longRun = useMemo(
    () => (view ? buildLongRun(view, { highlight: HOME, year, eras: ERAS, hovered, indicatorLabel: label }) : null),
    [view, year, hovered, label]
  );
  const bars = useMemo(
    () => buildRankBars(rank.rows, { highlight: HOME, missing: rank.missing, unit: levelUnit, year, indicatorLabel: label }),
    [rank, levelUnit, year, label]
  );
  const rankLine = useMemo(
    () => buildRankHistory(history, { year, highlight: HOME, indicatorLabel: label }),
    [history, year, label]
  );

  const toggleCountry = (country: string) => {
    if (country === HOME) return;
    if (selected.includes(country)) {
      setSelection(selected.filter((c) => c !== country));
      setLimitReached(false);
    } else if (selected.length >= MAX_COUNTRIES) {
      setLimitReached(true);
    } else {
      setSelection([...selected, country]);
      setLimitReached(false);
    }
  };

  if (status === 'loading') return <div style={{ color: 'var(--ink)' }}>Loading...</div>;
  if (status === 'error' || !data || !indicator) {
    return <div style={{ color: 'var(--state-critical)' }}>Error loading data.</div>;
  }

  const displayed = records.filter((r) => r.indicator === indicator && selected.includes(r.country));
  const sources = unique(displayed.map((r) => r.source)).sort();
  const latest = displayed.map((r) => r.retrieved_at).sort().at(-1);

  const longTable =
    longAsTable && view
      ? {
          columns: [{ key: 'year', header: 'Year' }, ...view.series.map((s) => ({ key: s.country, header: s.country }))],
          rows: view.years.map((y, i) => {
            const row: Record<string, string | number> = { year: y };
            for (const s of view.series) {
              const value = s.points[i]?.value ?? null;
              row[s.country] = value === null ? NO_DATA : formatValue(value, view.unit);
            }
            return row;
          })
        }
      : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        color: 'var(--ink)',
        padding: 'var(--space-md)',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}
    >
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <h1 style={{ margin: 0 }}>Argentina in the long run</h1>
        <p style={{ margin: 0, color: 'var(--ink-2)' }}>From 1880 to today, compared with its Latin American peers</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
        {indicators.map((i) => (
          <button key={i} aria-pressed={i === indicator} onClick={() => setIndicatorChoice(i)}>
            {INDICATOR_LABEL[i]}
          </button>
        ))}
        <button aria-pressed={mode === 'level'} onClick={() => setMode('level')}>
          Level
        </button>
        <button aria-pressed={mode === 'index'} onClick={() => setMode('index')}>
          Index
        </button>
      </div>

      {available.length === 0 ? (
        <div style={{ color: 'var(--state-warning)' }}>No country has data for this indicator.</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            {available.map((c) => (
              <button
                key={c}
                aria-pressed={selected.includes(c)}
                disabled={c === HOME}
                onClick={() => toggleCountry(c)}
                onMouseEnter={() => setHovered(c)}
                onMouseLeave={() => setHovered(null)}
              >
                {c}
              </button>
            ))}
          </div>
          {limitReached && (
            <div style={{ color: 'var(--state-warning)', marginBottom: 'var(--space-sm)' }}>
              {`At most ${MAX_COUNTRIES} countries at once.`}
            </div>
          )}
          {view && view.indexUnavailable && (
            <div style={{ color: 'var(--state-warning)', marginBottom: 'var(--space-sm)' }}>
              Index view is not available: no year has a positive value for every selected country. Showing levels.
            </div>
          )}

          <div style={{ color: 'var(--muted)', marginBottom: 'var(--space-sm)', display: 'flex', gap: 'var(--space-md)' }}>
            <span>Year {year}</span>
            <input
              type="range"
              aria-label="Playhead year"
              min={view?.years[0] ?? year}
              max={view?.years[view.years.length - 1] ?? year}
              value={year}
              onChange={(e) => dispatch({ type: 'setYear', year: Number(e.target.value) })}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-lg)', flex: 1, minHeight: 0 }}>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span>Long run (era bands are placeholders)</span>
                <button aria-pressed={longAsTable} onClick={() => setLongAsTable(!longAsTable)}>
                  Table view
                </button>
              </div>
              <div style={{ flex: 1, minHeight: '280px' }}>
                {longTable && <DataTable caption="Long run" columns={longTable.columns} data={longTable.rows} />}
                {!longTable && longRun && <EChart option={longRun.option} aria-label={longRun.summary} />}
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span>Ranking in {year}</span>
                <button aria-pressed={barsAsTable} onClick={() => setBarsAsTable(!barsAsTable)}>
                  Table view
                </button>
              </div>
              <div style={{ flex: 1, minHeight: '280px' }}>
                {barsAsTable ? (
                  <DataTable
                    caption="Ranking"
                    columns={[
                      { key: 'rank', header: 'Rank' },
                      { key: 'country', header: 'Country' },
                      { key: 'value', header: 'Value' }
                    ]}
                    data={rank.rows.map((r) => ({ rank: r.rank, country: r.geo, value: formatValue(r.value, levelUnit) }))}
                  />
                ) : (
                  <EChart option={bars.option} aria-label={bars.summary} />
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '220px', marginTop: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <span>{`Rank of ${HOME} over time`}</span>
              <button aria-pressed={historyAsTable} onClick={() => setHistoryAsTable(!historyAsTable)}>
                Table view
              </button>
            </div>
            <div style={{ flex: 1, minHeight: '180px' }}>
              {historyAsTable ? (
                <DataTable
                  caption="Rank history"
                  columns={[
                    { key: 'year', header: 'Year' },
                    { key: 'rank', header: 'Rank' },
                    { key: 'of', header: 'Of' }
                  ]}
                  data={history.map((p) => ({ year: p.year, rank: p.rank ?? NO_DATA, of: p.of ?? NO_DATA }))}
                />
              ) : (
                <EChart option={rankLine.option} aria-label={rankLine.summary} />
              )}
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-md)' }}>
            <StatTiles records={records} indicator={indicator} year={year} home={HOME} countries={selected} unit={levelUnit} />
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', fontSize: '12px', color: 'var(--ink-2)' }}>
            {`Source: ${sources.join(', ')}, retrieved ${latest}`}
          </div>
        </>
      )}
    </div>
  );
}
