import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { formatNumber } from '../charts/format.js';
import { Reveal } from '../motion/Reveal.js';
import { Segmented } from '../ui/Segmented.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { RULE70_TITLE } from './slideTitles.js';
import { STEP_INFO } from './stepInfo.js';
import { TabbedChart } from '../ui/TabbedChart.js';
import { ConvergencePlanner } from './ConvergencePlanner.js';
import { CountryExplorer } from './CountryExplorer.js';
import { ImfProjections } from './ImfProjections.js';
import { ScenarioCompare } from './ScenarioCompare.js';
import { GDP_UNIT } from './gdpFacts.js';
import { growthChart } from './rule70Charts.js';
import type { Scale } from './rule70Charts.js';
import { DEFAULT_RATE, RATE_MAX, RATE_MIN, RATE_STEP, START_YEAR, argentinaDoubling, clampRate, ruleTable } from './rule70Model.js';

const TITLE = RULE70_TITLE;

const SCALES = [
  { value: 'linear', label: 'Lineal' },
  { value: 'log', label: 'Logarítmica' }
] as const;

const HORIZONS = [
  { value: '30', label: '30 años' },
  { value: '50', label: '50 años' },
  { value: '100', label: '100 años' }
] as const;

const es = (v: number, digits = 1): string => formatNumber(v, digits);
const signed = (v: number, digits = 1): string => `${v >= 0 ? '+' : '−'}${es(Math.abs(v), digits)}`;

/**
 * Step 5 of the Recorrido, the rule of 70: how long a level takes to double at a constant growth rate, by the exact formula and by the
 * rules of 70 and 72, the compound growth on a linear or a logarithmic scale, and when the real GDP of
 * Argentina (from its 2026 level) doubles at the rate chosen. Pure arithmetic, see `rule70Model.ts` and `core/doubling.ts`.
 */
