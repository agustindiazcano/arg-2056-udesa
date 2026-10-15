import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { formatNumber } from '../charts/format.js';
import { Reveal } from '../motion/Reveal.js';
import { Segmented } from '../ui/Segmented.js';
import { GDP_UNIT } from './gdpFacts.js';
import { errorChart, growthChart } from './rule70Charts.js';
import type { Scale } from './rule70Charts.js';
import { DEFAULT_RATE, RATE_MAX, RATE_MIN, RATE_STEP, START_YEAR, argentinaDoubling, clampRate, ruleTable } from './rule70Model.js';

const TITLE = 'La regla del 70';

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
 * rules of 70 and 72, how wrong each rule is for each rate, the compound growth on a linear or a logarithmic scale, and when the real GDP of
 * Argentina (from its 2026 level) doubles at the rate chosen. Pure arithmetic, see `rule70Model.ts` and `core/doubling.ts`.
 */
export function Rule70Step() {
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [draft, setDraft] = useState(String(DEFAULT_RATE));
  const [scale, setScale] = useState<Scale>('linear');
  const [horizon, setHorizon] = useState<'30' | '50' | '100'>('50');

  const table = useMemo(() => ruleTable(rate), [rate]);
  const arg = useMemo(() => argentinaDoubling(rate), [rate]);
  const growth = useMemo(() => growthChart(rate, Number(horizon), scale), [rate, horizon, scale]);
  const errors = useMemo(() => errorChart(), []);

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
    <section className="gdp-step rule70-step" aria-label={TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{TITLE}</h2>
          <p className="gdp-sub">Cuánto tarda en duplicarse algo que crece a una tasa constante: la fórmula exacta, las reglas del 70 y del 72, y el PBI de Argentina</p>
        </Reveal>
      </header>

      <div className="rule70-grid">
        <div className="rule70-col">
          <Reveal k="growth" className="gdp-chart rule70-card">
            <div className="rule70-card-head">
              <strong>Crecimiento a {es(rate)} % por año</strong>
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

          <Reveal k="errors" delay={0.07} className="gdp-chart rule70-card">
            <div className="rule70-card-head">
              <strong>Cuánto se equivoca cada regla, según la tasa</strong>
              <span className="rule70-legend">
                <span className="rule70-key rule70-key--70" aria-hidden="true" /> Regla del 70 <span className="rule70-key rule70-key--72" aria-hidden="true" /> Regla del 72
              </span>
            </div>
            <div className="rule70-chart">
              <EChart option={errors.option} aria-label={errors.summary} />
            </div>
            <details>
              <summary>Ver los datos del error</summary>
              <table className="rule70-table" aria-label="Error de las reglas por tasa">
                <thead>
                  <tr>
                    <th scope="col">Tasa (% anual)</th>
                    <th scope="col">Regla del 70 (%)</th>
                    <th scope="col">Regla del 72 (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.labels.map((label, i) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{es(errors.error70[i]!, 2)}</td>
                      <td>{es(errors.error72[i]!, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
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
                  <th scope="col">Error</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Exacta</td>
                  <td>{Number.isFinite(table.exact) ? `${es(table.exact)} años` : 'nunca'}</td>
                  <td>t = ln 2 / ln(1 + r)</td>
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
    </section>
  );
}
