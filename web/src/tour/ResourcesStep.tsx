import React, { useMemo } from 'react';
import { EChart } from '../charts/EChart.js';
import { Reveal } from '../motion/Reveal.js';
import { useStore } from '../state/store.js';
import { Segmented } from '../ui/Segmented.js';
import { TabbedChart } from '../ui/TabbedChart.js';
import type { ChartTab } from '../ui/TabbedChart.js';
import { TourChart } from './TourChart.js';
import { RESOURCES_TITLE } from './slideTitles.js';
import { AGRO_TONNES_CHART, HYDROCARBONS_CHART, STOCK_CHART, TOUR_CHARTS } from './tourCharts.js';
import type { TourChartDef } from './tourCharts.js';

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

/** The tabs of the Resources slide, in order; each shows the chart of one of the old steps 8 (mining), 9, 10 and 13. */
export const RESOURCE_TABS: ReadonlyArray<{ id: string; label: string; def: TourChartDef }> = [
  { id: 'mining', label: 'Minería', def: TOUR_CHARTS[8]! },
  { id: 'hydrocarbons', label: 'Hidrocarburos', def: HYDROCARBONS_CHART },
  { id: 'agro', label: 'Agro', def: AGRO_TONNES_CHART },
  { id: 'stock', label: 'Stock', def: STOCK_CHART }
];

function TabBody({ def }: { def: TourChartDef }) {
  const { option, summary, spec } = useMemo(() => def.build(), [def]);
  return (
    <div className="tour-grid" data-count={1} data-layout="grid">
      <Reveal k={def.title} className="gdp-chart">
        <div className="tour-chart">
          <TourChart spec={spec}>
            <EChart option={option} aria-label={summary} />
          </TourChart>
        </div>
      </Reveal>
    </div>
  );
}

/**
 * Step 8 of the Recorrido, "Recursos": mining, hydrocarbons, agro (tonnes, not dollars) and the stock of natural resources as tabs of one slide.
 * It replaces the old steps 8, 9, 10 and 13; their tables stay in the Data page.
 */
export function ResourcesStep() {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const tabs: ChartTab[] = RESOURCE_TABS.map((t) => ({
    id: t.id,
    label: t.label,
    render: () => (
      <>
        <p className="gdp-sub">
          {t.def.title} · {t.def.subtitle}
          {t.def.source ? <> · <span className="gdp-source">{t.def.source}</span></> : null}
        </p>
        <TabBody def={t.def} />
      </>
    )
  }));
  return (
    <section className="gdp-step" aria-label={RESOURCES_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{RESOURCES_TITLE}</h2>
        </Reveal>
        <div className="tour-controls">
          <Segmented
            label="Vista"
            options={VIEWS}
            value={mode}
            onChange={(next) => {
              if (next !== mode) dispatch({ type: 'toggle3D' });
            }}
          />
        </div>
      </header>
      <TabbedChart label="Recurso" tabs={tabs} />
    </section>
  );
}
