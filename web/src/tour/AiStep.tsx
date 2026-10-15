import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { addMilestones } from '../charts/builders/milestones.js';
import { buildLines } from '../charts/builders/tourCharts.js';
import { formatValue } from '../charts/format.js';
import { FOLLOW_TOTAL_MS } from '../charts3d/followAnim.js';
import { linesSpec } from '../charts3d/specs.js';
import { Reveal } from '../motion/Reveal.js';
import { useReducedMotion } from '../runtime/useReducedMotion.js';
import { SPEEDS } from '../state/reducer.js';
import { Segmented } from '../ui/Segmented.js';
import { TourChart } from './TourChart.js';
import { tokens } from '../styles/tokens.js';
import { AI_SCENARIOS } from './aiScenarios.js';
import { perCapitaSeries, populationPath, summaries } from './aiModel.js';
import { GDP_UNIT } from './gdpFacts.js';
import { AI_TITLE } from './slideTitles.js';
import { aiImpactData } from './tourData.js';
import { useTimeline } from './useTimeline.js';

const FIRST = 2026;
const LAST = 2056;
const SPAN = LAST - FIRST;

const PlayIcon = () => (
  <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
    <path d="M3 1.5v11l9-5.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
    <path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" />
  </svg>
);
const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const speedFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

