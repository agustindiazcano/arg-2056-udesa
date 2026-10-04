import React, { useMemo, useState } from 'react';
import { useStore } from '../../state/store.js';
import { useDataset } from '../../data/useDataset.js';
import { parseForecastOutput, SCENARIOS } from '../../types/index.js';
import type { Indicator, ResourceId } from '../../types/index.js';
import { buildFan } from '../../charts/builders/fan.js';
import { buildRanking } from '../../charts/builders/ranking.js';
import { formatValue } from '../../charts/format.js';
import { indicatorLabel, indicatorSentence, resourceLabel, scenarioLabel } from '../../content/labels.js';
import { FilterBar, FilterChip } from '../../ui/FilterBar.js';
import { SceneShell } from '../../ui/SceneShell.js';
import { SceneError, SceneLoading } from '../../ui/SceneStatus.js';
import { TableToggle } from '../../ui/TableToggle.js';
import { EChart } from '../../charts/EChart.js';
import { DataTable } from '../../charts/DataTable.js';
import { ProvinceMap, useProvinces } from './ProvinceMap.js';
import { StatTiles } from './StatTiles.js';
import { provinceMapValues } from './mapSelectors.js';
import type { MapMetric } from './mapSelectors.js';
import { clampYear, forecastView, rankProvinces } from './selectors.js';
import type { ForecastView, RankRow } from './selectors.js';

const NO_DATA = 'sin datos';

function cell(value: number | undefined, unit: string): string {
  return value === undefined ? NO_DATA : formatValue(value, unit);
}

function fanTable(view: ForecastView) {
  const years = new Set<number>();
  for (const s of SCENARIOS) for (const p of view.series[s]?.points ?? []) years.add(p.year);
  const columns = [{ key: 'year', header: 'Año' }];
  for (const s of SCENARIOS) {
    for (const q of ['p10', 'p50', 'p90'] as const) {
      columns.push({ key: `${s}_${q}`, header: `${scenarioLabel(s)} ${q}` });
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
  if (row.rankChange === 0) return 'sin cambios';
  return `${row.rankChange > 0 ? 'sube' : 'baja'} ${Math.abs(row.rankChange)}`;
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

  if (status === 'loading') return <SceneLoading />;
  if (status === 'error' || !data || !view || !indicator) return <SceneError />;

  const fanRows = fanAsTable ? fanTable(view) : null;

  return (
    <SceneShell
      title="Pronóstico 2056"
      subtitle="Tres escenarios, un rango de resultados simulados"
      sources={[
        data.source,
        `modelo ${data.model_version}`,
        `horizonte ${data.horizon.start_year}-${data.horizon.end_year}`
      ]}
      retrievedAt={data.generated_at.slice(0, 10)}
      dateLabel="generado el"
    >
      <p style={{ margin: '0 0 var(--space-md)', color: 'var(--ink-2)' }}>
        Los escenarios son proyecciones condicionales, no predicciones.
      </p>

      <FilterBar label="Filtros del pronóstico">
        {indicators.map((i) => (
          <FilterChip key={i} pressed={i === indicator} onClick={() => setIndicatorChoice(i)}>
            {indicatorLabel(i)}
          </FilterChip>
        ))}
        {resources.length > 0 &&
          resources.map((r) => (
            <FilterChip key={r} pressed={r === resource} onClick={() => setResourceChoice(r)}>
              {resourceLabel(r)}
            </FilterChip>
          ))}
      </FilterBar>

      <div style={{ color: 'var(--muted)', marginBottom: 'var(--space-sm)' }}>Año {year}</div>

      {view.missing.length > 0 && (
        <div style={{ color: 'var(--state-warning)', marginBottom: 'var(--space-sm)' }}>
          Faltan series para la selección actual: {view.missing.map(scenarioLabel).join(', ')}
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-lg)', flex: '1 0 auto' }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
            <span>Abanico del pronóstico</span>
            <TableToggle pressed={fanAsTable} onToggle={() => setFanAsTable(!fanAsTable)} />
          </div>
          <div style={{ flex: 1, minHeight: '280px' }}>
            {fanRows && <DataTable caption="Abanico del pronóstico" columns={fanRows.columns} data={fanRows.rows} />}
            {!fanRows && fan && <EChart option={fan.option} aria-label={fan.summary} />}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
          <FilterBar label="Vista de provincias">
            <FilterChip pressed={tab === 'map'} onClick={() => setUserTab('map')}>
              Mapa
            </FilterChip>
            <FilterChip pressed={tab === 'ranking'} onClick={() => setUserTab('ranking')}>
              Ranking
            </FilterChip>
            {tab === 'map' && (
              <>
                <FilterChip pressed={metric === 'level'} onClick={() => setMetric('level')}>
                  Nivel
                </FilterChip>
                <FilterChip pressed={metric === 'change'} onClick={() => setMetric('change')}>
                  {`Cambio desde ${data.horizon.start_year}`}
                </FilterChip>
              </>
            )}
          </FilterBar>

          {tab === 'map' && provinces.status === 'loading' && (
            <div style={{ color: 'var(--muted)' }}>Cargando la geometría de las provincias...</div>
          )}
          {tab === 'map' && provinces.status === 'error' && (
            <div style={{ color: 'var(--state-warning)' }}>
              {`La geometría de las provincias no está disponible: ${provinces.message}`}
            </div>
          )}
          {tab === 'map' && provinces.status === 'success' && mapValues && (
            <ProvinceMap
              geo={provinces.geo}
              values={mapValues}
              unit={data.series.find((s) => s.indicator === indicator && s.resource === resource)?.unit ?? ''}
              indicatorLabel={indicatorSentence(indicator, resource)}
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
                <span>Provincias en {year}</span>
                <TableToggle pressed={rankAsTable} onToggle={() => setRankAsTable(!rankAsTable)} />
              </div>
              <div style={{ flex: 1, minHeight: '280px' }}>
                {ranking && ranking.rows.length === 0 && (
                  <div style={{ color: 'var(--muted)' }}>
                    {ranking.excluded > 0
                      ? `Ninguna provincia tiene un valor para ${year}.`
                      : 'No hay series provinciales para este indicador en los datos.'}
                  </div>
                )}
                {ranking && ranking.rows.length > 0 && rankAsTable && (
                  <DataTable
                    caption="Ranking de provincias"
                    columns={[
                      { key: 'rank', header: 'Puesto' },
                      { key: 'name', header: 'Provincia' },
                      { key: 'p10', header: 'p10' },
                      { key: 'p50', header: 'p50' },
                      { key: 'p90', header: 'p90' },
                      { key: 'change', header: 'Cambio' }
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

      {provinces.status === 'success' && (
        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ink-2)' }}>
          {`Geometría de las provincias: ${provinces.meta.source}. ${provinces.meta.attribution}`}
        </div>
      )}
    </SceneShell>
  );
}
