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
import { EChart } from '../../charts/EChart.js';
import { DataTable } from '../../charts/DataTable.js';
import { projectStatusLabel, resourceLabel } from '../../content/labels.js';
import { FilterBar, FilterChip } from '../../ui/FilterBar.js';
import { SceneShell } from '../../ui/SceneShell.js';
import { ScopeNote } from '../../ui/ScopeNote.js';
import { SceneError, SceneLoading } from '../../ui/SceneStatus.js';
import { TableToggle } from '../../ui/TableToggle.js';

const RESOURCES = ['lithium', 'copper', 'gold', 'oil', 'gas'];

export default function Scene() {
  const yearFloat = useStore(state => state.yearFloat);
  const currentYear = Math.floor(yearFloat);
  const province = useStore(state => state.province);

  const [kind, setKind] = useState<CompositionKind>('exports_by_product'); // the brief says "exports (or GDP)"; exports by default
  const [selectedResource, setSelectedResource] = useState('lithium');

  const [treemapTable, setTreemapTable] = useState(false);
  const [barsTable, setBarsTable] = useState(false);
  const [trendTable, setTrendTable] = useState(false);

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

  return (
    <SceneShell
      title="Recursos naturales"
      subtitle="Inversión, producción y composición de la economía"
      sources={sourcesAndDates.sources}
      retrievedAt={sourcesAndDates.latestDate}
    >
      {province !== null && <ScopeNote>La composición es nacional: el filtro de provincia no aplica.</ScopeNote>}
      {province !== null && !trendIsProvincial && (
        <ScopeNote>
          {`No hay serie provincial de ${resourceName} para ${provinceName(province)}: se muestra el total nacional.`}
        </ScopeNote>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-lg)', flex: '1 0 auto' }}>

        {/* Left Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <FilterBar label="Composición">
              <FilterChip pressed={kind === 'exports_by_product'} onClick={() => setKind('exports_by_product')}>
                Exportaciones
              </FilterChip>
              <FilterChip pressed={kind === 'gdp_by_sector'} onClick={() => setKind('gdp_by_sector')}>
                PIB
              </FilterChip>
            </FilterBar>
            <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>Año: {compositionYear}</span>
            <TableToggle pressed={treemapTable} onToggle={() => setTreemapTable(!treemapTable)} />
          </div>

          <div style={{ flex: 1, minHeight: '300px' }}>
            {!treemapTable && treemapResult && (
              <EChart option={treemapResult.option} aria-label={treemapResult.summary} />
            )}
            {treemapTable && compData && (
              <DataTable
                caption="Composición"
                columns={[
                  { key: 'group', header: 'Grupo' },
                  { key: 'label', header: 'Categoría' },
                  { key: 'value_usd', header: 'Valor (USD)', format: 'usd' }
                ]}
                data={selectComposition(compData, { kind, year: compositionYear })}
              />
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <FilterBar label="Recurso">
            {RESOURCES.map(r => (
              <FilterChip key={r} pressed={selectedResource === r} onClick={() => setSelectedResource(r)}>
                {resourceLabel(r)}
              </FilterChip>
            ))}
          </FilterBar>

          <div style={{ display: 'flex', gap: 'var(--space-md)', flex: 1 }}>

            {/* Province Bars */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span>Producción por provincia ({rpYear})</span>
                <TableToggle pressed={barsTable} onToggle={() => setBarsTable(!barsTable)} />
              </div>
              <div style={{ flex: 1, minHeight: '200px' }}>
                {!barsTable && provinceBarsResult && (
                  <EChart option={provinceBarsResult.option} aria-label={provinceBarsResult.summary} />
                )}
                {barsTable && rpData && (
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
                  />
                )}
              </div>
            </div>

            {/* National Trend */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span>{trendIsProvincial ? `Tendencia de ${provinceName(trendGeo)}` : 'Tendencia nacional'}</span>
                <TableToggle pressed={trendTable} onToggle={() => setTrendTable(!trendTable)} />
              </div>
              <div style={{ flex: 1, minHeight: '200px' }}>
                {!trendTable && trendResult && (
                  <EChart option={trendResult.option} aria-label={trendResult.summary} />
                )}
                {trendTable && rpData && (
                  <DataTable
                    caption={trendIsProvincial ? `Tendencia de ${provinceName(trendGeo)}` : 'Tendencia nacional'}
                    columns={[
                      { key: 'year', header: 'Año' },
                      { key: 'value', header: 'Valor', format: 'unit', unit: resourceUnit }
                    ]}
                    data={rpData.filter(r => r.resource === selectedResource && r.geo === trendGeo).sort((a, b) => a.year - b.year)}
                  />
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Projects Table */}
      <div style={{ marginTop: 'var(--space-lg)' }}>
        <h3>Principales proyectos de inversión ({resourceName})</h3>
        <div>
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
          />
        </div>
      </div>
    </SceneShell>
  );
}
