import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { buildLines } from '../charts/builders/tourCharts.js';
import { formatDecimal, formatValue } from '../charts/format.js';
import { linesSpec } from '../charts3d/specs.js';
import { Reveal } from '../motion/Reveal.js';
import { useStore } from '../state/store.js';
import { tokens } from '../styles/tokens.js';
import { Segmented } from '../ui/Segmented.js';
import { TourChart } from './TourChart.js';
import { DEFAULT_SIM, SIM_END, SIM_FIELDS, SIM_START, averageGrowth, doublingYears, simulate } from './simModel.js';
import type { SimKey, SimParams } from './simModel.js';

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const UNIT = 'miles de millones de USD';
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

  const mine = useMemo(() => simulate(params), [params]);
  const reference = useMemo(() => simulate(DEFAULT_SIM), []);
  const end = mine.gdp.at(-1) ?? 0;
  const endRef = reference.gdp.at(-1) ?? 0;
  const growth = averageGrowth(mine.gdp);
  const double = doublingYears(growth);
  const delta = endRef > 0 ? ((end - endRef) / endRef) * 100 : 0;

  const chart = useMemo(() => {
    const xLabels = mine.years.map(String);
    const summary = `PBI simulado de ${SIM_START} a ${SIM_END} (ilustrativo): de ${formatValue(mine.gdp[0] ?? null, UNIT)} a ${formatValue(end, UNIT)} en tu escenario y ${formatValue(endRef, UNIT)} en el de referencia`;
    const series = [
      { name: REFERENCE, values: reference.gdp, color: tokens.muted, dashed: true },
      { name: YOURS, values: mine.gdp, color: tokens.blue }
    ];
    const { option } = buildLines(xLabels, series, { unit: UNIT, labelEvery: 4, summary });
    const spec = linesSpec({
      title: 'PBI simulado',
      unit: UNIT,
      xLabels,
      series: [
        { name: REFERENCE, values: reference.gdp, tone: 'muted', dashed: true },
        { name: YOURS, values: mine.gdp, tone: 'accent', color: tokens.blue }
      ],
      summary
    });
    return { option, spec, summary };
  }, [mine, reference, end, endRef]);

  const set = (key: SimKey, value: number) => setParams((p) => ({ ...p, [key]: value }));

  return (
    <section className="gdp-step sim-step" aria-label={TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{TITLE}</h2>
          <p className="gdp-sub">
            {UNIT}, {SIM_START} a {SIM_END} · <span className="gdp-mock">Simulación ilustrativa con aritmética simple, no es el modelo</span>
          </p>
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
          <div className="tour-chart">
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
