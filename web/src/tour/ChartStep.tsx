import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { formatValue } from '../charts/format.js';
import { Chart2D3D } from '../charts3d/Chart2D3D.js';
import { ProvinceMap, useProvinces } from '../scenes/forecast/ProvinceMap.js';
import { mapSummary } from '../scenes/forecast/mapSelectors.js';
import type { MapValues } from '../scenes/forecast/mapSelectors.js';
import { useStore } from '../state/store.js';
import { Reveal } from '../motion/Reveal.js';
import { REVEAL_STAGGER } from '../motion/timings.js';
import { Segmented } from '../ui/Segmented.js';
import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import { PROVINCE_VALUES } from './tourData.js';
import { CHART_STEP_LIST, TOUR_CHARTS } from './tourCharts.js';
import { useTourLayout } from './useTourLayout.js';
import type { TourCount } from './useTourLayout.js';
import type { TourChartDef } from './tourCharts.js';

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const COUNTS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: 'focus', label: '1/3' }
] as const;

function Legend({ def }: { def: TourChartDef }) {
  if (!def.legend) return null;
  return (
    <ul className="tour-legend" aria-label="Referencias">
      {def.legend.map((item) => (
        <li key={item.label}>
          <span className="tour-swatch" style={{ background: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** The charts on screen: the one of the step and the next ones, as many as the visitor chose (the window slides back at the end of the list). */
export function visibleSteps(step: number, count: number): number[] {
  const list = CHART_STEP_LIST;
  const at = Math.max(list.indexOf(step), 0);
  const start = Math.min(at, Math.max(list.length - count, 0));
  return list.slice(start, start + count);
}

function ChartBody({ def }: { def: TourChartDef }) {
  const { option, summary, spec } = useMemo(() => def.build(), [def]);
  return (
    <Chart2D3D spec={spec}>
      <EChart option={option} aria-label={summary} />
    </Chart2D3D>
  );
}

const UNIT = 'millones de USD';

/** Made-up values for the province map, ranked from the highest. */
function mockProvinceValues(): MapValues {
  const entries = PROVINCES.map((p, i) => ({ id: p.id as string, value: PROVINCE_VALUES[i] ?? 0 }));
  const ranked = [...entries].sort((a, b) => b.value - a.value);
  const values: MapValues['values'] = {};
  ranked.forEach((e, i) => {
    values[e.id] = { plotted: e.value, p10: e.value, p50: e.value, p90: e.value, rank: i + 1 };
  });
  const all = entries.map((e) => e.value);
  return { values, missing: [], domain: [Math.min(...all), Math.max(...all)], excluded: 0 };
}

function MapBody({ def, small = false }: { def: TourChartDef; small?: boolean }) {
  const provinces = useProvinces();
  const values = useMemo(mockProvinceValues, []);
  const [selected, setSelected] = useState<ProvinceId | null>(null);
  if (provinces.status === 'loading') return <p className="poster">Cargando la geometría de las provincias...</p>;
  if (provinces.status === 'error') return <p style={{ color: 'var(--state-warning)' }}>{`La geometría de las provincias no está disponible: ${provinces.message}`}</p>;
  const summary = mapSummary(values, 'level', 'valor productivo (datos de prueba)', 2025, UNIT);
  return (
    <Chart2D3D
      spec={{
        kind: 'map',
        title: def.title,
        geo: provinces.geo,
        values,
        metric: 'level',
        selectedId: selected,
        formatValue: (v) => formatValue(v, UNIT),
        onSelect: (id) => setSelected(id as ProvinceId | null),
        summary
      }}
    >
      <ProvinceMap
        geo={provinces.geo}
        values={values}
        unit={UNIT}
        indicatorLabel="valor productivo"
        metric="level"
        selectedId={selected}
        year={2025}
        observed
        hideTitle
        compact={small}
        onSelect={setSelected}
      />
    </Chart2D3D>
  );
}

/** One step of the Recorrido: the title and the buttons of the frame, and one to four charts on screen. */
export function ChartStep({ step }: { step: number }) {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const count = useTourLayout((s) => s.count);
  const focus = useTourLayout((s) => s.focus);
  const setCount = useTourLayout((s) => s.setCount);
  const setFocus = useTourLayout((s) => s.setFocus);
  const def = TOUR_CHARTS[step];
  if (!def) return null;
  const steps = visibleSteps(step, focus ? 4 : count);
  // "1/3": the chart of the step is the big one, on the right; the others are small, on the left, and a click makes one of them the big one
  const small = focus ? steps.filter((s) => s !== step) : [];
  const shown = focus ? [...small, step] : steps;
  const layoutKey = focus ? 'focus' : String(count);
  return (
    <section className="gdp-step" aria-label={def.title}>
      <header className="gdp-head">
        <Reveal k={String(step)} className="gdp-title">
          <h2>{def.title}</h2>
          <p className="gdp-sub">
            {def.subtitle} · <span className="gdp-mock">{def.source}</span>
          </p>
          <Legend def={def} />
        </Reveal>
        <div className="tour-controls">
          <Segmented
            label="Gráficos en pantalla"
            options={COUNTS}
            value={focus ? 'focus' : (String(count) as '1' | '2' | '3' | '4')}
            onChange={(next) => (next === 'focus' ? setFocus() : setCount(Number(next) as TourCount))}
          />
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
      <div className="tour-grid" data-count={shown.length} data-layout={focus ? 'focus' : 'grid'}>
        {shown.map((s, i) => {
          const d = TOUR_CHARTS[s]!;
          const isSmall = focus && s !== step;
          return (
            <Reveal key={`${s}-${layoutKey}`} k={`${s}-${layoutKey}`} delay={i * REVEAL_STAGGER} className="gdp-chart" data-step={s} data-size={focus ? (isSmall ? 'small' : 'big') : undefined}>
              {shown.length > 1 && (
                <div className="tour-caption">
                  <strong>{d.title}</strong>
                  <Legend def={d} />
                </div>
              )}
              <Reveal k={mode} className="tour-chart">{d.kind === 'map' ? <MapBody def={d} small={isSmall} /> : <ChartBody def={d} />}</Reveal>
              {isSmall && (
                <button type="button" className="tour-pick" aria-label={`Ver grande: ${d.title}`} onClick={() => dispatch({ type: 'tourSet', step: s })} />
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
