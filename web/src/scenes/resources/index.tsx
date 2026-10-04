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
import { buildTreemap } from '../../charts/builders/treemap.js';
import { buildProvinceBars } from '../../charts/builders/provinceBars.js';
import { buildTrend } from '../../charts/builders/trend.js';
import { selectProjectsForTable, getAvailableYears, clampYear } from './selectors.js';
import { EChart } from '../../charts/EChart.js';
import { DataTable } from '../../charts/DataTable.js';

export default function Scene() {
  const yearFloat = useStore(state => state.yearFloat);
  const currentYear = Math.floor(yearFloat);

  const [kind, setKind] = useState<CompositionKind>('exports_by_product'); // GDP or exports? Spec says "exports (or GDP) treemap", so let's default to exports_by_product
  // Assuming the available resources for selectors
  const resources = ['lithium', 'copper', 'gold', 'oil', 'gas'];
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

  const treemapResult = useMemo(() => {
    if (!compData) return null;
    const records = selectComposition(compData, { kind, year: compositionYear });
    return buildTreemap(records);
  }, [compData, kind, compositionYear]);

  const provinceBarsResult = useMemo(() => {
    if (!rpData) return null;
    return buildProvinceBars(rpData, { resource: selectedResource, year: rpYear, topN: 10 });
  }, [rpData, selectedResource, rpYear]);

  const trendResult = useMemo(() => {
    if (!rpData) return null;
    return buildTrend(rpData, { resource: selectedResource, geo: 'AR' });
  }, [rpData, selectedResource]);

  const projectsTableData = useMemo(() => {
    if (!projData) return [];
    return selectProjectsForTable(projData, selectedResource);
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
    const sourceStr = Array.from(s).join(', ');
    const dates = Array.from(d).sort();
    const latestDate = dates.length > 0 ? dates[dates.length - 1] : '';
    return { sourceStr, latestDate };
  }, [compData, rpData, projData]);

  if (isLoading) return <div style={{ color: 'var(--ink)' }}>Loading...</div>;
  if (isError) return <div style={{ color: 'var(--state-critical)' }}>Error loading data.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', color: 'var(--ink)', padding: 'var(--space-md)', boxSizing: 'border-box', overflowY: 'auto' }}>
      
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ margin: 0 }}>Natural Resources</h1>
        <p style={{ margin: 0, color: 'var(--ink-2)' }}>Investment, production and economic composition</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-lg)', flex: '1 0 auto' }}>
        
        {/* Left Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button aria-pressed={kind === 'exports_by_product'} onClick={() => setKind('exports_by_product')}>Exports</button>
            <button aria-pressed={kind === 'gdp_by_sector'} onClick={() => setKind('gdp_by_sector')}>GDP</button>
            <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>Year: {compositionYear}</span>
            <button aria-pressed={treemapTable} onClick={() => setTreemapTable(!treemapTable)}>Table view</button>
          </div>
          
          <div style={{ flex: 1, minHeight: '300px' }}>
            {!treemapTable && treemapResult && (
              <EChart option={treemapResult.option} aria-label={treemapResult.summary} />
            )}
            {treemapTable && compData && (
              <DataTable 
                caption="Composition Data"
                columns={[
                  { key: 'group', header: 'Group' },
                  { key: 'label', header: 'Category' },
                  { key: 'value_usd', header: 'Value (USD)', format: 'usd' }
                ]}
                data={selectComposition(compData, { kind, year: compositionYear })}
              />
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            {resources.map(r => (
              <button key={r} aria-pressed={selectedResource === r} onClick={() => setSelectedResource(r)}>{r}</button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-md)', flex: 1 }}>
            
            {/* Province Bars */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span>Production by Province ({rpYear})</span>
                <button aria-pressed={barsTable} onClick={() => setBarsTable(!barsTable)}>Table view</button>
              </div>
              <div style={{ flex: 1, minHeight: '200px' }}>
                {!barsTable && provinceBarsResult && (
                  <EChart option={provinceBarsResult.option} aria-label={provinceBarsResult.summary} />
                )}
                {barsTable && rpData && (
                  <DataTable 
                    caption={`Production by Province (${rpYear})`}
                    columns={[
                      { key: 'geo', header: 'Province' },
                      { key: 'value', header: 'Value', format: 'unit', unit: rpData.find(r=>r.resource===selectedResource)?.unit }
                    ]}
                    data={rpData.filter(r => r.resource === selectedResource && r.year === rpYear && r.geo !== 'AR').sort((a,b)=>((b.value||0)-(a.value||0)))}
                  />
                )}
              </div>
            </div>

            {/* National Trend */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span>National Trend</span>
                <button aria-pressed={trendTable} onClick={() => setTrendTable(!trendTable)}>Table view</button>
              </div>
              <div style={{ flex: 1, minHeight: '200px' }}>
                {!trendTable && trendResult && (
                  <EChart option={trendResult.option} aria-label={trendResult.summary} />
                )}
                {trendTable && rpData && (
                  <DataTable 
                    caption="National Trend"
                    columns={[
                      { key: 'year', header: 'Year' },
                      { key: 'value', header: 'Value', format: 'unit', unit: rpData.find(r=>r.resource===selectedResource)?.unit }
                    ]}
                    data={rpData.filter(r => r.resource === selectedResource && r.geo === 'AR').sort((a,b)=>a.year-b.year)}
                  />
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Projects Table */}
      <div style={{ marginTop: 'var(--space-lg)' }}>
        <h3>Major Investment Projects ({selectedResource})</h3>
        <div>
          <DataTable
            caption={`Investment Projects for ${selectedResource}`}
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'province', header: 'Province' },
              { key: 'status', header: 'Status' },
              { key: 'capex_usd', header: 'CAPEX (USD)', format: 'usd' },
              { key: 'start_year', header: 'Start Year' },
              { key: 'capacity', header: 'Capacity' }
            ]}
            data={projectsTableData}
          />
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', fontSize: '12px', color: 'var(--ink-2)' }}>
        Source: {sourcesAndDates.sourceStr}, retrieved {sourcesAndDates.latestDate}
      </div>

    </div>
  );
}
