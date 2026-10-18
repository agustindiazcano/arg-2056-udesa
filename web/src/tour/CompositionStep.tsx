import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { buildPie } from '../charts/builders/pie.js';
import { buildColumns } from '../charts/builders/tourCharts.js';
import { Reveal } from '../motion/Reveal.js';
import { useStore } from '../state/store.js';
import { tokens } from '../styles/tokens.js';
import { Segmented } from '../ui/Segmented.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { ExportsStep } from './ExportsStep.js';
import { TourChart } from './TourChart.js';
import { COMPOSITION_TITLE } from './slideTitles.js';
import { STEP_INFO } from './stepInfo.js';
import { EXPORT_COMPOSITION_CHART, TOUR_CHARTS } from './tourCharts.js';
import type { TourChartDef } from './tourCharts.js';

const FORMS = [
  { value: 'treemap', label: 'Treemap' },
  { value: 'pie', label: 'Torta' },
  { value: 'bars', label: 'Barras' }
] as const;

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

type Form = (typeof FORMS)[number]['value'];

const PARTS = [
  { value: 'composition', label: 'Composición' },
  { value: 'exports', label: 'Exportaciones por año y complejo' }
] as const;

type Part = (typeof PARTS)[number]['value'];

/** The two charts of the slide: how the GDP is made up by sector (step 12) and how the exports are made up by complex (the old step 11). */
export const COMPOSITION_CHARTS: ReadonlyArray<TourChartDef> = [TOUR_CHARTS[12]!, EXPORT_COMPOSITION_CHART];

function Big({ def, form }: { def: TourChartDef; form: Form }) {
  const built = useMemo(() => def.build(), [def]);
  // the bars and pie of the same shares (the spec of the 3D view holds them in order)
  const rows = useMemo(() => (built.spec && built.spec.kind === 'bars' ? built.spec.bars : []), [built]);
  const pie = useMemo(() => buildPie(rows, { unit: '%', summary: built.summary }).option, [rows, built.summary]);
  const bars = useMemo(() => {
    const labels = rows.map((r) => r.label);
    return buildColumns(labels, [{ name: def.title, values: rows.map((r) => r.value), color: tokens.muted }], { unit: '%', highlight: labels[0] ?? '', summary: built.summary }).option;
  }, [def, rows, built.summary]);
  const step12Info = STEP_INFO[12]!;
  return (
    <Reveal k={`${def.title}-${form}`} className="gdp-chart">
      <h3 className="composition-title">
        <span>{def.title}</span>
        <ChartHelp title={def.title} lead={def.subtitle} paragraphs={step12Info.paragraphs} how={step12Info.how} refs={step12Info.refs} />
      </h3>
      <div className="tour-chart">
        {form === 'treemap' ? (
          <EChart option={built.option} aria-label={built.summary} />
        ) : form === 'pie' ? (
          <EChart option={pie} aria-label={built.summary} />
        ) : (
          <TourChart spec={built.spec}>
            <EChart option={bars} aria-label={built.summary} />
          </TourChart>
        )}
      </div>
    </Reveal>
  );
}

/**
 * Step 12 of the Recorrido, "Composición": two large charts side by side, the composition of the GDP by sector and the composition of the
 * exports by complex. Each is a treemap with a color per sector (the default) or bars, flat or in 3D. It takes the place of the old GDP slide
 * (step 1), which the human found redundant.
 */
export function CompositionStep() {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const [form, setForm] = useState<Form>('treemap');
  const [part, setPart] = useState<Part>('composition');
  const step12Info = STEP_INFO[12]!;
  if (part === 'exports') {
    return (
      <section className="gdp-step" aria-label={COMPOSITION_TITLE}>
        <header className="gdp-head">
          <Reveal k="head" className="gdp-title">
            <div className="slide-title-row">
              <h2>{COMPOSITION_TITLE}</h2>
              <ChartHelp title={step12Info.heading} paragraphs={step12Info.paragraphs} how={step12Info.how} refs={step12Info.refs} />
            </div>
          </Reveal>
          <div className="tour-controls">
            <Segmented label="Mostrar" options={PARTS} value={part} onChange={setPart} />
          </div>
        </header>
        <ExportsStep embedded />
      </section>
    );
  }
  return (
    <section className="gdp-step" aria-label={COMPOSITION_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <div className="slide-title-row">
            <h2>{COMPOSITION_TITLE}</h2>
            <ChartHelp title={step12Info.heading} lead="Valor agregado por sector y exportaciones por complejo" paragraphs={step12Info.paragraphs} how={step12Info.how} refs={step12Info.refs} />
          </div>
          <p className="gdp-sub">
            <RefList ids={step12Info.refs} />
          </p>
        </Reveal>
        <div className="tour-controls">
          <Segmented label="Mostrar" options={PARTS} value={part} onChange={setPart} />
          <Segmented label="Gráfico" options={FORMS} value={form} onChange={setForm} />
          {form === 'bars' && (
            <Segmented
              label="Vista"
              options={VIEWS}
              value={mode}
              onChange={(next) => {
                if (next !== mode) dispatch({ type: 'toggle3D' });
              }}
            />
          )}
        </div>
      </header>
      <div className="tour-grid composition-grid" data-count={2} data-layout="grid">
        {COMPOSITION_CHARTS.map((def) => (
          <Big key={def.title} def={def} form={form} />
        ))}
      </div>
    </section>
  );
}
