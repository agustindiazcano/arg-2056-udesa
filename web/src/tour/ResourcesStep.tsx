import React, { useCallback, useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import type { ChartClickParams } from '../charts/EChart.js';
import { buildColumns, buildShares } from '../charts/builders/tourCharts.js';
import { buildPie } from '../charts/builders/pie.js';
import { formatValue } from '../charts/format.js';
import { Reveal } from '../motion/Reveal.js';
import { ProvinceMap, useProvinces } from '../scenes/forecast/ProvinceMap.js';
import type { ProjectMapMarker } from '../charts/builders/provinceMap.js';
import { tokens } from '../styles/tokens.js';
import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import { Segmented } from '../ui/Segmented.js';
import { Spinner } from '../ui/Spinner.js';
import { PRODUCTION_UNIT, PRODUCER_MIN, SECTOR_LABELS, SECTOR_VALUES, SHORT, mapValuesOf, rankedProvinces } from './provinceMock.js';
import { RESOURCE_SECTORS, totals } from './resourcesData.js';
import type { Part, ResourceSector } from './resourcesData.js';
import { TourChart } from './TourChart.js';
import type { Map3DSpec } from '../charts3d/types.js';
import { mapSummary } from '../scenes/forecast/mapSelectors.js';
import { ProvinceProfileStep } from './ProvinceProfileStep.js';
import { RESOURCES_TITLE } from './slideTitles.js';
import { provinceSectorBreakdown } from './provinceSectorBreakdown.js';
import { getProvinceProjects, provinceDrilldownData } from './provinceDrilldown.js';
import type { DepartmentProject } from './provinceDrilldown.js';
import {
  ALL_RIGI_PROJECTS,
  getRigiProvinceTotals,
  getRigiTotalsSummary,
  rigiMapValues
} from './rigiProjects.js';
import { MapSearch } from '../ui/MapSearch.js';
import type { SearchResult } from '../ui/mapSearchLogic.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { STEP_INFO } from './stepInfo.js';

export { PRODUCER_MIN };

type View = ResourceSector | 'total';

const PARTS = [
  { value: 'resources', label: 'Recursos y RIGI' },
  { value: 'profile', label: 'Perfil provincial' }
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
 * Slide 2 (Step 8 of Recorrido): "Recursos y RIGI" unified.
 * Provides interactive resource maps, RIGI commitments layer, and provincial/department drilldown.
 */
export function ResourcesStep() {
  const provinces = useProvinces();
  const [form, setForm] = useState<Form>('treemap');
  const [view, setView] = useState<View>('mineria');
  const [part, setPart] = useState<Pane>('resources');
  const [isRigi, setIsRigi] = useState(false);
  const [selected, setSelected] = useState<ProvinceId | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const label = isRigi ? 'RIGI' : view === 'total' ? 'Total' : SECTOR_LABELS[view];

  const select = useCallback((id: string | null) => {
    setSelected((current) => {
      const next = id === null || id === current ? null : (id as ProvinceId);
      setSelectedDept(null);
      return next;
    });
  }, []);

  const rigiSummary = useMemo(() => getRigiTotalsSummary(), []);

  const tiles = useMemo(() => {
    if (isRigi) {
      return [
        { label: 'Inversión RIGI', value: `$ ${rigiSummary.totalInvestment.toLocaleString('es-AR')}`, unit: 'M USD' },
        { label: 'Proyectos RIGI', value: String(rigiSummary.totalProjects), unit: 'proyectos' },
        { label: 'Aprobados', value: String(rigiSummary.approvedCount), unit: 'proyectos' },
        { label: 'En evaluación', value: String(rigiSummary.evalCount), unit: 'proyectos' }
      ];
    }
    return totals(view);
  }, [isRigi, rigiSummary, view]);

  const values = useMemo(() => {
    if (isRigi) {
      return rigiMapValues();
    }
    return mapValuesOf(viewValues(view));
  }, [isRigi, view]);

  const parts = useMemo(() => {
    if (isRigi) {
      if (selected) {
        const provProjects = getProvinceProjects(selected);
        const partsList = provProjects
          .filter((p) => p.investment)
          .map((p) => ({ label: p.name, value: p.investment! }));
        return {
          title: `Inversión RIGI por proyecto`,
          unit: 'M USD',
          parts: partsList.length > 0 ? partsList : [{ label: 'En evaluación', value: 1 }]
        };
      }
      const miningSum = ALL_RIGI_PROJECTS.filter((p) => p.sector === 'Minería').reduce((s, p) => s + (p.investment ?? 0), 0);
      const oilGasSum = ALL_RIGI_PROJECTS.filter((p) => p.sector === 'Petróleo y gas').reduce((s, p) => s + (p.investment ?? 0), 0);
      return {
        title: 'Inversión RIGI por sector',
        unit: 'M USD',
        parts: [
          { label: 'Minería', value: miningSum },
          { label: 'Petróleo y gas', value: oilGasSum }
        ]
      };
    }
    return provinceSectorBreakdown(view, selected);
  }, [isRigi, selected, view]);

  const drilldown = useMemo(() => {
    if (isRigi) {
      if (selected === null) {
        const totalsByProv = getRigiProvinceTotals();
        const rows = PROVINCES.map((p) => ({
          name: SHORT[p.id] ?? p.name,
          value: Math.round(totalsByProv[p.id] ?? 0)
        }))
          .filter((r) => r.value > 0)
          .sort((a, b) => b.value - a.value);
        return {
          kind: 'provinces' as const,
          title: 'RIGI: inversión por provincia',
          unit: 'M USD',
          rows
        };
      }
      const provProjects = getProvinceProjects(selected);
      const rows = provProjects.map((p) => ({
        name: p.name,
        value: p.investment ?? 1
      }));
      return {
        kind: 'minerals' as const,
        title: 'Proyectos RIGI en la provincia',
        unit: 'M USD',
        rows
      };
    }
    return provinceDrilldownData(view, selected);
  }, [isRigi, selected, view]);

  const drilldownBars = useMemo(() => {
    const title = drilldown.title;
    const summary = `${title}, de mayor a menor (${drilldown.unit}): ${drilldown.rows.map((r) => `${r.name} ${formatValue(r.value, drilldown.unit)}`).join(', ')}`;
    const { option } = buildColumns(
      drilldown.rows.map((r) => r.name),
      [{ name: label, values: drilldown.rows.map((r) => r.value), color: isRigi ? tokens.gold : tokens.muted }],
      {
        unit: drilldown.unit,
        summary,
        dense: { barWidth: 14, rotate: drilldown.rows.length > 5 ? 55 : 0 }
      }
    );
    return { title, option, summary, kind: drilldown.kind };
  }, [label, drilldown, isRigi]);

  const handleDrilldownClick = useCallback(
    (params: ChartClickParams) => {
      if (!params.name) return;
      if (drilldown.kind === 'departments') {
        setSelectedDept((curr) => (curr === params.name ? null : params.name!));
      } else if (drilldown.kind === 'provinces') {
        const prov = PROVINCES.find((p) => (SHORT[p.id] ?? p.name) === params.name || p.name === params.name);
        if (prov) select(prov.id);
      }
    },
    [drilldown.kind, select]
  );

  const projects = useMemo<DepartmentProject[]>(() => {
    if (!selected) return [];
    const list = getProvinceProjects(selected, selectedDept);
    if (isRigi) {
      return list.filter((p) => p.isRigi);
    }
    return list;
  }, [selected, selectedDept, isRigi]);

  const allProjectMarkers = useMemo<ProjectMapMarker[]>(() => {
    if (isRigi) {
      return ALL_RIGI_PROJECTS.map((p) => ({
        name: p.name,
        coordinates: p.coordinates,
        provinceId: p.provinceIds[0]!,
        department: p.department,
        company: p.company,
        sector: p.sector,
        kind: p.kind,
        investment: p.investment,
        status: p.status,
        isRigi: true
      }));
    }
    // Resource markers: include registered projects that have coordinates
    const list: ProjectMapMarker[] = [];
    for (const prov of PROVINCES) {
      const provProjs = getProvinceProjects(prov.id);
      for (const p of provProjs) {
        if (p.coordinates) {
          list.push({
            name: p.name,
            coordinates: p.coordinates,
            provinceId: prov.id,
            department: p.department,
            company: p.company,
            kind: p.kind,
            investment: p.investment,
            status: p.status,
            isRigi: p.isRigi
          });
        }
      }
    }
    return list;
  }, [isRigi]);

  const formatProduction = useCallback((v: number) => formatValue(v, isRigi ? 'M USD' : PRODUCTION_UNIT), [isRigi]);

  const mapSpec = useMemo<Map3DSpec | null>(
    () =>
      provinces.status !== 'success'
        ? null
        : {
            kind: 'map',
            title: isRigi ? 'Inversión RIGI por provincia' : `${label} por provincia`,
            geo: provinces.geo,
            values,
            metric: 'level',
            selectedId: selected,
            selectedDepartment: selectedDept,
            onSelectDepartment: setSelectedDept,
            formatValue: formatProduction,
            onSelect: select,
            upright: true,
            zoomToSelected: true,
            summary: mapSummary(values, 'level', isRigi ? 'inversión RIGI' : `producción de ${label.toLowerCase()}`, 2025, isRigi ? 'M USD' : PRODUCTION_UNIT)
          },
    [provinces, isRigi, label, values, selected, selectedDept, formatProduction, select]
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
  const selectedProvinceName = selected ? PROVINCES.find((p) => p.id === selected)?.name ?? selected : null;

  return (
    <section className="gdp-step res-step" aria-label={RESOURCES_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <div className="slide-title-row">
            <h2>{RESOURCES_TITLE}</h2>
            <ChartHelp
              title={step8Info.heading}
              lead="Elegí un sector o el total; tocá una provincia del mapa para ver lo que produce o activá el RIGI"
              paragraphs={step8Info.paragraphs}
              how={step8Info.how}
              refs={step8Info.refs}
            />
          </div>
          <p className="gdp-sub">
            <RefList ids={step8Info.refs} />
          </p>
        </Reveal>
        <div className="tour-controls">
          <Segmented label="Mostrar" options={PARTS} value={part} onChange={setPart} />
          {!isRigi && <Segmented label="Sector" options={VIEWS_OF_SECTOR} value={view} onChange={setView} />}
          <Segmented label="Gráfico" options={FORMS} value={form} onChange={setForm} />
          <button
            type="button"
            className={`btn tour-rigi-btn ${isRigi ? 'active' : ''}`}
            onClick={() => {
              setIsRigi((r) => !r);
              setSelectedDept(null);
            }}
            aria-pressed={isRigi}
            title="Activar o desactivar visualización de proyectos RIGI"
          >
            ★ RIGI
          </button>
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
            <Reveal k={`parts-${isRigi ? 'rigi' : view}-${form}-${selected ?? 'all'}`} className="gdp-chart">
              <strong className="composition-title">
                <span>{`${parts.title} (${parts.unit})`}</span>
                <ChartHelp title={parts.title} paragraphs={[step8Info.paragraphs[0]!, step8Info.paragraphs[1]!]} how={step8Info.how} refs={step8Info.refs} />
                {selected && (
                  <button type="button" className="btn" onClick={() => setSelected(null)}>
                    Todo el país
                  </button>
                )}
              </strong>
              <Parts title={parts.title} unit={parts.unit} parts={parts.parts} form={form} onPick={view === 'total' && !selected && !isRigi ? pickSector : undefined} />
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

          <Reveal k={`bars-${isRigi ? 'rigi' : view}-${selected ?? 'all'}`} delay={0.07} className="gdp-chart">
            <strong className="composition-title">
              <span>{`${drilldownBars.title} (${drilldown.unit})`}</span>
              <ChartHelp title={drilldownBars.title} paragraphs={[step8Info.paragraphs[2]!, step8Info.paragraphs[3]!]} how={step8Info.how} refs={step8Info.refs} />
            </strong>
            <div className="tour-chart">
              <EChart option={drilldownBars.option} aria-label={drilldownBars.summary} onClick={handleDrilldownClick} />
            </div>
          </Reveal>

          {selected && projects.length > 0 && (
            <Reveal k={`projects-${selected}-${selectedDept ?? 'all'}`} delay={0.1} className="gdp-chart dept-projects-card">
              <div className="dept-projects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <strong className="composition-title" style={{ margin: 0 }}>
                  {selectedDept
                    ? `Proyectos mineros en ${selectedDept} (${projects.length})`
                    : `Proyectos mineros y estratégicos en ${selectedProvinceName} (${projects.length})`}
                </strong>
                {selectedDept ? (
                  <button type="button" className="btn" style={{ fontSize: '0.75rem', padding: '2px 8px' }} onClick={() => setSelectedDept(null)}>
                    Ver todos de {selectedProvinceName}
                  </button>
                ) : (
                  <button type="button" className="btn" style={{ fontSize: '0.75rem', padding: '2px 8px' }} onClick={() => setSelected(null)}>
                    Cerrar
                  </button>
                )}
              </div>
              <div className="project-cards-container">
                {projects.map((proj) => (
                  <article key={proj.name} className={`project-card ${proj.isRigi ? 'project-card--rigi' : ''}`}>
                    <div className="project-card-header">
                      <strong className="project-card-title">{proj.name}</strong>
                      <div className="project-card-badges">
                        {proj.isRigi && <span className="project-badge project-badge--rigi">★ RIGI</span>}
                        <span className="project-badge">{proj.kind}</span>
                        <span
                          className={`project-badge ${
                            proj.status.toLowerCase().includes('aprobado') || proj.status.toLowerCase().includes('producción')
                              ? 'project-badge--approved'
                              : 'project-badge--eval'
                          }`}
                        >
                          {proj.status}
                        </span>
                        {proj.resolution && <span className="project-badge">{proj.resolution}</span>}
                      </div>
                    </div>
                    <div className="project-card-company">
                      <span>{proj.company}</span>
                    </div>
                    <div className="project-card-meta">
                      {proj.investment && (
                        <div>
                          <strong>Inversión:</strong> {proj.investment.toLocaleString('es-AR')} millones de USD
                        </div>
                      )}
                      {proj.capacity && (
                        <div>
                          <strong>Capacidad:</strong> {proj.capacity}
                        </div>
                      )}
                      {proj.refs && proj.refs.length > 0 && (
                        <div style={{ marginTop: '2px' }}>
                          <span style={{ marginRight: '6px' }}>Referencias:</span>
                          <RefList ids={proj.refs} />
                        </div>
                      )}
                    </div>
                    {proj.note && <p className="project-card-note">{proj.note}</p>}
                  </article>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        <Reveal k={`map-${isRigi ? 'rigi' : view}`} delay={0.14} className="gdp-chart prov-map res-map">
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
            <span>{isRigi ? 'Proyectos e inversión RIGI por provincia' : `${label} por provincia`}</span>
            <MapSearch onSelect={handleSearchSelect} />
          </strong>
          <div className="tour-chart">
            {provinces.status === 'loading' && <Spinner label="Cargando el mapa de las provincias..." />}
            {provinces.status === 'error' && (
              <p style={{ color: 'var(--state-warning)' }}>{`La geometría de las provincias no está disponible: ${provinces.message}`}</p>
            )}
            {provinces.status === 'success' && (
              <TourChart spec={mapSpec ?? undefined} mode="3d">
                <ProvinceMap
                  geo={provinces.geo}
                  values={values}
                  unit={isRigi ? 'M USD' : PRODUCTION_UNIT}
                  indicatorLabel={isRigi ? 'inversión RIGI' : `producción de ${label.toLowerCase()}`}
                  metric="level"
                  selectedId={selected}
                  year={2025}
                  observed
                  hideTitle
                  zoomToSelected
                  onSelect={select}
                  selectedDepartment={selectedDept}
                  onSelectDepartment={setSelectedDept}
                  projectMarkers={allProjectMarkers}
                />
              </TourChart>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