function Calculator() {
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [draft, setDraft] = useState(String(DEFAULT_RATE));
  const [scale, setScale] = useState<Scale>('linear');
  const [horizon, setHorizon] = useState<'30' | '50' | '100'>('50');

  const table = useMemo(() => ruleTable(rate), [rate]);
  const arg = useMemo(() => argentinaDoubling(rate), [rate]);
  const growth = useMemo(() => growthChart(rate, Number(horizon), scale), [rate, horizon, scale]);
  const step5Info = STEP_INFO[5]!;

  // the field keeps what is typed (so 0.5 can be typed through "0"); the calculation always uses the rate held between the limits
  const type = (text: string) => {
    setDraft(text);
    const n = parseFloat(text.replace(',', '.'));
    if (Number.isFinite(n)) setRate(clampRate(n));
  };
  const pick = (n: number) => {
    setRate(n);
    setDraft(String(n));
  };

  return (
    <div className="rule70-grid">
      <div className="rule70-col">
        <Reveal k="growth" className="gdp-chart rule70-card">
          <div className="rule70-card-head">
            <strong>Crecimiento a {es(rate)} % por año</strong>
            <ChartHelp title="Crecimiento compuesto" paragraphs={[step5Info.paragraphs[0]!, step5Info.paragraphs[1]!]} how={step5Info.how} refs={step5Info.refs} />
            <div className="rule70-switches">
              <Segmented label="Escala" options={SCALES} value={scale} onChange={setScale} />
              <Segmented label="Horizonte" options={HORIZONS} value={horizon} onChange={setHorizon} />
            </div>
          </div>
          <div className="rule70-chart">
            <EChart option={growth.option} aria-label={growth.summary} />
          </div>
          <details>
            <summary>Ver los datos del crecimiento</summary>
            <table className="rule70-table" aria-label="Nivel por año">
              <thead>
                <tr>
                  <th scope="col">Año</th>
                  <th scope="col">Veces el nivel de {START_YEAR}</th>
                </tr>
              </thead>
              <tbody>
                {growth.labels.map((year, i) => (
                  <tr key={year}>
                    <td>{year}</td>
                    <td>{es(growth.values[i]!, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Reveal>

        <Reveal k="explainer" delay={0.07} className="gdp-chart rule70-card" role="region" aria-label="¿Cómo funciona la regla del 70 en forma simple?">
          <div className="rule70-card-head">
            <strong>¿Cómo funciona la regla del 70 en forma simple?</strong>
          </div>
          <p>
            Para saber cuántos años tarda un país en <strong>duplicar su economía</strong>, dividís <strong>70 por la tasa de crecimiento anual</strong>:
          </p>
          <table className="rule70-table" aria-label="Ejemplos prácticos de duplicación">
            <thead>
              <tr>
                <th scope="col">Si el país crece a...</th>
                <th scope="col">Cuenta rápida (70 ÷ tasa)</th>
                <th scope="col">Se duplica cada...</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1 % anual</td>
                <td>70 ÷ 1</td>
                <td>~70 años (una vida entera)</td>
              </tr>
              <tr>
                <td>2 % anual</td>
                <td>70 ÷ 2</td>
                <td>~35 años (una generación)</td>
              </tr>
              <tr>
                <td>3,5 % anual</td>
                <td>70 ÷ 3,5</td>
                <td>~20 años</td>
              </tr>
              <tr>
                <td>5 % anual</td>
                <td>70 ÷ 5</td>
                <td>~14 años</td>
              </tr>
              <tr>
                <td>7 % anual</td>
                <td>70 ÷ 7</td>
                <td>~10 años (milagro asiático)</td>
              </tr>
            </tbody>
          </table>
          <p className="rule70-note">
            Como el crecimiento se acumula año tras año sobre lo ya ganado (interés compuesto), crecer apenas 1 o 2 puntos más por año cambia por completo el ingreso de una generación.
          </p>
        </Reveal>
      </div>

      <div className="rule70-col">
        <Reveal k="calc" delay={0.05} className="gdp-chart rule70-card">
          <strong>Tasa de crecimiento anual</strong>
          <div className="rule70-rate">
            <input
              type="range"
              aria-label="Tasa de crecimiento anual (deslizador)"
              min={RATE_MIN}
              max={RATE_MAX}
              step={RATE_STEP}
              value={rate}
              onChange={(e) => pick(clampRate(Number(e.target.value)))}
            />
            <label>
              <span className="rule70-visually-hidden">Tasa de crecimiento anual (número)</span>
              <input type="number" min={RATE_MIN} max={RATE_MAX} step={RATE_STEP} value={draft} onChange={(e) => type(e.target.value)} onBlur={() => setDraft(String(rate))} />
              <span aria-hidden="true"> % por año</span>
            </label>
          </div>
          <table className="rule70-table" aria-label="Tiempo para duplicarse">
            <thead>
              <tr>
                <th scope="col">Método</th>
                <th scope="col">Tiempo</th>
                <th scope="col">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Exacta</td>
                <td>{Number.isFinite(table.exact) ? `${es(table.exact)} años` : 'nunca'}</td>
                <td>Cálculo compuesto exacto</td>
              </tr>
              {table.rows.map((r) => (
                <tr key={r.rule}>
                  <td>Regla del {r.rule}</td>
                  <td>{es(r.years)} años</td>
                  <td>
                    {signed(r.errorYears)} años ({signed(r.errorPct)} %)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="rule70-note">La regla divide 70 (o 72) por la tasa en %. Con tasas chicas el 70 se acerca; cerca de 8 % el 72 es mejor.</p>
        </Reveal>

        <Reveal k="argentina" delay={0.1} className="gdp-chart rule70-card" role="region" aria-label="Argentina: cuándo se duplica el PBI">
          <strong>Argentina: cuándo se duplica el PBI</strong>
          <p>
            El PBI real de Argentina fue de <strong>{es(arg.startValue)}</strong> {GDP_UNIT} en {arg.startYear}.
            {arg.year === null || arg.valueAtYear === null ? (
              <> Con una tasa de {es(rate)} % por año no se duplica.</>
            ) : (
              <>
                {' '}
                Si creciera <strong>{es(rate)} % por año</strong>, se duplicaría en <strong>{es(arg.years)} años</strong>: el nivel del doble se alcanza en <strong>{arg.year}</strong>, con{' '}
                {es(arg.valueAtYear)} {GDP_UNIT}.
              </>
            )}
          </p>
        </Reveal>
      </div>
    </div>
  );
}

/**
 * Step 5 of the Recorrido, the rule of 70, in tabs: the calculator, real countries, scenario comparison,
 * convergence planning towards developed nations, and IMF projections.
 */
export function Rule70Step() {
  const step5Info = STEP_INFO[5]!;
  return (
    <section className="gdp-step rule70-step" aria-label={TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <div className="slide-title-row">
            <h2>{TITLE}</h2>
            <ChartHelp
              title={step5Info.heading}
              lead="Cuánto tarda en duplicarse algo que crece a una tasa constante: la fórmula exacta, las reglas del 70 y del 72, qué tasa necesita Argentina para converger con países desarrollados y lo que pasó en economías reales"
              paragraphs={step5Info.paragraphs}
              how={step5Info.how}
              refs={step5Info.refs}
            />
          </div>
          <p className="gdp-sub">
            <RefList ids={step5Info.refs} />
          </p>
        </Reveal>
      </header>
      <TabbedChart
        label={TITLE}
        tabs={[
          { id: 'calculator', label: 'Calculadora', render: () => <Calculator /> },
          { id: 'convergence', label: 'Convergencia y desarrollo', render: () => <ConvergencePlanner /> },
          { id: 'countries', label: 'Países reales', render: () => <CountryExplorer /> },
          { id: 'scenarios', label: 'Escenarios', render: () => <ScenarioCompare /> },
          { id: 'imf', label: 'Proyecciones del FMI', render: () => <ImfProjections /> }
        ]}
      />
    </section>
  );
}
