import React, { useMemo, useState } from 'react';
import { useStore } from '../../state/store.js';
import { useDataset } from '../../data/useDataset.js';
import { parseForecastOutput, SCENARIOS } from '../../types/index.js';
import type { Indicator, ResourceId, Scenario } from '../../types/index.js';
import { buildFan } from '../../charts/builders/fan.js';
import { buildRanking } from '../../charts/builders/ranking.js';
import { formatValue } from '../../charts/format.js';
import { EChart } from '../../charts/EChart.js';
import { DataTable } from '../../charts/DataTable.js';
import { ProvinceMap, useProvinces } from './ProvinceMap.js';
import { StatTiles } from './StatTiles.js';
import { provinceMapValues } from './mapSelectors.js';
import type { MapMetric } from './mapSelectors.js';
import { clampYear, forecastView, rankProvinces } from './selectors.js';
import type { ForecastView, RankRow } from './selectors.js';

const INDICATOR_LABEL: Record<Indicator, string> = {
  gdp_constant_usd: 'GDP',
  gdp_per_capita_usd: 'GDP per capita',
  population: 'Population',
  hdi: 'HDI',
  resource_production: 'Resource production'
};

const SCENARIO_LABEL: Record<Scenario, string> = {
  pessimistic: 'Pessimistic',
  expected: 'Expected',
  optimistic: 'Optimistic'
};

const NO_DATA = 'no data';

function cell(value: number | undefined, unit: string): string {
  return value === undefined ? NO_DATA : formatValue(value, unit);
}

function fanTable(view: ForecastView) {
  const years = new Set<number>();
  for (const s of SCENARIOS) for (const p of view.series[s]?.points ?? []) years.add(p.year);
  const columns = [{ key: 'year', header: 'Year' }];
  for (const s of SCENARIOS) {
    for (const q of ['p10', 'p50', 'p90'] as const) {
      columns.push({ key: `${s}_${q}`, header: `${SCENARIO_LABEL[s]} ${q}` });
    }
  }
  const rows = [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const row: Record<string, string | number> = { year };
      for (const s of SCENARIOS) {
        const series = view.series[s];
        const point = series?.points.find((p) => p.year === year);
        for (const q of ['p10', 'p50', 'p90'] as const) {
          row[`${s}_${q}`] = cell(point?.[q], series?.unit ?? '');
        }
      }
      return row;
    });
  return { columns, rows };
}

