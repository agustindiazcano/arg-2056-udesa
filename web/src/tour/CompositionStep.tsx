import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { buildColumns } from '../charts/builders/tourCharts.js';
import { Reveal } from '../motion/Reveal.js';
import { useStore } from '../state/store.js';
import { tokens } from '../styles/tokens.js';
import { Segmented } from '../ui/Segmented.js';
import { TourChart } from './TourChart.js';
import { COMPOSITION_TITLE } from './slideTitles.js';
import { EXPORT_COMPOSITION_CHART, TOUR_CHARTS } from './tourCharts.js';
import type { TourChartDef } from './tourCharts.js';

const FORMS = [
  { value: 'treemap', label: 'Treemap' },
  { value: 'bars', label: 'Barras' }
] as const;

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

type Form = (typeof FORMS)[number]['value'];

/** The two charts of the slide: how the GDP is made up by sector (step 12) and how the exports are made up by complex (the old step 11). */
export const COMPOSITION_CHARTS: ReadonlyArray<TourChartDef> = [TOUR_CHARTS[12]!, EXPORT_COMPOSITION_CHART];

function Big({ def, form }: { def: TourChartDef; form: Form }) {
  const built = useMemo(() => def.build(), [def]);
  // the bars of the same shares (the spec of the 3D view holds them in order)
  const bars = useMemo(() => {
    const rows = built.spec && built.spec.kind === 'bars' ? built.spec.bars : [];
    const labels = rows.map((r) => r.label);
    return buildColumns(labels, [{ name: def.title, values: rows.map((r) => r.value), color: tokens.muted }], { unit: '%', highlight: labels[0] ?? '', summary: built.summary }).option;
  }, [def, built]);
  return (
    <Reveal k={`${def.title}-${form}`} className="gdp-chart">
      <h3 className="composition-title">{def.title}</h3>
      <p className="gdp-sub">{def.subtitle}</p>
      <div className="tour-chart">
        {form === 'treemap' ? (
          <EChart option={built.option} aria-label={built.summary} />
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
  return (
    <section className="gdp-step" aria-label={COMPOSITION_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{COMPOSITION_TITLE}</h2>
        </Reveal>
        <div className="tour-controls">
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