const pct = (v: number, digits = 1): string => `${v >= 0 ? '+' : ''}${v.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
const num = (v: number, digits = 1): string => v.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** How each scenario is called in the summary, next to its name. */
const TONE: Record<string, string> = { base: 'neutro', moderate: 'intermedio', optimistic: 'favorable' };

type Line = { name: string; values: Array<number | null>; color: string };

/** The lines drawn up to `year`, on axes that do not move while they draw (the whole range of the data is fixed). */
function lineOption(years: number[], series: Line[], year: number, unit: string, summary: string, withDots = false) {
  const shown = series.map((s) => ({ ...s, values: s.values.map((v, i) => (years[i]! <= Math.floor(year + 1e-6) ? v : null)) }));
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const { option } = buildLines(years.map(String), shown, { unit, labelEvery: 5, summary });
  const fixed = option as unknown as { yAxis: Record<string, unknown> };
  fixed.yAxis = { ...fixed.yAxis, min: Math.floor(Math.min(...all) * 0.97), max: Math.ceil(Math.max(...all) * 1.02) };
  return withDots ? addMilestones(option, years, series, Math.floor(year + 1e-6)) : option;
}

/**
 * Step 3 of the Recorrido, "Cuarta revolución industrial", built like the first slide: a big chart of the real GDP of Argentina from 2026 that draws
 * itself, year by year, with the three scenarios when the visitor presses play; on the right the GDP per person and the population (small), a table of
 * indicators at the year on screen and a summary of each scenario. There are no buttons to the charts of other slides.
 */
export function AiStep() {
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);
  const [speed, setSpeed] = useState(1);
  // the chart draws itself in 2D; the 3D view shows the whole path with a marker on the year on screen
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const { elapsed, seek, playing, play, pause } = useTimeline(run, reduced, speed);
  const stepSpeed = (by: 1 | -1) => setSpeed((v) => SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, SPEEDS.indexOf(v) + by))] ?? v);

  const gdp = useMemo(() => aiImpactData(), []);
  const perCapita = useMemo(() => perCapitaSeries(), []);
  const pop = useMemo(() => populationPath(), []);
  const rows = useMemo(() => summaries(), []);

  const year = FIRST + (Math.min(elapsed, FOLLOW_TOTAL_MS) / FOLLOW_TOTAL_MS) * SPAN;
  const shownYear = Math.min(LAST, Math.floor(year + 1e-6));
  const at = shownYear - FIRST;

  const gdpLines: Line[] = useMemo(() => gdp.series.map((s) => ({ name: s.name, values: s.values, color: s.color })), [gdp]);
  const gdpSummary = `PBI real de Argentina por escenario, de ${formatValue(gdp.series[0]!.values[0] ?? null, gdp.unit)} en 2026 a 2056: ${gdp.series
    .map((s) => `${s.name} ${formatValue(s.values.at(-1) ?? null, gdp.unit)}`)
    .join(', ')}`;
  const perCapitaSummary = `PBI por habitante por escenario: ${perCapita.series.map((s) => `${s.name} ${formatValue(s.values.at(-1) ?? null, perCapita.unit)} en 2056`).join(', ')}`;
  const popLines: Line[] = useMemo(() => [{ name: 'Población', values: pop.values, color: tokens.muted }], [pop]);
  const popSummary = `Población de Argentina de ${num(pop.values[0]!)} millones en 2025 a ${num(pop.values.at(-1)!)} en 2056`;

  const big = useMemo(() => lineOption(gdp.years, gdpLines, year, gdp.unit, gdpSummary, true), [gdp, gdpLines, year, gdpSummary]);
  const small = useMemo(() => lineOption(perCapita.years, perCapita.series, year, perCapita.unit, perCapitaSummary), [perCapita, year, perCapitaSummary]);
  const bigSpec = useMemo(
    () =>
      linesSpec({
        title: 'PBI real de Argentina por escenario',
        unit: gdp.unit,
        xLabels: gdp.years.map(String),
        series: gdpLines.map((s) => ({ ...s, tone: 'muted' as const })),
        marker: at,
        summary: gdpSummary
      }),
    [gdp, gdpLines, at, gdpSummary]
  );
  const popYears = pop.years;
  const popOption = useMemo(() => lineOption(popYears, popLines, Math.max(year, 2026), 'M', popSummary), [popYears, popLines, year, popSummary]);

  return (
    <section className="gdp-step prov-step" aria-label={AI_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{AI_TITLE}</h2>
          <p className="gdp-sub">
            {GDP_UNIT}, {FIRST} a {LAST} · tres escenarios con la IA como impulso a la productividad
          </p>
        </Reveal>
        <div className="tour-controls">
          <button type="button" className="btn btn--icon world-replay" aria-label={playing ? 'Pausar' : 'Reproducir'} onClick={playing ? pause : play}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <div role="group" aria-label="Velocidad" className="control-group">
            <button type="button" className="btn btn--icon" aria-label="Más lento" onClick={() => stepSpeed(-1)}>
              −
            </button>
            <span className="speed">{speedFormat.format(speed)}×</span>
            <button type="button" className="btn btn--icon" aria-label="Más rápido" onClick={() => stepSpeed(1)}>
              +
            </button>
          </div>
          <button type="button" className="btn world-replay" onClick={() => setRun((n) => n + 1)}>
            Repetir
          </button>
          <label className="world-timeline">
            <span aria-hidden="true">{FIRST}</span>
            <input
              type="range"
              min={FIRST}
              max={LAST}
              step={0.25}
              value={year}
              aria-label="Línea de tiempo"
              aria-valuetext={`Año ${shownYear}`}
              onChange={(e) => seek(((Number(e.target.value) - FIRST) / SPAN) * FOLLOW_TOTAL_MS)}
            />
            <span aria-hidden="true">{LAST}</span>
          </label>
          <Segmented label="Vista" options={VIEWS} value={view} onChange={setView} />
        </div>
      </header>

      <div className="prov-grid">
        <Reveal k="main" className="gdp-chart prov-map">
          <div className="world-year" aria-hidden="true">
            <strong>{shownYear}</strong>
            <span>{formatValue(gdp.series[1]!.values[at] ?? null, gdp.unit)}</span>
          </div>
          <div className="ai-key-row" role="list" aria-label="Escenarios">
            {AI_SCENARIOS.map((s) => (
              <span key={s.id} role="listitem" className="ai-key">
                <span className="tour-swatch" style={{ background: s.color }} aria-hidden="true" /> {s.name}
              </span>
            ))}
          </div>
          <div className="tour-chart">
            <TourChart spec={bigSpec} mode={view}>
              <EChart option={big} aria-label={gdpSummary} />
            </TourChart>
          </div>
        </Reveal>

        <div className="prov-side">
          <Reveal k="small" delay={0.07} className="gdp-chart ai-small" role="region" aria-label="PBI por habitante y población">
            <div className="ai-small-charts">
              <div className="ai-small-chart">
                <strong className="composition-title">PBI por habitante (miles de USD)</strong>
                <div className="tour-chart">
                  <EChart option={small} aria-label={perCapitaSummary} />
                </div>
              </div>
              <div className="ai-small-chart">
                <strong className="composition-title">Población (millones)</strong>
                <div className="tour-chart">
                  <EChart option={popOption} aria-label={popSummary} />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal k="numbers" delay={0.14} className="gdp-chart ai-numbers" role="region" aria-label={`Indicadores en ${shownYear}`}>
            <table aria-label={`Indicadores por escenario en ${shownYear}`}>
              <thead>
                <tr>
                  <th scope="col">{shownYear}</th>
                  {AI_SCENARIOS.map((s) => (
                    <th key={s.id} scope="col">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">PBI (miles de millones de USD)</th>
                  {gdp.series.map((s) => (
                    <td key={s.name}>{num(s.values[at] ?? 0)}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">PBI por habitante (miles de USD)</th>
                  {perCapita.series.map((s) => (
                    <td key={s.name}>{num(s.values[at] ?? 0, 2)}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Población (millones)</th>
                  {AI_SCENARIOS.map((s) => (
                    <td key={s.id}>{num(pop.values[at + 1] ?? pop.values.at(-1)!)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
            <ul className="ai-summary" aria-label="Resumen de los escenarios">
              {rows.map((r, k) => (
                <li key={r.id}>
                  <span className="tour-swatch" style={{ background: AI_SCENARIOS[k]!.color }} aria-hidden="true" />
                  <strong>{`${r.name} (${TONE[r.id]})`}</strong>
                  {`: ${pct(r.averageGrowth, 2)} anual, el PBI cambia ${pct(r.gdpChange)} y el PBI por habitante ${pct(r.perCapitaChange)} entre 2026 y 2056; duplicar el PBI llevaría ${num(r.doublingYears)} años. ${AI_SCENARIOS[k]!.comment}.`}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
