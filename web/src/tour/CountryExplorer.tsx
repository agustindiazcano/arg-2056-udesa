import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { formatNumber } from '../charts/format.js';
import { Reveal } from '../motion/Reveal.js';
import { MetricToggle } from '../ui/MetricToggle.js';
import { Segmented } from '../ui/Segmented.js';
import { countryChart, rollingChart } from './rule70Charts.js';
import type { Scale } from './rule70Charts.js';
import { INDICATOR_LABEL, INDICATOR_UNIT, PRESETS, ROLLING_WINDOW, analyse, countryList } from './rule70Countries.js';
import type { Indicator } from './rule70Countries.js';
import { FIRST_YEAR, LAST_YEAR, WORLD_SOURCE } from './worldData.js';

const INDICATORS = [
  { value: 'gdp', label: INDICATOR_LABEL.gdp },
  { value: 'percapita', label: INDICATOR_LABEL.percapita }
] as const;

const SCALES = [
  { value: 'linear', label: 'Lineal' },
  { value: 'log', label: 'Logarítmica' }
] as const;

const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
const es = (v: number, digits = 1): string => formatNumber(v, digits);

/**
 * The second tab of the rule-of-70 slide: for a real country, indicator and period, the rate between the endpoints and the one fitted on
 * every year, the doubling time they imply, how many times the level doubled, the real series against a constant rate and the rolling
 * doubling time. See `rule70Countries.ts`.
 */
export function CountryExplorer() {
  const first = PRESETS[0]!;
  const [code, setCode] = useState(first.code);
  const [indicator, setIndicator] = useState<Indicator>(first.indicator);
  const [from, setFrom] = useState(first.from);
  const [to, setTo] = useState(first.to);
  const [scale, setScale] = useState<Scale>('linear');

  const countries = useMemo(() => countryList(), []);
  const result = useMemo(() => analyse(code, indicator, from, to), [code, indicator, from, to]);
  const growth = useMemo(() => (result.ok ? countryChart(result, scale) : null), [result, scale]);
  const rolling = useMemo(() => (result.ok ? rollingChart(result) : null), [result]);

  const apply = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)!;
    setCode(p.code);
    setIndicator(p.indicator);
    setFrom(p.from);
    setTo(p.to);
  };

  return (
    <div className="rule70-grid">
      <div className="rule70-col">
        {result.ok && growth && rolling ? (
          <>
            <Reveal k={`growth-${code}-${indicator}-${from}-${to}`} className="gdp-chart rule70-card">
              <div className="rule70-card-head">
                <strong>Real contra una tasa constante</strong>
                <Segmented label="Escala" options={SCALES} value={scale} onChange={setScale} />
              </div>
              <div className="rule70-chart">
                <EChart option={growth.option} aria-label={growth.summary} />
              </div>
              <details>
                <summary>Ver los datos del crecimiento</summary>
                <table className="rule70-table" aria-label="Valor por año">
                  <thead>
                    <tr>
                      <th scope="col">Año</th>
                      <th scope="col">Real ({INDICATOR_UNIT[indicator]})</th>
                      <th scope="col">Tasa constante</th>
                      <th scope="col">Ajuste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {growth.labels.map((year, i) => (
                      <tr key={year}>
                        <td>{year}</td>
                        <td>{growth.actual[i] === null ? 'sin dato' : es(growth.actual[i]!)}</td>
                        <td>{es(growth.constant[i]!)}</td>
                        <td>{es(growth.fitted[i]!)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </Reveal>
            <Reveal k={`rolling-${code}-${indicator}-${from}-${to}`} delay={0.07} className="gdp-chart rule70-card">
              <strong>Cuánto tardaba en duplicarse, en ventanas de {ROLLING_WINDOW} años</strong>
              <div className="rule70-chart">
                <EChart option={rolling.option} aria-label={rolling.summary} />
              </div>
              <details>
                <summary>Ver los datos de las ventanas</summary>
                <table className="rule70-table" aria-label="Tiempo de duplicación por ventana">
                  <thead>
                    <tr>
                      <th scope="col">Ventana que termina en</th>
                      <th scope="col">Tasa (% anual)</th>
                      <th scope="col">Años para duplicarse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rolling.map((r) => (
                      <tr key={r.year}>
                        <td>{r.year}</td>
                        <td>{es(r.ratePct, 2)}</td>
                        <td>{Number.isFinite(r.doublingYears) ? es(r.doublingYears) : 'no se duplica'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </Reveal>
          </>
        ) : (
          <Reveal k="no-data" className="gdp-chart rule70-card">
            <p role="status">{result.ok ? '' : result.reason}</p>
          </Reveal>
        )}
      </div>

      <div className="rule70-col">
        <Reveal k="controls" delay={0.05} className="gdp-chart rule70-card">
          <strong>Elegí un caso</strong>
          <div className="rule70-presets" role="group" aria-label="Casos">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className="chip" onClick={() => apply(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          <label className="rule70-field">
            <span>País</span>
            <select aria-label="País" value={code} onChange={(e) => setCode(e.target.value)}>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <MetricToggle label="Indicador" options={INDICATORS} value={indicator} onChange={setIndicator} />
          <div className="rule70-field">
            <label>
              <span>Desde </span>
              <select aria-label="Desde" value={from} onChange={(e) => setFrom(Number(e.target.value))}>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span> hasta </span>
              <select aria-label="Hasta" value={to} onChange={(e) => setTo(Number(e.target.value))}>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="rule70-note">
            {WORLD_SOURCE}. El PBI per cápita es el PBI sobre la población del mismo archivo. Los años sin dato quedan vacíos: no se completan.
          </p>
        </Reveal>

        {result.ok && (
          <Reveal k="results" delay={0.1} className="gdp-chart rule70-card">
            <h3 className="rule70-case">
              {result.name}: {INDICATOR_LABEL[indicator]}, {result.from} a {result.to}
            </h3>
            <table className="rule70-table" aria-label="Resultados del período">
              <thead>
                <tr>
                  <th scope="col">Medida</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Detalle</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tasa entre extremos</td>
                  <td>{es(result.cagrPct, 2)} % por año</td>
                  <td>
                    de {es(result.v0)} a {es(result.v1)} en {result.years} años
                  </td>
                </tr>
                <tr>
                  <td>Tasa ajustada</td>
                  <td>{es(result.fit.ratePct, 2)} % por año</td>
                  <td>R² {es(result.fit.r2, 2)}</td>
                </tr>
                <tr>
                  <td>Duplicación exacta</td>
                  <td>{Number.isFinite(result.doublingExact) ? `${es(result.doublingExact)} años` : 'no se duplica'}</td>
                  <td>t = ln 2 / ln(1 + r)</td>
                </tr>
                <tr>
                  <td>Regla del 70</td>
                  <td>{result.rule70 === null ? '—' : `${es(result.rule70)} años`}</td>
                  <td>70 / tasa</td>
                </tr>
                <tr>
                  <td>Regla del 72</td>
                  <td>{result.rule72 === null ? '—' : `${es(result.rule72)} años`}</td>
                  <td>72 / tasa</td>
                </tr>
                <tr>
                  <td>Veces que se duplicó</td>
                  <td>{es(result.doublings, 2)}</td>
                  <td>log₂ del cociente entre el final y el inicio</td>
                </tr>
                <tr>
                  <td>Mayor desvío de la tasa constante</td>
                  <td>{es(result.maxDeviationPct)} %</td>
                  <td>del real respecto de la línea punteada</td>
                </tr>
              </tbody>
            </table>
          </Reveal>
        )}
      </div>
    </div>
  );
}
