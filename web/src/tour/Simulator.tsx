import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { addMilestones } from '../charts/builders/milestones.js';
import { buildLines } from '../charts/builders/tourCharts.js';
import { formatDecimal, formatValue } from '../charts/format.js';
import { FOLLOW_MS, followFrame } from '../charts3d/followAnim.js';
import { linesSpec } from '../charts3d/specs.js';
import { Reveal } from '../motion/Reveal.js';
import { useReducedMotion } from '../runtime/useReducedMotion.js';
import { SPEEDS } from '../state/reducer.js';
import { useStore } from '../state/store.js';
import { tokens } from '../styles/tokens.js';
import { Segmented } from '../ui/Segmented.js';
import { TourChart } from './TourChart.js';
import { DEFAULT_SIM, SIM_END, SIM_FIELDS, SIM_START, averageGrowth, doublingYears, simulate } from './simModel.js';
import type { SimKey, SimParams } from './simModel.js';
import { useTimeline } from './useTimeline.js';

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
const speedFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const UNIT = 'miles de millones de USD de 2015 (PBI real)';
const TITLE = `Simulador: evolución del PBI hasta ${SIM_END}`;
const REFERENCE = 'Escenario de referencia';
const YOURS = 'Tu escenario';

/**
 * The Simulador section: a big chart of the GDP from 2025 to 2056 and, on the right, a bar of factors (base growth, AI, population,
 * productivity, investment) that change it. An illustration with plain arithmetic, not the model (`simModel.ts`).
 */
export function Simulator() {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const [params, setParams] = useState<SimParams>(DEFAULT_SIM);
  // the lines draw themselves from 2026 to 2056 when the visitor presses play, like the first slide
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);
  const [speed, setSpeed] = useState(1);
  const { elapsed, clock, seek, playing, play, pause } = useTimeline(run, reduced, speed);
  const stepSpeed = (by: 1 | -1) => setSpeed((v) => SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, SPEEDS.indexOf(v) + by))] ?? v);
  const year = SIM_START + followFrame(elapsed).reveal * (SIM_END - SIM_START);
  const shownYear = Math.min(SIM_END, Math.floor(year + 1e-6));

  const mine = useMemo(() => simulate(params), [params]);
  const reference = useMemo(() => simulate(DEFAULT_SIM), []);
  const end = mine.gdp.at(-1) ?? 0;
  const endRef = reference.gdp.at(-1) ?? 0;
  const growth = averageGrowth(mine.gdp);
  const double = doublingYears(growth);
  const delta = endRef > 0 ? ((end - endRef) / endRef) * 100 : 0;

  const chart = useMemo(() => {
    const xLabels = mine.years.map(String);
    const summary = `PBI simulado de ${SIM_START} a ${SIM_END}: de ${formatValue(mine.gdp[0] ?? null, UNIT)} a ${formatValue(end, UNIT)} en tu escenario y ${formatValue(endRef, UNIT)} en el de referencia`;
    const series = [
      { name: REFERENCE, values: reference.gdp, color: tokens.muted, dashed: true },
      { name: YOURS, values: mine.gdp, color: tokens.blue }
    ];
    const shown = series.map((s) => ({ ...s, values: s.values.map((v, i) => (mine.years[i]! <= shownYear ? v : null)) }));
    const lines = buildLines(xLabels, shown, { unit: UNIT, labelEvery: 4, summary }).option as unknown as { yAxis: Record<string, unknown> };
    // the axis does not move while the lines draw: it fits the whole range of both lines
    const all = [...reference.gdp, ...mine.gdp];
    lines.yAxis = { ...lines.yAxis, min: Math.floor(Math.min(...all) * 0.97), max: Math.ceil(Math.max(...all) * 1.02) };
    // a dot and the year at which your GDP is twice, three and four times that of 2026, once the line has got there
    const option = addMilestones(lines, mine.years, [{ values: mine.gdp, color: tokens.blue }], shownYear);
    const spec = linesSpec({
      title: 'PBI simulado',
      unit: UNIT,
      xLabels,
      series: [
        { name: REFERENCE, values: reference.gdp, tone: 'muted', dashed: true },
        { name: YOURS, values: mine.gdp, tone: 'accent', color: tokens.blue }
      ],
      follow: true,
      summary
    });
    return { option, spec: { ...spec, clock }, summary };
  }, [mine, reference, end, endRef, shownYear, clock]);

  const set = (key: SimKey, value: number) => setParams((p) => ({ ...p, [key]: value }));

  return (
    <section className="gdp-step sim-step" aria-label={TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{TITLE}</h2>
          <p className="gdp-sub">
            {UNIT}, {SIM_START} a {SIM_END}
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
            <span aria-hidden="true">{SIM_START}</span>
            <input
              type="range"
              min={SIM_START}
              max={SIM_END}
              step={0.25}
              value={year}
              aria-label="Línea de tiempo"
              aria-valuetext={`Año ${shownYear}`}
              onChange={(e) => seek(((Number(e.target.value) - SIM_START) / (SIM_END - SIM_START)) * FOLLOW_MS)}
            />
            <span aria-hidden="true">{SIM_END}</span>
          </label>
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

      <div className="sim-grid">
        <Reveal k="chart" className="gdp-chart sim-chart">
          <div className="tour-caption">
            <ul className="tour-legend" aria-label="Referencias">
              <li>
                <span className="tour-swatch" style={{ background: tokens.muted }} aria-hidden="true" />
                {REFERENCE}
              </li>
              <li>
                <span className="tour-swatch" style={{ background: tokens.blue }} aria-hidden="true" />
                {YOURS}
              </li>
            </ul>
          </div>
          <div className="world-year" aria-hidden="true">
            <strong>{shownYear}</strong>
            <span>{formatValue(mine.gdp[shownYear - SIM_START] ?? null, UNIT)}</span>
          </div>
          <div className="tour-chart" key={run}>
            <TourChart spec={chart.spec}>
              <EChart option={chart.option} aria-label={chart.summary} />
            </TourChart>
          </div>
        </Reveal>

        <Reveal k="factors" delay={0.07} className="gdp-chart sim-panel" role="region" aria-label="Factores">
          <div className="sim-results">
            <div>
              <span className="sim-label">PBI en {SIM_END}</span>
              <strong data-testid="sim-gdp-end">{formatValue(end, UNIT)}</strong>
              <span className="sim-label">{`${delta >= 0 ? '+' : ''}${formatDecimal(Math.round(delta * 10) / 10)} % frente a la referencia`}</span>
            </div>
            <div>
              <span className="sim-label">Crecimiento medio</span>
              <strong>{formatDecimal(growth)} % anual</strong>
              <span className="sim-label">{double === null ? 'No se duplica' : `Se duplica en ${Math.round(double)} años`}</span>
            </div>
          </div>

          <div className="sim-factors">
            {SIM_FIELDS.map((f) => (
              <label key={f.key} className="sim-factor">
                <span className="sim-factor-head">
                  <span>{f.label}</span>
                  <output>{`${formatDecimal(params[f.key])} ${f.unit}`}</output>
                </span>
                <input
                  type="range"
                  aria-label={f.label}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={params[f.key]}
                  onChange={(e) => set(f.key, Number(e.target.value))}
                />
                <span className="sim-help">{f.help}</span>
              </label>
            ))}
          </div>

          <button type="button" className="btn" onClick={() => setParams(DEFAULT_SIM)}>
            Restablecer
          </button>
        </Reveal>
      </div>
    </section>
  );
}
