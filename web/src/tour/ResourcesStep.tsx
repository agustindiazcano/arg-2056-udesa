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
import { PRODUCTION_UNIT, SECTOR_LABELS, SECTOR_VALUES, mapValuesOf, rankedProvinces } from './provinceMock.js';
import { RESOURCE_SECTORS, breakdown, sectorExports, totals } from './resourcesData.js';
import type { Part, ResourceSector } from './resourcesData.js';
import { TourChart } from './TourChart.js';
import type { Map3DSpec } from '../charts3d/types.js';
import { mapSummary } from '../scenes/forecast/mapSelectors.js';
import { ProvinceStep } from './ProvinceStep.js';
import { RESOURCES_TITLE } from './slideTitles.js';

type View = ResourceSector | 'total';

const PARTS = [
  { value: 'resources', label: 'Recursos' },
  { value: 'provinces', label: 'Producción por provincia' }
] as const;

type Pane = (typeof PARTS)[number]['value'];

const VIEWS_OF_SECTOR: ReadonlyArray<{ value: View; label: string }> = [...RESOURCE_SECTORS, { value: 'total', label: 'Total' }];

const FORMS = [
  { value: 'treemap', label: 'Treemap' },
  { value: 'pie', label: 'Torta' },
  { value: 'bars', label: 'Barras' }
] as const;

type Form = (typeof FORMS)[number]['value'];

/** A province is shown as a producer of a sector only above this value (million USD); the made-up table has placeholders of 5 to 20 for "nothing". */
export const PRODUCER_MIN = 100;

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
  const label = view === 'total' ? 'Total' : SECTOR_LABELS[view];
  const provinceName = PROVINCES.find((p) => p.id === selected)?.name;
  const parts = useMemo(() => {
    if (selected && provinceName) return { title: `${provinceName}: qué produce`, unit: PRODUCTION_UNIT, parts: provinceParts(selected) };
    return view === 'total' ? { title: 'Exportaciones de 2025 por sector', unit: 'miles de millones de USD', parts: sectorExports() } : breakdown(view);
  }, [view, selected, provinceName]);
  const select = useCallback((id: string | null) => setSelected((current) => (id === null || id === current ? null : (id as ProvinceId))), []);
  const rows = useMemo(() => producers(view), [view]);
  const tiles = useMemo(() => totals(view), [view]);
  const values = useMemo(() => mapValuesOf(viewValues(view)), [view]);
  const provinceBars = useMemo(() => {
    const title = `${label}: provincias que producen`;
    const summary = `${title}, de mayor a menor (${PRODUCTION_UNIT}): ${rows.map((r) => `${r.short} ${formatValue(r.value, PRODUCTION_UNIT)}`).join(', ')}`;
    const { option } = buildColumns(rows.map((r) => r.short), [{ name: label, values: rows.map((r) => r.value), color: tokens.muted }], {
      unit: PRODUCTION_UNIT,
      summary,
      dense: { barWidth: 14, rotate: 55 }
    });
    return { title, option, summary };
  }, [label, rows]);
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
    if (found) setView(found.value);
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
  return (
    <section className="gdp-step res-step" aria-label={RESOURCES_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{RESOURCES_TITLE}</h2>
          <p className="gdp-sub">Elegí un sector o el total; tocá una provincia del mapa para ver lo que produce</p>
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
          <Reveal k={`parts-${view}-${form}-${selected ?? 'all'}`} className="gdp-chart">
            <strong className="composition-title">
              {`${parts.title} (${parts.unit})`}
              {selected && (
                <button type="button" className="btn" onClick={() => setSelected(null)}>
                  Todo el país
                </button>
              )}
            </strong>
            <Parts title={parts.title} unit={parts.unit} parts={parts.parts} form={form} onPick={view === 'total' && !selected ? pickSector : undefined} />
          </Reveal>
          <Reveal k={`bars-${view}`} delay={0.07} className="gdp-chart">
            <strong className="composition-title">{`${provinceBars.title} (${PRODUCTION_UNIT})`}</strong>
            <div className="tour-chart">
              <EChart option={provinceBars.option} aria-label={provinceBars.summary} />
            </div>
          </Reveal>
        </div>
        <Reveal k={`map-${view}`} delay={0.14} className="gdp-chart prov-map res-map">
          <strong className="composition-title">{`${label} por provincia`}</strong>
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
                />
              </TourChart>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
