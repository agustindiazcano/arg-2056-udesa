import React, { useState, useMemo } from 'react';
import { useStore } from '../../state/store.js';
import { useDataset } from '../../data/useDataset.js';
import {
  parseComposition,
  parseProjects,
  parseResourceProduction,
  selectComposition,
  CompositionKind
} from '../../types/index.js';
import { PROVINCES } from '../../types/province.js';
import { buildTreemap } from '../../charts/builders/treemap.js';
import { buildProvinceBars } from '../../charts/builders/provinceBars.js';
import { buildTrend } from '../../charts/builders/trend.js';
import { selectProjectsForTable, getAvailableYears, clampYear } from './selectors.js';
import { resourceMapValues } from './mapValues.js';
import { ProvinceMap, useProvinces } from '../forecast/ProvinceMap.js';
import { EChart } from '../../charts/EChart.js';
import { DataTable } from '../../charts/DataTable.js';
import { formatValue } from '../../charts/format.js';
import { Chart2D3D } from '../../charts3d/Chart2D3D.js';
import { barsSpec } from '../../charts3d/specs.js';
import { indicatorSentence, projectStatusLabel, resourceLabel } from '../../content/labels.js';
import { Dashboard } from '../../dashboard/Dashboard.js';
import type { DashView } from '../../dashboard/types.js';
import { ChartPanel } from '../../ui/ChartPanel.js';
import { FilterBar, FilterChip } from '../../ui/FilterBar.js';
import { ScopeNote } from '../../ui/ScopeNote.js';
import { SceneError, SceneLoading } from '../../ui/SceneStatus.js';
import { Tile, TileGrid } from '../../ui/Tile.js';

const RESOURCES = ['lithium', 'copper', 'gold', 'oil', 'gas'];
const NO_DATA = 'sin datos';

