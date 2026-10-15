import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { addMilestones } from '../charts/builders/milestones.js';
import { buildFluidLines } from '../charts/builders/tourCharts.js';
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

const INDICATORS = [
  { value: 'gdp', label: 'PBI total' },
  { value: 'perCapita', label: 'PBI por habitante' }
] as const;

const UNIT = 'miles de millones de USD de 2015 (PBI real)';
const PER_CAPITA_UNIT = 'miles de USD de 2015 por habitante';
const POPULATION_UNIT = 'millones de personas';
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
  const [indicator, setIndicator] = useState<(typeof INDICATORS)[number]['value']>('gdp');
  // the lines draw themselves from 2026 to 2056 when the visitor presses play, like the first slide; starts paused
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);
  const [speed, setSpeed] = useState(1);
  const { elapsed, clock, seek, playing, play, pause } = useTimeline(run, reduced, speed, false);
  const stepSpeed = (by: 1 | -1) => setSpeed((v) => SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, SPEEDS.indexOf(v) + by))] ?? v);
  const year = SIM_START + followFrame(elapsed).reveal * (SIM_END - SIM_START);
  const shownYear = Math.min(SIM_END, Math.floor(year + 1e-6));

  const mine = useMemo(() => simulate(params), [params]);
  const reference = useMemo(() => simulate(DEFAULT_SIM), []);
  const end = mine.gdp.at(-1) ?? 0;
  const endRef = reference.gdp.at(-1) ?? 0;
  const endPerCapita = mine.perCapita.at(-1) ?? 0;
  const endPerCapitaRef = reference.perCapita.at(-1) ?? 0;
  const endPopulation = mine.population.at(-1) ?? 0;
  const perCapitaDelta = endPerCapitaRef > 0 ? ((endPerCapita / endPerCapitaRef) - 1) * 100 : null;
  const growth = averageGrowth(mine.gdp);
  const double = doublingYears(growth);
  const delta = endRef > 0 ? ((end - endRef) / endRef) * 100 : 0;

  const unit = indicator === 'gdp' ? UNIT : PER_CAPITA_UNIT;
  const mineValues = mine[indicator];
  const referenceValues = reference[indicator];
  const title = indicator === 'gdp' ? 'PBI total simulado' : 'PBI por habitante simulado';
  const summary = `${title} de ${SIM_START} a ${SIM_END}: de ${formatValue(mineValues[0] ?? null, unit)} a ${formatValue(mineValues.at(-1) ?? null, unit)} en tu escenario y ${formatValue(referenceValues.at(-1) ?? null, unit)} en el de referencia`;

  const spec = useMemo(() => {
    const xLabels = mine.years.map(String);
    const built = linesSpec({
      title,
      unit,
      xLabels,
      series: [
        { name: REFERENCE, values: referenceValues, tone: 'muted', dashed: true },
        { name: YOURS, values: mineValues, tone: 'accent', color: tokens.blue }
      ],
      follow: true,
      summary
    });
    return { ...built, clock };
  }, [title, unit, mine.years, referenceValues, mineValues, summary, clock]);

  const option = useMemo(() => {
    const series = [
      { name: REFERENCE, values: referenceValues, color: tokens.muted, dashed: true },
      { name: YOURS, values: mineValues, color: tokens.blue }
    ];
    const currentYear = playing || elapsed > 0 ? year : SIM_END;
    const { option: fluidOpt } = buildFluidLines(mine.years, series, currentYear, {
      unit,
      labelEvery: 4,
      summary,
      showHead: true,
      showGhost: true
    });
    // dot and pulsing milestone highlight at x2, x3, x4
    return indicator === 'gdp'
      ? addMilestones(
          fluidOpt,
          mine.years,
          [{ values: mineValues, color: tokens.blue }],
          currentYear,
          mineValues[0]
        )
      : fluidOpt;
  }, [referenceValues, mineValues, playing, elapsed, year, mine.years, unit, summary, indicator]);

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
            <Segmented label="Indicador" options={INDICATORS} value={indicator} onChange={setIndicator} />
          </div>
          <div className="world-year" aria-hidden="true">
            <strong>{shownYear}</strong>
            <span>{formatValue(mineValues[shownYear - SIM_START] ?? null, unit)}</span>
          </div>
          <div className="tour-chart" key={run}>
            <TourChart spec={spec}>
              <EChart option={option} aria-label={summary} />
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
            <div>
              <span className="sim-label">PBI por habitante en {SIM_END}</span>
              <strong>{formatValue(endPerCapita, PER_CAPITA_UNIT)}</strong>
              <span className="sim-label">
                {perCapitaDelta === null
                  ? 'Sin referencia'
                  : `${perCapitaDelta >= 0 ? '+' : ''}${formatDecimal(Math.round(perCapitaDelta * 10) / 10)} % frente a la referencia`}
              </span>
            </div>
            <div>
              <span className="sim-label">Población en {SIM_END}</span>
              <strong>{formatValue(endPopulation, POPULATION_UNIT)}</strong>
              <span className="sim-label">Senda demográfica seleccionada</span>
            </div>
          </div>
          <p className="sim-method">PBI por habitante = PBI real ÷ población (ONU WPP, variante media, anclada a INDEC).</p>

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
