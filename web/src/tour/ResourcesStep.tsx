import React, { useCallback, useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import type { ChartClickParams } from '../charts/EChart.js';
import { buildColumns, buildShares } from '../charts/builders/tourCharts.js';
import { buildPie } from '../charts/builders/pie.js';
import { formatValue } from '../charts/format.js';
import { Reveal } from '../motion/Reveal.js';
import { ProvinceMap, useProvinces } from '../scenes/forecast/ProvinceMap.js';
import { tokens } from '../styles/tokens.js';
import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import { Segmented } from '../ui/Segmented.js';
import { Spinner } from '../ui/Spinner.js';
import { PRODUCTION_UNIT, PRODUCER_MIN, SECTOR_LABELS, SECTOR_VALUES, mapValuesOf, rankedProvinces } from './provinceMock.js';
import { RESOURCE_SECTORS, totals } from './resourcesData.js';
import type { Part, ResourceSector } from './resourcesData.js';
import { TourChart } from './TourChart.js';
import type { Map3DSpec } from '../charts3d/types.js';
import { mapSummary } from '../scenes/forecast/mapSelectors.js';
import { ProvinceStep } from './ProvinceStep.js';
import { ProvinceProfileStep } from './ProvinceProfileStep.js';
import { RESOURCES_TITLE } from './slideTitles.js';
import { provinceSectorBreakdown } from './provinceSectorBreakdown.js';
import { getDepartmentProjects, provinceDrilldownData } from './provinceDrilldown.js';
import { MapSearch } from '../ui/MapSearch.js';
import type { SearchResult } from '../ui/mapSearchLogic.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { STEP_INFO } from './stepInfo.js';

export { PRODUCER_MIN };

type View = ResourceSector | 'total';

const PARTS = [
  { value: 'resources', label: 'Recursos' },
  { value: 'provinces', label: 'Producción por provincia' },
  { value: 'profile', label: 'Perfil por provincia' }
] as const;

type Pane = (typeof PARTS)[number]['value'];

const VIEWS_OF_SECTOR: ReadonlyArray<{ value: View; label: string }> = [...RESOURCE_SECTORS, { value: 'total', label: 'Total' }];

const FORMS = [
  { value: 'treemap', label: 'Treemap' },
  { value: 'pie', label: 'Torta' },
  { value: 'bars', label: 'Barras' }
] as const;

type Form = (typeof FORMS)[number]['value'];

/** The values by province of a view, in the order of `PROVINCES`: one sector, or the three added up. */
export function viewValues(view: View): number[] {
  if (view !== 'total') return [...SECTOR_VALUES[view]];
  return SECTOR_VALUES.mineria.map((_, i) => (['mineria', 'hidrocarburos', 'agro'] as const).reduce((sum, s) => sum + (SECTOR_VALUES[s][i] ?? 0), 0));
}

/** What one province produces, by sector, in million USD (the made-up table of the province slide); sectors with nothing to show are left out. */
export function provinceParts(id: ProvinceId): Part[] {
  const i = PROVINCES.findIndex((p) => p.id === id);
  if (i < 0) return [];
  return RESOURCE_SECTORS.map((s) => ({ label: s.label, value: SECTOR_VALUES[s.value][i] ?? 0 })).filter((p) => p.value >= PRODUCER_MIN);
}

/** The provinces that produce something of the view, from the highest. */
export function producers(view: View): Array<{ short: string; value: number }> {
  return rankedProvinces(viewValues(view)).filter((r) => r.value >= PRODUCER_MIN);
}

function Parts({ title, unit, parts, form, onPick }: { title: string; unit: string; parts: Part[]; form: Form; onPick?: (label: string) => void }) {
  const built = useMemo(() => {
    const sorted = [...parts].sort((a, b) => b.value - a.value);
    const summary = `${title}: ${parts.map((p) => `${p.label} ${formatValue(p.value, unit)}`).join(', ')}`;
    const option =
      form === 'treemap'
        ? buildShares(sorted, { unit, summary }).option
        : form === 'pie'
          ? buildPie(sorted, { unit, summary }).option
          : buildColumns(sorted.map((p) => p.label), [{ name: title, values: sorted.map((p) => p.value), color: tokens.muted }], { unit, summary }).option;
    return { option, summary };
  }, [title, unit, parts, form]);
  const click = (params: ChartClickParams) => {
    if (params.name) onPick?.(params.name);
  };
  return (
    <div className="tour-chart">
      <EChart option={built.option} aria-label={built.summary} onClick={click} />
    </div>
  );
}

/**
 * Step 8 of the Recorrido, "Recursos naturales": on the left what the chosen sector is made of (minerals, provinces or crops; the three sectors for
 * Total) as a treemap, a pie or bars, and the bars of the provinces that produce it; on the right the big map of Argentina for the same view.
 * It replaces the old steps 8, 9, 10 and 13; their tables stay in the Data page.
 */
export function ResourcesStep() {
  const provinces = useProvinces();
  const [form, setForm] = useState<Form>('treemap');
  const [view, setView] = useState<View>('mineria');
  const [part, setPart] = useState<Pane>('resources');
  const [selected, setSelected] = useState<ProvinceId | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const label = view === 'total' ? 'Total' : SECTOR_LABELS[view];
  const parts = useMemo(() => provinceSectorBreakdown(view, selected), [view, selected]);
  const select = useCallback((id: string | null) => {
    setSelected((current) => {
      const next = id === null || id === current ? null : (id as ProvinceId);
      setSelectedDept(null);
      return next;
    });
  }, []);
  const tiles = useMemo(() => totals(view), [view]);
  const values = useMemo(() => mapValuesOf(viewValues(view)), [view]);

  const drilldown = useMemo(() => provinceDrilldownData(view, selected), [view, selected]);
  const drilldownBars = useMemo(() => {
    const title = drilldown.title;
    const summary = `${title}, de mayor a menor (${drilldown.unit}): ${drilldown.rows.map((r) => `${r.name} ${formatValue(r.value, drilldown.unit)}`).join(', ')}`;
    const { option } = buildColumns(drilldown.rows.map((r) => r.name), [{ name: label, values: drilldown.rows.map((r) => r.value), color: tokens.muted }], {
      unit: drilldown.unit,
      summary,
      dense: { barWidth: 14, rotate: drilldown.rows.length > 5 ? 55 : 0 }
    });
    return { title, option, summary, kind: drilldown.kind };
  }, [label, drilldown]);

  const handleDrilldownClick = useCallback((params: ChartClickParams) => {
    if (drilldown.kind === 'departments' && params.name) {
      setSelectedDept((curr) => (curr === params.name ? null : params.name!));
    }
  }, [drilldown.kind]);

  const projects = useMemo(() => {
    if (!selected || !selectedDept) return [];
    return getDepartmentProjects(selected, selectedDept);
  }, [selected, selectedDept]);

  const formatProduction = useCallback((v: number) => formatValue(v, PRODUCTION_UNIT), []);
  const mapSpec = useMemo<Map3DSpec | null>(
    () =>
      provinces.status !== 'success'
        ? null
        : {
            kind: 'map',
            title: `${label} por provincia`,
            geo: provinces.geo,
            values,
            metric: 'level',
            selectedId: selected,
            formatValue: formatProduction,
            onSelect: select,
            upright: true,
            zoomToSelected: true,
            summary: mapSummary(values, 'level', `producción de ${label.toLowerCase()}`, 2025, PRODUCTION_UNIT)
          },
    [provinces, values, selected, label, formatProduction, select]
  );
  const pickSector = useCallback((name: string) => {
    const found = RESOURCE_SECTORS.find((s) => s.label === name);
    if (found) {
      setView(found.value);
      setSelectedDept(null);
    }
  }, []);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    setSelected(result.provinceId);
    if (result.type === 'departamento') {
      setSelectedDept(result.name);
    } else if (result.type === 'proyecto' && result.department) {
      setSelectedDept(result.department);
    } else {
      setSelectedDept(null);
    }
  }, []);
  if (part === 'provinces') {
    return (
      <section className="gdp-step" aria-label={RESOURCES_TITLE}>
        <header className="gdp-head">
          <Reveal k="head" className="gdp-title">
            <h2>{RESOURCES_TITLE}</h2>
          </Reveal>
          <div className="tour-controls">
            <Segmented label="Mostrar" options={PARTS} value={part} onChange={setPart} />
          </div>
        </header>
        <ProvinceStep embedded />
      </section>
    );
  }
  if (part === 'profile') {
    return (
      <section className="gdp-step" aria-label={RESOURCES_TITLE}>
        <header className="gdp-head">
          <Reveal k="head" className="gdp-title">
            <h2>{RESOURCES_TITLE}</h2>
          </Reveal>
          <div className="tour-controls">
            <Segmented label="Mostrar" options={PARTS} value={part} onChange={setPart} />
          </div>
        </header>
        <ProvinceProfileStep embedded />
      </section>
    );
  }
  const step8Info = STEP_INFO[8]!;
  return (
    <section className="gdp-step res-step" aria-label={RESOURCES_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <div className="slide-title-row">
            <h2>{RESOURCES_TITLE}</h2>
            <ChartHelp title={step8Info.heading} lead="Elegí un sector o el total; tocá una provincia del mapa para ver lo que produce" paragraphs={step8Info.paragraphs} how={step8Info.how} refs={step8Info.refs} />
          </div>
          <p className="gdp-sub">
            <RefList ids={step8Info.refs} />
          </p>
        </Reveal>
        <div className="tour-controls">
          <Segmented label="Mostrar" options={PARTS} value={part} onChange={setPart} />
          <Segmented label="Sector" options={VIEWS_OF_SECTOR} value={view} onChange={setView} />
          <Segmented label="Gráfico" options={FORMS} value={form} onChange={setForm} />
        </div>
      </header>
      <ul className="res-totals" aria-label={`Totales de ${label.toLowerCase()}`}>
        {tiles.map((t) => (
          <li key={t.label} className="res-total">
            <span className="tour-ind-label">{t.label}</span>
            <span className="tour-ind-value">{t.value}</span>
            <span className="tour-ind-unit">{t.unit}</span>
          </li>
        ))}
      </ul>
      <div className="res-grid">
        <div className="res-left">
          {parts ? (
            <Reveal k={`parts-${view}-${form}-${selected ?? 'all'}`} className="gdp-chart">
              <strong className="composition-title">
                <span>{`${parts.title} (${parts.unit})`}</span>
                <ChartHelp title={parts.title} paragraphs={[step8Info.paragraphs[0]!, step8Info.paragraphs[1]!]} how={step8Info.how} refs={step8Info.refs} />
                {selected && (
                  <button type="button" className="btn" onClick={() => setSelected(null)}>
                    Todo el país
                  </button>
                )}
              </strong>
              <Parts title={parts.title} unit={parts.unit} parts={parts.parts} form={form} onPick={view === 'total' && !selected ? pickSector : undefined} />
            </Reveal>
          ) : selected ? (
            <div className="gdp-chart">
              <strong className="composition-title">
                <button type="button" className="btn" onClick={() => setSelected(null)}>
                  Todo el país
                </button>
              </strong>
            </div>
          ) : null}
          <Reveal k={`bars-${view}-${selected ?? 'all'}`} delay={0.07} className="gdp-chart">
            <strong className="composition-title">
              <span>{`${drilldownBars.title} (${drilldown.unit})`}</span>
              <ChartHelp title={drilldownBars.title} paragraphs={[step8Info.paragraphs[2]!, step8Info.paragraphs[3]!]} how={step8Info.how} refs={step8Info.refs} />
            </strong>
            <div className="tour-chart">
              <EChart option={drilldownBars.option} aria-label={drilldownBars.summary} onClick={handleDrilldownClick} />
            </div>
          </Reveal>
          {projects.length > 0 && selectedDept && (
            <Reveal k={`projects-${selected}-${selectedDept}`} delay={0.1} className="gdp-chart dept-projects-card">
              <div className="dept-projects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <strong className="composition-title" style={{ margin: 0 }}>
                  Proyectos mineros en {selectedDept} ({projects.length})
                </strong>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                  onClick={() => setSelectedDept(null)}
                >
                  Cerrar
                </button>
              </div>
              <ul className="dept-projects-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {projects.map((proj) => (
                  <li
                    key={proj.name}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{proj.name}</strong>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: proj.status === 'Producción' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: proj.status === 'Producción' ? '#4ade80' : '#38bdf8'
                        }}
                      >
                        {proj.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '2px' }}>
                      <span>{proj.company}</span> • <span>{proj.kind}</span>
                    </div>
                    {proj.capacity && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                        Capacidad: {proj.capacity}
                      </div>
                    )}
                    {proj.investment && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                        Inversión: {proj.investment.toLocaleString('es-AR')} millones de USD
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
        <Reveal k={`map-${view}`} delay={0.14} className="gdp-chart prov-map res-map">
          <strong
            className="composition-title"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <span>{`${label} por provincia`}</span>
            <MapSearch onSelect={handleSearchSelect} />
          </strong>
          <div className="tour-chart">
            {provinces.status === 'loading' && <Spinner label="Cargando el mapa de las provincias..." />}
            {provinces.status === 'error' && <p style={{ color: 'var(--state-warning)' }}>{`La geometría de las provincias no está disponible: ${provinces.message}`}</p>}
            {provinces.status === 'success' && (
              <TourChart spec={mapSpec ?? undefined} mode="3d">
                <ProvinceMap
                  geo={provinces.geo}
                  values={values}
                  unit={PRODUCTION_UNIT}
                  indicatorLabel={`producción de ${label.toLowerCase()}`}
                  metric="level"
                  selectedId={selected}
                  year={2025}
                  observed
                  hideTitle
                  onSelect={select}
                  selectedDepartment={selectedDept}
                  onSelectDepartment={setSelectedDept}
                />
              </TourChart>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