function changeText(row: RankRow): string {
  if (row.rankChange === null) return NO_DATA;
  if (row.rankChange === 0) return 'no change';
  return `${row.rankChange > 0 ? 'up' : 'down'} ${Math.abs(row.rankChange)}`;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export default function Scene() {
  const scenario = useStore((s) => s.scenario);
  const yearFloat = useStore((s) => s.yearFloat);
  const province = useStore((s) => s.province);
  const aiState = useStore((s) => s.aiOverlay);
  const dispatch = useStore((s) => s.dispatch);

  const { status, data } = useDataset('forecast_output', parseForecastOutput);

  const [indicatorChoice, setIndicatorChoice] = useState<Indicator | null>(null);
  const [resourceChoice, setResourceChoice] = useState<ResourceId | null>(null);
  const [fanAsTable, setFanAsTable] = useState(false);
  const [rankAsTable, setRankAsTable] = useState(false);
  const [userTab, setUserTab] = useState<'map' | 'ranking' | null>(null);
  const [metric, setMetric] = useState<MapMetric>('level');

  const provinces = useProvinces();

  const aiOverlay = aiState === 'on';

  const indicators = useMemo(() => unique((data?.series ?? []).map((s) => s.indicator)), [data]);
  const indicator: Indicator | undefined =
    indicatorChoice !== null && indicators.includes(indicatorChoice) ? indicatorChoice : indicators[0];

  const resources = useMemo(
    () =>
      unique(
        (data?.series ?? [])
          .filter((s) => s.indicator === indicator && s.resource !== undefined)
          .map((s) => s.resource as ResourceId)
      ),
    [data, indicator]
  );
  const resource: ResourceId | undefined =
    resourceChoice !== null && resources.includes(resourceChoice) ? resourceChoice : resources[0];

  const geo = province ?? 'AR';

  const view = useMemo(
    () => (data && indicator ? forecastView(data, { indicator, resource, geo, aiOverlay }) : null),
    [data, indicator, resource, geo, aiOverlay]
  );

  const year = useMemo(() => {
    if (!data || !view) return Math.floor(yearFloat);
    const anySeries = view.series[scenario] ?? SCENARIOS.map((s) => view.series[s]).find((s) => s !== undefined);
    const points = anySeries
      ? anySeries.points
      : [{ year: data.horizon.start_year }, { year: data.horizon.end_year }];
    return clampYear(yearFloat, points);
  }, [data, view, scenario, yearFloat]);

  const fan = useMemo(
    () => (view && view.missing.length < SCENARIOS.length ? buildFan(view, { scenario, year }) : null),
    [view, scenario, year]
  );

  const ranking = useMemo(() => {
    if (!data || !indicator) return null;
    const result = rankProvinces(data, { indicator, resource, year, scenario, aiOverlay, topN: 10 });
    const unit = data.series.find((s) => s.indicator === indicator && s.resource === resource)?.unit ?? '';
    return { ...result, unit, built: buildRanking(result.rows, { scenario, unit, highlight: province, excluded: result.excluded }) };
  }, [data, indicator, resource, year, scenario, aiOverlay, province]);

  // The map is the default tab once its geometry is available; until then (and if it never is) the ranking is.
  const tab = userTab ?? (provinces.status === 'success' ? 'map' : 'ranking');

  const mapValues = useMemo(
    () =>
      data && indicator && provinces.status === 'success'
        ? provinceMapValues(data, provinces.geo, { indicator, resource, year, scenario, aiOverlay, metric })
        : null,
    [data, indicator, resource, year, scenario, aiOverlay, metric, provinces]
  );

  if (status === 'loading') return <div style={{ color: 'var(--ink)' }}>Loading...</div>;
  if (status === 'error' || !data || !view || !indicator) {
    return <div style={{ color: 'var(--state-critical)' }}>Error loading data.</div>;
  }

  const fanRows = fanAsTable ? fanTable(view) : null;

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
        <h1 style={{ margin: 0 }}>Forecast 2056</h1>
        <p style={{ margin: 0, color: 'var(--ink-2)' }}>Three scenarios, one range of simulated outcomes</p>
        <p style={{ margin: 0, color: 'var(--ink-2)' }}>Scenarios are conditional projections, not predictions.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
        {indicators.map((i) => (
          <button key={i} aria-pressed={i === indicator} onClick={() => setIndicatorChoice(i)}>
            {INDICATOR_LABEL[i]}
          </button>
        ))}
        {resources.length > 0 &&
          resources.map((r) => (
            <button key={r} aria-pressed={r === resource} onClick={() => setResourceChoice(r)}>
              {r}
            </button>
          ))}
        <button aria-pressed={aiOverlay} onClick={() => dispatch({ type: 'setAiOverlay', aiOverlay: aiOverlay ? 'off' : 'on' })}>
          AI overlay
        </button>
        {SCENARIOS.map((s) => (
          <button key={s} aria-pressed={s === scenario} onClick={() => dispatch({ type: 'setScenario', scenario: s })}>
            {SCENARIO_LABEL[s]}
          </button>
        ))}
      </div>

      <div style={{ color: 'var(--muted)', marginBottom: 'var(--space-sm)' }}>Year {year}</div>

      {view.missing.length > 0 && (
        <div style={{ color: 'var(--state-warning)', marginBottom: 'var(--space-sm)' }}>
          Missing series for the current selection: {view.missing.join(', ')}
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-lg)', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
            <span>Forecast fan</span>
            <button aria-pressed={fanAsTable} onClick={() => setFanAsTable(!fanAsTable)}>
              Table view
            </button>
          </div>
          <div style={{ flex: 1, minHeight: '280px' }}>
            {fanRows && <DataTable caption="Forecast fan" columns={fanRows.columns} data={fanRows.rows} />}
            {!fanRows && fan && <EChart option={fan.option} aria-label={fan.summary} />}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <button aria-pressed={tab === 'map'} onClick={() => setUserTab('map')}>
              Map
            </button>
            <button aria-pressed={tab === 'ranking'} onClick={() => setUserTab('ranking')}>
              Ranking
            </button>
            {tab === 'map' && (
              <>
                <button aria-pressed={metric === 'level'} onClick={() => setMetric('level')}>
                  Level
                </button>
                <button aria-pressed={metric === 'change'} onClick={() => setMetric('change')}>
                  {`Change since ${data.horizon.start_year}`}
                </button>
              </>
            )}
          </div>

          {tab === 'map' && provinces.status === 'loading' && (
            <div style={{ color: 'var(--muted)' }}>Loading province geometry...</div>
          )}
          {tab === 'map' && provinces.status === 'error' && (
            <div style={{ color: 'var(--state-warning)' }}>
              {`Province geometry is not available: ${provinces.message}`}
            </div>
          )}
          {tab === 'map' && provinces.status === 'success' && mapValues && (
            <ProvinceMap
              geo={provinces.geo}
              values={mapValues}
              unit={data.series.find((s) => s.indicator === indicator && s.resource === resource)?.unit ?? ''}
              indicatorLabel={resource ? `${INDICATOR_LABEL[indicator]} (${resource})` : INDICATOR_LABEL[indicator]}
              metric={metric}
              selectedId={province}
              scenario={scenario}
              year={year}
              onSelect={(id) => dispatch({ type: 'selectProvince', province: id })}
            />
          )}

          {tab === 'ranking' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span>Provinces in {year}</span>
                <button aria-pressed={rankAsTable} onClick={() => setRankAsTable(!rankAsTable)}>
                  Table view
                </button>
              </div>
              <div style={{ flex: 1, minHeight: '280px' }}>
                {ranking && ranking.rows.length === 0 && (
                  <div style={{ color: 'var(--muted)' }}>
                    {ranking.excluded > 0
                      ? `No province has a value for ${year}.`
                      : 'No province series for this indicator in the data.'}
                  </div>
                )}
                {ranking && ranking.rows.length > 0 && rankAsTable && (
                  <DataTable
                    caption="Province ranking"
                    columns={[
                      { key: 'rank', header: 'Rank' },
                      { key: 'name', header: 'Province' },
                      { key: 'p10', header: 'p10' },
                      { key: 'p50', header: 'p50' },
                      { key: 'p90', header: 'p90' },
                      { key: 'change', header: 'Change' }
                    ]}
                    data={ranking.rows.map((r) => ({
                      rank: r.rank,
                      name: r.name,
                      p10: formatValue(r.p10, ranking.unit),
                      p50: formatValue(r.p50, ranking.unit),
                      p90: formatValue(r.p90, ranking.unit),
                      change: changeText(r)
                    }))}
                  />
                )}
                {ranking && ranking.rows.length > 0 && !rankAsTable && (
                  <EChart option={ranking.built.option} aria-label={ranking.built.summary} />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-md)' }}>
        <StatTiles view={view} scenario={scenario} aiOverlay={aiOverlay} />
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', fontSize: '12px', color: 'var(--ink-2)' }}>
        {`Source: ${data.source}, model ${data.model_version}, generated ${data.generated_at}, horizon ${data.horizon.start_year}-${data.horizon.end_year}`}
      </div>
      {provinces.status === 'success' && (
        <div style={{ fontSize: '12px', color: 'var(--ink-2)' }}>
          {`Province geometry: ${provinces.meta.source}. ${provinces.meta.attribution}`}
        </div>
      )}
    </div>
  );
}
