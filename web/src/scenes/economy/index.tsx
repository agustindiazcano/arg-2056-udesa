import React, { useMemo, useState } from 'react';
import { buildLongRun } from '../../charts/builders/longRun.js';
import { buildRankBars } from '../../charts/builders/rankBars.js';
import { buildRankHistory } from '../../charts/builders/rankHistory.js';
import { DataTable } from '../../charts/DataTable.js';
import { EChart } from '../../charts/EChart.js';
import { formatValue } from '../../charts/format.js';
import { ERAS } from '../../content/eras.js';
import { indicatorLabel } from '../../content/labels.js';
import { useDataset } from '../../data/useDataset.js';
import { useStore } from '../../state/store.js';
import { FilterBar, FilterChip } from '../../ui/FilterBar.js';
import { SceneShell } from '../../ui/SceneShell.js';
import { ScopeNote } from '../../ui/ScopeNote.js';
import { SceneError, SceneLoading } from '../../ui/SceneStatus.js';
import { TableToggle } from '../../ui/TableToggle.js';
import { parseEconomySeries } from '../../types/index.js';
import type { EconomyIndicator } from '../../types/index.js';
import { StatTiles } from './StatTiles.js';
import { clampYear, countriesIn, longRunView, rankAt, rankHistory } from './selectors.js';
import type { LongRunMode } from './selectors.js';

/** Country code of the home country in the dataset (ISO 3166-1 alpha-3). */
const HOME = 'ARG';
const MAX_COUNTRIES = 8;
const NO_DATA = 'sin datos';

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function orderedSelection(countries: string[]): string[] {
  return [...countries].sort((a, b) => (a === HOME ? -1 : b === HOME ? 1 : a < b ? -1 : a > b ? 1 : 0));
}

export default function Scene() {
  const yearFloat = useStore((s) => s.yearFloat);
  const province = useStore((s) => s.province);
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
  const label = indicator ? indicatorLabel(indicator) : '';
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

  if (status === 'loading') return <SceneLoading />;
  if (status === 'error' || !data || !indicator) return <SceneError />;

  const displayed = records.filter((r) => r.indicator === indicator && selected.includes(r.country));
  const sources = unique(displayed.map((r) => r.source)).sort();
  const latest = displayed.map((r) => r.retrieved_at).sort().at(-1);

  const longTable =
    longAsTable && view
      ? {
          columns: [{ key: 'year', header: 'Año' }, ...view.series.map((s) => ({ key: s.country, header: s.country }))],
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
    <SceneShell
      title="Argentina en el largo plazo"
      subtitle="Desde 1880 hasta hoy, frente a sus pares de América Latina"
      sources={sources}
      retrievedAt={latest}
    >
      {province !== null && (
        <ScopeNote>Los datos de esta escena son nacionales: el filtro de provincia no aplica.</ScopeNote>
      )}

      <FilterBar label="Indicador y vista">
        {indicators.map((i) => (
          <FilterChip key={i} pressed={i === indicator} onClick={() => setIndicatorChoice(i)}>
            {indicatorLabel(i)}
          </FilterChip>
        ))}
        <FilterChip pressed={mode === 'level'} onClick={() => setMode('level')}>
          Nivel
        </FilterChip>
        <FilterChip pressed={mode === 'index'} onClick={() => setMode('index')}>
          Índice
        </FilterChip>
      </FilterBar>

      {available.length === 0 ? (
        <div style={{ color: 'var(--state-warning)' }}>Ningún país tiene datos para este indicador.</div>
      ) : (
        <>
          <FilterBar label="Países">
            {available.map((c) => (
              <FilterChip
                key={c}
                pressed={selected.includes(c)}
                disabled={c === HOME}
                onClick={() => toggleCountry(c)}
                onMouseEnter={() => setHovered(c)}
                onMouseLeave={() => setHovered(null)}
              >
                {c}
              </FilterChip>
            ))}
          </FilterBar>
          {limitReached && (
            <div style={{ color: 'var(--state-warning)', marginBottom: 'var(--space-sm)' }}>
              {`Máximo ${MAX_COUNTRIES} países a la vez.`}
            </div>
          )}
          {view && view.indexUnavailable && (
            <div style={{ color: 'var(--state-warning)', marginBottom: 'var(--space-sm)' }}>
              La vista de índice no está disponible: ningún año tiene un valor positivo para todos los países seleccionados. Se muestran los niveles.
            </div>
          )}

          <div style={{ color: 'var(--muted)', marginBottom: 'var(--space-sm)', display: 'flex', gap: 'var(--space-md)' }}>
            <span>Año {year}</span>
            <input
              type="range"
              aria-label="Año del cursor"
              min={view?.years[0] ?? year}
              max={view?.years[view.years.length - 1] ?? year}
              value={year}
              onChange={(e) => dispatch({ type: 'setYear', year: Number(e.target.value) })}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-lg)', flex: '1 0 auto' }}>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span>Largo plazo (las franjas de eras son provisorias)</span>
                <TableToggle pressed={longAsTable} onToggle={() => setLongAsTable(!longAsTable)} />
              </div>
              <div style={{ flex: 1, minHeight: '280px' }}>
                {longTable && <DataTable caption="Largo plazo" columns={longTable.columns} data={longTable.rows} />}
                {!longTable && longRun && <EChart option={longRun.option} aria-label={longRun.summary} />}
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span>Puesto en {year}</span>
                <TableToggle pressed={barsAsTable} onToggle={() => setBarsAsTable(!barsAsTable)} />
              </div>
              <div style={{ flex: 1, minHeight: '280px' }}>
                {barsAsTable ? (
                  <DataTable
                    caption="Ranking"
                    columns={[
                      { key: 'rank', header: 'Puesto' },
                      { key: 'country', header: 'País' },
                      { key: 'value', header: 'Valor' }
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
              <span>{`Puesto de ${HOME} a lo largo del tiempo`}</span>
              <TableToggle pressed={historyAsTable} onToggle={() => setHistoryAsTable(!historyAsTable)} />
            </div>
            <div style={{ flex: 1, minHeight: '180px' }}>
              {historyAsTable ? (
                <DataTable
                  caption="Historia del puesto"
                  columns={[
                    { key: 'year', header: 'Año' },
                    { key: 'rank', header: 'Puesto' },
                    { key: 'of', header: 'De' }
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
        </>
      )}
    </SceneShell>
  );
}
