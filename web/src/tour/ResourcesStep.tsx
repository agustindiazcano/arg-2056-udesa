import React, { useCallback, useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import type { ChartClickParams } from '../charts/EChart.js';
import { buildColumns, buildShares } from '../charts/builders/tourCharts.js';
import { buildPie } from '../charts/builders/pie.js';
import { formatValue } from '../charts/format.js';
import { Reveal } from '../motion/Reveal.js';
import { ProvinceMap, useProvinces } from '../scenes/forecast/ProvinceMap.js';
import { tokens } from '../styles/tokens.js';
import { Segmented } from '../ui/Segmented.js';
import { Spinner } from '../ui/Spinner.js';
import { PRODUCTION_UNIT, SECTOR_LABELS, SECTOR_VALUES, mapValuesOf, rankedProvinces } from './provinceMock.js';
import { RESOURCE_SECTORS, breakdown, sectorExports, totals } from './resourcesData.js';
import type { Part, ResourceSector } from './resourcesData.js';
import { RESOURCES_TITLE } from './slideTitles.js';

type View = ResourceSector | 'total';

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

/** The provinces that produce something of the view, from the highest. */
export function producers(view: View): Array<{ short: string; value: number }> {
  return rankedProvinces(viewValues(view)).filter((r) => r.value >= PRODUCER_MIN);
}

function Parts({ title, unit, parts, form, onPick }: { title: string; unit: string; parts: Part[]; form: Form; onPick?: (label: string) => void }) {
  const built = useMemo(() => {
    const summary = `${title}: ${parts.map((p) => `${p.label} ${formatValue(p.value, unit)}`).join(', ')}`;
    const option =
      form === 'treemap'
        ? buildShares(parts, { unit, summary }).option
        : form === 'pie'
          ? buildPie(parts, { unit, summary }).option
          : buildColumns(parts.map((p) => p.label), [{ name: title, values: parts.map((p) => p.value), color: tokens.muted }], { unit, summary }).option;
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
  const label = view === 'total' ? 'Total' : SECTOR_LABELS[view];
  const parts = useMemo(
    () => (view === 'total' ? { title: 'Exportaciones de 2025 por sector', unit: 'miles de millones de USD', parts: sectorExports() } : breakdown(view)),
    [view]
  );
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
  const pickSector = useCallback((name: string) => {
    const found = RESOURCE_SECTORS.find((s) => s.label === name);
    if (found) setView(found.value);
  }, []);
  return (
    <section className="gdp-step res-step" aria-label={RESOURCES_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{RESOURCES_TITLE}</h2>
          <p className="gdp-sub">Elegí un sector o el total; en el total, tocá un sector para verlo por dentro</p>
        </Reveal>
        <div className="tour-controls">
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
          <Reveal k={`parts-${view}-${form}`} className="gdp-chart">
            <strong className="composition-title">{`${parts.title} (${parts.unit})`}</strong>
            <Parts title={parts.title} unit={parts.unit} parts={parts.parts} form={form} onPick={view === 'total' ? pickSector : undefined} />
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
              <ProvinceMap
                geo={provinces.geo}
                values={values}
                unit={PRODUCTION_UNIT}
                indicatorLabel={`producción de ${label.toLowerCase()}`}
                metric="level"
                selectedId={null}
                year={2025}
                observed
                hideTitle
                onSelect={() => {}}
              />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