export default function Scene() {
  const yearFloat = useStore(state => state.yearFloat);
  const currentYear = Math.floor(yearFloat);
  const province = useStore(state => state.province);

  const [kind, setKind] = useState<CompositionKind>('exports_by_product'); // the brief says "exports (or GDP)"; exports by default
  const [selectedResource, setSelectedResource] = useState('lithium');

  const provinces = useProvinces();
  const dispatch = useStore(state => state.dispatch);

  const { status: compStatus, data: compData } = useDataset('composition', parseComposition);
  const { status: projStatus, data: projData } = useDataset('projects', parseProjects);
  const { status: rpStatus, data: rpData } = useDataset('resource_production', parseResourceProduction);

  const isLoading = compStatus === 'loading' || projStatus === 'loading' || rpStatus === 'loading';
  const isError = compStatus === 'error' || projStatus === 'error' || rpStatus === 'error';

  const compositionYear = useMemo(() => {
    if (!compData) return currentYear;
    const kindRecords = compData.filter(r => r.kind === kind);
    const available = getAvailableYears(kindRecords);
    return clampYear(currentYear, available);
  }, [compData, kind, currentYear]);

  const rpYear = useMemo(() => {
    if (!rpData) return currentYear;
    const resRecords = rpData.filter(r => r.resource === selectedResource);
    const available = getAvailableYears(resRecords);
    return clampYear(currentYear, available);
  }, [rpData, selectedResource, currentYear]);

  // the trend follows the selected province when the data has a series for it, else it stays national
  const trendGeo = useMemo(() => {
    const hasSeries = province !== null && rpData?.some(r => r.resource === selectedResource && r.geo === province && r.value !== null);
    return hasSeries ? province : 'AR';
  }, [province, rpData, selectedResource]);

  const mapValues = useMemo(
    () =>
      rpData && provinces.status === 'success'
        ? resourceMapValues(rpData, provinces.geo, { resource: selectedResource, year: rpYear })
        : null,
    [rpData, provinces, selectedResource, rpYear]
  );

  const treemapResult = useMemo(() => {
    if (!compData) return null;
    const records = selectComposition(compData, { kind, year: compositionYear });
    return buildTreemap(records);
  }, [compData, kind, compositionYear]);

  const provinceBarsResult = useMemo(() => {
    if (!rpData) return null;
    return buildProvinceBars(rpData, { resource: selectedResource, year: rpYear, topN: 10, highlight: province });
  }, [rpData, selectedResource, rpYear, province]);

  const trendResult = useMemo(() => {
    if (!rpData) return null;
    return buildTrend(rpData, { resource: selectedResource, geo: trendGeo });
  }, [rpData, selectedResource, trendGeo]);

  const projectsTableData = useMemo(() => {
    if (!projData) return [];
    return selectProjectsForTable(projData, selectedResource).map(row => ({
      ...row,
      status: projectStatusLabel(row.status)
    }));
  }, [projData, selectedResource]);

  // Aggregate sources for the footer
  const sourcesAndDates = useMemo(() => {
    const s = new Set<string>();
    const d = new Set<string>();
    const add = (records: { source?: string; retrieved_at?: string }[]) => {
      records.forEach(r => {
        if (r.source) s.add(r.source);
        if (r.retrieved_at) d.add(r.retrieved_at);
      });
    };
    if (compData) add(compData);
    if (rpData) add(rpData);
    if (projData) add(projData);
    const dates = Array.from(d).sort();
    return { sources: Array.from(s), latestDate: dates.length > 0 ? dates[dates.length - 1] : undefined };
  }, [compData, rpData, projData]);

  if (isLoading) return <SceneLoading />;
  if (isError) return <SceneError />;

  const resourceName = resourceLabel(selectedResource);
  const resourceUnit = rpData?.find(r => r.resource === selectedResource)?.unit;
  const provinceName = (geo: string) => PROVINCES.find(p => p.id === geo)?.name ?? geo;
  const trendIsProvincial = trendGeo !== 'AR';
  const shortName = (name: string) => (name.length > 14 ? `${name.slice(0, 13)}…` : name);
  const trendTitle = trendIsProvincial ? `Tendencia de ${provinceName(trendGeo)}` : 'Tendencia nacional';

  // the indicators of the right panel, from the production of the selected resource and year
  const yearRows = (rpData ?? []).filter(r => r.resource === selectedResource && r.year === rpYear);
  const national = yearRows.find(r => r.geo === 'AR')?.value ?? null;
  const byProvince = yearRows
    .filter(r => r.geo !== 'AR' && r.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const leader = byProvince[0];

  const views: DashView[] = [
    {
      id: 'composition',
      name: 'Composición',
      thumb: { kind: 'treemap' },
      content: (
        <ChartPanel
          title={`Composición (${compositionYear})`}
          actions={
            <FilterBar label="Composición">
              <FilterChip pressed={kind === 'exports_by_product'} onClick={() => setKind('exports_by_product')}>
                Exportaciones
              </FilterChip>
              <FilterChip pressed={kind === 'gdp_by_sector'} onClick={() => setKind('gdp_by_sector')}>
                PIB
              </FilterChip>
            </FilterBar>
          }
          chart={treemapResult && <EChart option={treemapResult.option} aria-label={treemapResult.summary} />}
          table={
            compData && (
              <DataTable
                caption="Composición"
                columns={[
                  { key: 'group', header: 'Grupo' },
                  { key: 'label', header: 'Categoría' },
                  { key: 'value_usd', header: 'Valor (USD)', format: 'usd' }
                ]}
                data={selectComposition(compData, { kind, year: compositionYear })}
                pageSize="fit"
              />
            )
          }
        />
      )
    },
    {
      id: 'by-province',
      name: 'Por provincia',
      thumb: { kind: 'bars', values: byProvince.slice(0, 8).map(r => r.value ?? 0) },
      content: (
        <ChartPanel
          title={`Producción por provincia (${rpYear})`}
          chart={
            provinceBarsResult && (
              <Chart2D3D
                spec={barsSpec(
                  byProvince.slice(0, 10).map(r => ({ label: shortName(provinceName(r.geo)), value: r.value })),
                  {
                    title: `Producción por provincia (${rpYear})`,
                    unit: resourceUnit ?? '',
                    highlight: province ? shortName(provinceName(province)) : null,
                    summary: provinceBarsResult.summary
                  }
                )}
              >
                <EChart option={provinceBarsResult.option} aria-label={provinceBarsResult.summary} />
              </Chart2D3D>
            )
          }
          table={
            rpData && (
              <DataTable
                caption={`Producción por provincia (${rpYear})`}
                columns={[
                  { key: 'geo', header: 'Provincia' },
                  { key: 'value', header: 'Valor', format: 'unit', unit: resourceUnit }
                ]}
                data={rpData
                  .filter(r => r.resource === selectedResource && r.year === rpYear && r.geo !== 'AR')
                  .sort((a, b) => (b.value || 0) - (a.value || 0))
                  .map(r => ({ ...r, geo: provinceName(r.geo) }))}
                pageSize="fit"
              />
            )
          }
        />
      )
    },
    {
      id: 'trend',
      name: 'Tendencia',
      thumb: { kind: 'line', values: (rpData ?? []).filter(r => r.resource === selectedResource && r.geo === trendGeo).sort((a, b) => a.year - b.year).map(r => r.value ?? 0) },
      content: (
        <ChartPanel
          title={trendTitle}
          chart={trendResult && <EChart option={trendResult.option} aria-label={trendResult.summary} />}
          table={
            rpData && (
              <DataTable
                caption={trendTitle}
                columns={[
                  { key: 'year', header: 'Año' },
                  { key: 'value', header: 'Valor', format: 'unit', unit: resourceUnit }
                ]}
                data={rpData.filter(r => r.resource === selectedResource && r.geo === trendGeo).sort((a, b) => a.year - b.year)}
                pageSize="fit"
              />
            )
          }
        />
      )
    },
    {
      id: 'map',
      name: 'Mapa',
      thumb: { kind: 'map' },
      content: (
        <ChartPanel
          title={`Mapa de producción por provincia (${rpYear})`}
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
                <ProvinceMap
                  geo={provinces.geo}
                  values={mapValues}
                  unit={resourceUnit ?? ''}
                  indicatorLabel={indicatorSentence('resource_production', selectedResource)}
                  metric="level"
                  selectedId={province}
                  year={rpYear}
                  observed
                  hideTitle
                  onSelect={(id) => dispatch({ type: 'selectProvince', province: id })}
                />
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
      id: 'projects',
      name: 'Proyectos',
      thumb: { kind: 'table' },
      content: (
        <ChartPanel
          title={`Principales proyectos de inversión (${resourceName})`}
          chart={
            <DataTable
              caption={`Proyectos de inversión de ${resourceName}`}
              columns={[
                { key: 'name', header: 'Nombre' },
                { key: 'province', header: 'Provincia' },
                { key: 'status', header: 'Estado' },
                { key: 'capex_usd', header: 'CAPEX (USD)', format: 'usd' },
                { key: 'start_year', header: 'Año de inicio' },
                { key: 'capacity', header: 'Capacidad' }
              ]}
              data={projectsTableData}
              pageSize="fit"
            />
          }
        />
      )
    }
  ];

  return (
    <Dashboard
      title="Recursos naturales"
      subtitle="Inversión, producción y composición de la economía"
      legend={[
        { label: 'Provincia elegida', tone: 'blue' },
        { label: 'Otras provincias', tone: 'muted' }
      ]}
      sources={sourcesAndDates.sources}
      retrievedAt={sourcesAndDates.latestDate}
      notes={
        <>
          {province !== null && <ScopeNote>La composición es nacional: el filtro de provincia no aplica.</ScopeNote>}
          {province !== null && !trendIsProvincial && (
            <ScopeNote>
              {`No hay serie provincial de ${resourceName} para ${provinceName(province)}: se muestra el total nacional.`}
            </ScopeNote>
          )}
        </>
      }
      rail={
        <FilterBar label="Recurso">
          {RESOURCES.map(r => (
            <FilterChip key={r} pressed={selectedResource === r} onClick={() => setSelectedResource(r)}>
              {resourceLabel(r)}
            </FilterChip>
          ))}
        </FilterBar>
      }
      tiles={
        <TileGrid>
          <Tile id="tile-national" label={`Producción nacional en ${rpYear}`}>
            <div className="tile-value">{national === null ? NO_DATA : formatValue(national, resourceUnit ?? '')}</div>
          </Tile>
          <Tile id="tile-leader" label="Provincia que más produce">
            <div className="tile-value">{leader ? provinceName(leader.geo) : NO_DATA}</div>
            {leader && <div className="tile-sub">{formatValue(leader.value, resourceUnit ?? '')}</div>}
          </Tile>
          <Tile id="tile-provinces" label="Provincias con datos">
            <div className="tile-value">{`${byProvince.length} de ${PROVINCES.length}`}</div>
          </Tile>
          <Tile id="tile-projects" label="Proyectos listados">
            <div className="tile-value">{projectsTableData.length}</div>
          </Tile>
        </TileGrid>
      }
      views={views}
    />
  );
}
