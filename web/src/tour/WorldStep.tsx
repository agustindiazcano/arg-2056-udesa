import React, { useEffect, useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { buildColumns, buildFollowedSeries } from '../charts/builders/tourCharts.js';
import { formatValue } from '../charts/format.js';
import { Chart2D3D } from '../charts3d/Chart2D3D.js';
import { FOLLOW_TOTAL_MS } from '../charts3d/followAnim.js';
import { barsSpec, linesSpec } from '../charts3d/specs.js';
import { Reveal } from '../motion/Reveal.js';
import { useReducedMotion } from '../runtime/useReducedMotion.js';
import { useStore } from '../state/store.js';
import { tokens } from '../styles/tokens.js';
import { Segmented } from '../ui/Segmented.js';
import { seriesFrame, valueAt } from './worldAnim.js';
import { FIRST_YEAR, HOME, LAST_YEAR, MOCK_SOURCE, WORLD_UNIT, argentinaSince1900, regionRanking, worldRanking } from './worldData.js';

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const TITLE = `El PBI de la Argentina desde ${FIRST_YEAR}`;
const SERIES_NAME = 'PBI de la Argentina';

/** The clock of the animation: milliseconds since it began, updated on every animation frame; a run starts again when `run` changes. */
function useElapsed(run: number, reduced: boolean): number {
  const [elapsed, setElapsed] = useState(reduced ? FOLLOW_TOTAL_MS : 0);
  useEffect(() => {
    if (reduced) {
      setElapsed(FOLLOW_TOTAL_MS);
      return;
    }
    const start = performance.now();
    let id = 0;
    const tick = (now: number) => {
      const ms = Math.min(FOLLOW_TOTAL_MS, now - start);
      setElapsed(ms);
      if (ms < FOLLOW_TOTAL_MS) id = requestAnimationFrame(tick);
    };
    setElapsed(0);
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [run, reduced]);
  return elapsed;
}

/**
 * Step 0 of the Recorrido: the GDP of Argentina from 1900 to today as a line that draws itself year by year while the view
 * follows it, and pulls back when it reaches the last year (in 2D and in 3D); on the right the top 20 of the world's economies
 * and the largest economies of the region. Made-up values.
 */
export function WorldStep() {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);
  const elapsed = useElapsed(run, reduced);

  const series = useMemo(argentinaSince1900, []);
  const today = series.values.at(-1) ?? 0;
  const world = useMemo(() => worldRanking(today), [today]);
  const region = useMemo(() => regionRanking(today), [today]);
  const home = world.find((c) => c.country === HOME);

  const summary = `${SERIES_NAME} de ${FIRST_YEAR} a ${LAST_YEAR} (datos de prueba): de ${formatValue(series.values[0] ?? null, WORLD_UNIT)} a ${formatValue(today, WORLD_UNIT)}`;
  const frame = useMemo(() => seriesFrame(elapsed, series.years, series.values), [elapsed, series]);
  const flat = useMemo(() => buildFollowedSeries(series.years, series.values, frame, { unit: WORLD_UNIT, name: SERIES_NAME, summary }), [series, frame, summary]);
  // a new object on every run: the 3D chart draws itself again
  const spec = useMemo(
    () =>
      linesSpec({
        title: SERIES_NAME,
        unit: WORLD_UNIT,
        xLabels: series.years.map(String),
        series: [{ name: SERIES_NAME, values: series.values, tone: 'highlight' }],
        follow: true,
        summary
      }),
    [series, summary, run, mode]
  );

  const topWorld = world.slice(0, 20);
  const regionBars = useMemo(() => {
    const text = `Las mayores economías de la región, en miles de millones de USD (datos de prueba): ${region.map((c) => `${c.country} ${formatValue(c.value, WORLD_UNIT)}`).join(', ')}`;
    const { option } = buildColumns(region.map((c) => c.country), [{ name: 'PBI', values: region.map((c) => c.value), color: tokens.muted }], {
      unit: WORLD_UNIT,
      highlight: HOME,
      summary: text,
      dense: { barWidth: 22, rotate: 35 }
    });
    return { option, summary: text, spec: barsSpec(region.map((c) => ({ label: c.country, value: c.value })), { title: 'Mayores economías de la región', unit: WORLD_UNIT, highlight: HOME, summary: text }) };
  }, [region]);

  const shownYear = Math.floor(frame.year + 1e-6);
  const shownValue = valueAt(series.years, series.values, frame.year);

  return (
    <section className="gdp-step prov-step" aria-label={TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{TITLE}</h2>
          <p className="gdp-sub">
            {WORLD_UNIT}, {FIRST_YEAR} a {LAST_YEAR} · <span className="gdp-mock">{MOCK_SOURCE}</span>
          </p>
        </Reveal>
        <div className="tour-controls">
          <button type="button" className="seg world-replay" onClick={() => setRun((n) => n + 1)}>
            Repetir
          </button>
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

      <div className="prov-grid">
        <Reveal k="main" className="gdp-chart prov-map">
          <div className="world-year" aria-hidden="true">
            <strong>{shownYear}</strong>
            <span>{formatValue(Math.round(shownValue), WORLD_UNIT)}</span>
          </div>
          <div className="tour-chart" key={`${mode}-${run}`}>
            <Chart2D3D spec={spec}>
              <EChart option={flat.option} aria-label={summary} />
            </Chart2D3D>
          </div>
        </Reveal>

        <div className="prov-side">
          <Reveal k="top" delay={0.07} className="gdp-chart prov-rank" role="region" aria-label="Ranking mundial de PBI">
            <div className="prov-rank-head">
              <strong>Top 20 mundial de PBI</strong>
              <span className="gdp-sub">{WORLD_UNIT}</span>
            </div>
            <table className="world-table">
              <thead>
                <tr>
                  <th scope="col">Puesto</th>
                  <th scope="col">País</th>
                  <th scope="col">PBI</th>
                </tr>
              </thead>
              <tbody>
                {topWorld.map((c) => (
                  <tr key={c.country} data-home={c.country === HOME ? 'true' : undefined}>
                    <td>{c.rank}</td>
                    <td>{c.country}</td>
                    <td>{formatValue(c.value, '')}</td>
                  </tr>
                ))}
              </tbody>
              {home && home.rank > 20 && (
                <tfoot>
                  <tr data-home="true">
                    <td>{home.rank}</td>
                    <td>{home.country}</td>
                    <td>{formatValue(home.value, '')}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </Reveal>

          <Reveal k="region" delay={0.14} className="gdp-chart prov-bars" role="region" aria-label="Mayores economías de la región">
            <div className="tour-caption">
              <strong>Mayores economías de la región</strong>
            </div>
            <div className="tour-chart">
              <Chart2D3D spec={regionBars.spec}>
                <EChart option={regionBars.option} aria-label={regionBars.summary} />
              </Chart2D3D>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
