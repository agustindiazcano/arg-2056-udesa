import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { formatNumber } from '../charts/format.js';
import { Reveal } from '../motion/Reveal.js';
import { Segmented } from '../ui/Segmented.js';
import { scenarioChart } from './rule70Charts.js';
import type { Scale } from './rule70Charts.js';
import { RATE_MAX, RATE_MIN, RATE_STEP } from './rule70Model.js';
import { compareScenarios } from './rule70Scenarios.js';

const SCALES = [
  { value: 'linear', label: 'Lineal' },
  { value: 'log', label: 'Logarítmica' }
] as const;

const es = (v: number, digits = 1): string => formatNumber(v, digits);

const YEARS_MIN = 1;
const YEARS_MAX = 100;
const START_MIN = 1;
const START_MAX = 1_000_000;

interface Field {
  draft: string;
  value: number;
  set: (text: string) => void;
  put: (n: number) => void;
  settle: () => void;
}

/** A number the visitor types: the field keeps what is typed, the calculation uses the last number held between the limits, and leaving the field puts that number in it. */
function useNumber(initial: number, min: number, max: number): Field {
  const [draft, setDraft] = useState(String(initial));
  const [value, setValue] = useState(initial);
  return {
    draft,
    value,
    set: (text) => {
      setDraft(text);
      const n = parseFloat(text.replace(',', '.'));
      if (Number.isFinite(n)) setValue(Math.min(max, Math.max(min, n)));
    },
    put: (n) => {
      setValue(n);
      setDraft(String(n));
    },
    settle: () => setDraft(String(value))
  };
}

const PRESETS = [
  { id: 'a', label: '3 % contra 10 %', a: 3, b: 10, years: 28 },
  { id: 'b', label: '3 % contra 4 %: un punto de diferencia', a: 3, b: 4, years: 30 }
] as const;

/**
 * The third tab of the rule-of-70 slide: two levels growing at two constant rates for N years: how many times each one multiplies, how
 * many times higher the faster one ends, and, when they start at different levels, when the faster one overtakes the other.
 */
export function ScenarioCompare() {
  const rateA = useNumber(3, RATE_MIN, RATE_MAX);
  const rateB = useNumber(10, RATE_MIN, RATE_MAX);
  const years = useNumber(28, YEARS_MIN, YEARS_MAX);
  const startA = useNumber(100, START_MIN, START_MAX);
  const startB = useNumber(100, START_MIN, START_MAX);
  const [scale, setScale] = useState<Scale>('linear');

  const horizon = Math.round(years.value);
  const result = useMemo(
    () => compareScenarios({ rateA: rateA.value, rateB: rateB.value, years: horizon, startA: startA.value, startB: startB.value }),
    [rateA.value, rateB.value, horizon, startA.value, startB.value]
  );
  const chart = useMemo(() => scenarioChart(result, scale, ['Nivel A', 'Nivel B']), [result, scale]);

  const apply = (p: (typeof PRESETS)[number]) => {
    rateA.put(p.a);
    rateB.put(p.b);
    years.put(p.years);
  };

  const sameStart = startA.value === startB.value;
  const ratio = result.ratioAtEnd;
  const ending =
    Math.abs(ratio - 1) < 1e-9 ? 'A y B terminan en el mismo nivel.' : ratio > 1 ? `B termina ${es(ratio)} veces el nivel de A.` : `A termina ${es(1 / ratio)} veces el nivel de B.`;
  const crossing = sameStart
    ? result.gapPoints === 0
      ? 'Crecen al mismo ritmo desde el mismo nivel: nunca se separan.'
      : 'Empiezan en el mismo nivel: no hay cruce, la diferencia solo se abre.'
    : result.crossing === null
      ? 'Con estos niveles iniciales y estas tasas no se cruzan.'
      : `Se cruzan a los ${es(result.crossing)} años${result.crossingInside ? '.' : `, después del horizonte de ${horizon} años.`}`;

  return (
    <div className="rule70-grid">
      <div className="rule70-col">
        <Reveal k={`chart-${scale}`} className="gdp-chart rule70-card">
          <div className="rule70-card-head">
            <strong>Dos niveles, dos tasas</strong>
            <Segmented label="Escala" options={SCALES} value={scale} onChange={setScale} />
          </div>
          <div className="rule70-chart">
            <EChart option={chart.option} aria-label={chart.summary} />
          </div>
          <details>
            <summary>Ver los datos de los niveles</summary>
            <table className="rule70-table" aria-label="Nivel por año">
              <thead>
                <tr>
                  <th scope="col">Año</th>
                  <th scope="col">Nivel A</th>
                  <th scope="col">Nivel B</th>
                </tr>
              </thead>
              <tbody>
                {chart.labels.map((year, i) => (
                  <tr key={year}>
                    <td>{year}</td>
                    <td>{es(result.levelsA[i]!)}</td>
                    <td>{es(result.levelsB[i]!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Reveal>
      </div>

      <div className="rule70-col rule70-col--stack">
        <Reveal k="inputs" delay={0.05} className="gdp-chart rule70-card">
          <strong>Elegí las dos tasas</strong>
          <div className="rule70-presets" role="group" aria-label="Casos">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className="chip" onClick={() => apply(p)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="rule70-inputs">
            {(
              [
                ['Tasa A (% anual)', rateA, RATE_MIN, RATE_MAX, RATE_STEP],
                ['Tasa B (% anual)', rateB, RATE_MIN, RATE_MAX, RATE_STEP],
                ['Años', years, YEARS_MIN, YEARS_MAX, 1],
                ['Nivel inicial de A', startA, START_MIN, START_MAX, 1],
                ['Nivel inicial de B', startB, START_MIN, START_MAX, 1]
              ] as const
            ).map(([label, f, min, max, step]) => (
              <label key={label} className="rule70-field">
                <span>{label}</span>
                <input type="number" aria-label={label} min={min} max={max} step={step} value={f.draft} onChange={(e) => f.set(e.target.value)} onBlur={f.settle} />
              </label>
            ))}
          </div>
        </Reveal>

        <Reveal k="results" delay={0.1} className="gdp-chart rule70-card">
          <table className="rule70-table" aria-label="Resultado de la comparación">
            <thead>
              <tr>
                <th scope="col">Medida</th>
                <th scope="col">A</th>
                <th scope="col">B</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Multiplicador</td>
                <td>×{es(result.multiplierA, 2)}</td>
                <td>×{es(result.multiplierB, 2)}</td>
              </tr>
              <tr>
                <td>Nivel final</td>
                <td>{es(result.levelsA.at(-1)!)}</td>
                <td>{es(result.levelsB.at(-1)!)}</td>
              </tr>
              <tr>
                <td>Cociente de B sobre A</td>
                <td colSpan={2}>{es(ratio, 2)}</td>
              </tr>
            </tbody>
          </table>
          <p>{ending}</p>
          <p>{crossing}</p>
        </Reveal>
      </div>
    </div>
  );
}
