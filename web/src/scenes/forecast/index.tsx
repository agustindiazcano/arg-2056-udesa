import React, { useMemo, useState } from 'react';
import { useStore } from '../../state/store.js';
import { useDataset } from '../../data/useDataset.js';
import { parseForecastOutput, PROVINCES, SCENARIOS } from '../../types/index.js';
import type { ProvinceId } from '../../types/index.js';
import type { Indicator, ResourceId } from '../../types/index.js';
import { buildFan } from '../../charts/builders/fan.js';
import { buildRanking } from '../../charts/builders/ranking.js';
import { formatPercent, formatValue } from '../../charts/format.js';
import { Chart2D3D } from '../../charts3d/Chart2D3D.js';
import { barsSpec } from '../../charts3d/specs.js';
import { indicatorLabel, indicatorSentence, resourceLabel, scenarioLabel } from '../../content/labels.js';
import { Dashboard } from '../../dashboard/Dashboard.js';
import type { DashView } from '../../dashboard/types.js';
import { ChartPanel } from '../../ui/ChartPanel.js';
import { FilterBar, FilterChip } from '../../ui/FilterBar.js';
import { SceneError, SceneLoading } from '../../ui/SceneStatus.js';
import { EChart } from '../../charts/EChart.js';
import { DataTable } from '../../charts/DataTable.js';
import { ProvinceMap, useProvinces } from './ProvinceMap.js';
import { StatTiles } from './StatTiles.js';
import { mapSummary, provinceMapValues } from './mapSelectors.js';
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

  const mapValues = useMemo(
    () =>
      data && indicator && provinces.status === 'success'
        ? provinceMapValues(data, provinces.geo, { indicator, resource, year, scenario, aiOverlay, metric })
        : null,
    [data, indicator, resource, year, scenario, aiOverlay, metric, provinces]
  );

  if (status === 'loading') return <SceneLoading />;
  if (status === 'error' || !data || !view || !indicator) return <SceneError />;

  const fanRows = fanTable(view);
  const unit = data.series.find((x) => x.indicator === indicator && x.resource === resource)?.unit ?? '';
  const selectedSeries = view.series[scenario] ?? SCENARIOS.map((sc) => view.series[sc]).find((x) => x !== undefined);

  const views: DashView[] = [
    {
      id: 'fan',
      name: 'Abanico',
      thumb: { kind: 'fan', values: selectedSeries?.points.map((pt) => pt.p50) },
      content: (
        <ChartPanel
          title="Abanico del pronóstico"
          chart={fan && <EChart option={fan.option} aria-label={fan.summary} />}
          table={<DataTable caption="Abanico del pronóstico" columns={fanRows.columns} data={fanRows.rows} pageSize="fit" />}
        />
      )
    },
    {
      id: 'map',
      name: 'Mapa',
      thumb: { kind: 'map' },
      content: (
        <ChartPanel
          title={`Mapa de provincias (${year})`}
          actions={
            <FilterBar label="Medida del mapa">
              <FilterChip pressed={metric === 'level'} onClick={() => setMetric('level')}>
                Nivel
              </FilterChip>
              <FilterChip pressed={metric === 'change'} onClick={() => setMetric('change')}>
                {`Cambio desde ${data.horizon.start_year}`}
              </FilterChip>
            </FilterBar>
          }
          chart={
            <div className="map-view">
              {provinces.status === 'loading' && (
                <div style={{ color: 'var(--muted)' }}>Cargando la geometría de las provincias...</div>
              )}
              {provinces.status === 'error' && (
                <div style={{ color: 'var(--state-warning)' }}>
                  {`La geometría de las provincias no está disponible: ${provinces.message}`}
                </div>
              )}
              {provinces.status === 'success' && mapValues && (
                <Chart2D3D
                  spec={{
                    kind: 'map',
                    title: `Mapa de provincias (${year})`,
                    geo: provinces.geo,
                    values: mapValues,
                    metric,
                    selectedId: province,
                    formatValue: (v) => (metric === 'level' ? formatValue(v, unit) : `${formatPercent(v)} por año`),
                    onSelect: (id) => dispatch({ type: 'selectProvince', province: id as ProvinceId | null }),
                    summary: mapSummary(mapValues, metric, indicatorSentence(indicator, resource), year, unit)
                  }}
                >
                  <ProvinceMap
                    geo={provinces.geo}
                    values={mapValues}
                    unit={unit}
                    indicatorLabel={indicatorSentence(indicator, resource)}
                    metric={metric}
                    selectedId={province}
                    scenario={scenario}
                    year={year}
                    hideTitle
                    onSelect={(id) => dispatch({ type: 'selectProvince', province: id })}
                  />
                </Chart2D3D>
              )}
              {provinces.status === 'success' && (
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ink-2)' }}>
                  {`Geometría de las provincias: ${provinces.meta.source}. ${provinces.meta.attribution}`}
                </div>
              )}
            </div>
          }
        />
      )
    },
    {
      id: 'ranking',
      name: 'Ranking',
      thumb: { kind: 'bars', values: ranking?.rows.map((r) => r.p50) },
      content: (
        <ChartPanel
          title={`Provincias en ${year}`}
          chart={
            ranking && ranking.rows.length > 0 ? (
              <Chart2D3D
                spec={barsSpec(
                  ranking.rows.map((r) => ({ label: r.name.length > 14 ? `${r.name.slice(0, 13)}…` : r.name, value: r.p50 })),
                  {
                    title: `Provincias en ${year}`,
                    unit: ranking.unit,
                    highlight: province
                      ? (() => {
                          const n = PROVINCES.find((p) => p.id === province)?.name ?? '';
                          return n.length > 14 ? `${n.slice(0, 13)}…` : n;
                        })()
                      : null,
                    summary: ranking.built.summary
                  }
                )}
              >
                <EChart option={ranking.built.option} aria-label={ranking.built.summary} />
              </Chart2D3D>
            ) : (
              <div style={{ color: 'var(--muted)' }}>
                {ranking && ranking.excluded > 0
                  ? `Ninguna provincia tiene un valor para ${year}.`
                  : 'No hay series provinciales para este indicador en los datos.'}
              </div>
            )
          }
          table={
            ranking && ranking.rows.length > 0 ? (
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
                pageSize="fit"
              />
            ) : undefined
          }
        />
      )
    }
  ];

  return (
    <Dashboard
      title="Pronóstico 2056"
      subtitle="Tres escenarios, un rango de resultados simulados"
      legend={[
        { label: 'Mediana (p50)', tone: 'blue' },
        { label: 'Banda p10 a p90', tone: 'muted' }
      ]}
      sources={[
        data.source,
        `modelo ${data.model_version}`,
        `horizonte ${data.horizon.start_year}-${data.horizon.end_year}`
      ]}
      retrievedAt={data.generated_at.slice(0, 10)}
      dateLabel="generado el"
      notes={
        <>
          <p className="scope-note">Los escenarios son proyecciones condicionales, no predicciones.</p>
          <p className="scope-note">Año {year}</p>
          {view.missing.length > 0 && (
            <p style={{ color: 'var(--state-warning)', margin: 0, fontSize: 'var(--font-sm)' }}>
              Faltan series para la selección actual: {view.missing.map(scenarioLabel).join(', ')}
            </p>
          )}
        </>
      }
      rail={
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
      }
      tiles={<StatTiles view={view} scenario={scenario} aiOverlay={aiOverlay} />}
      views={views}
    />
  );
}
