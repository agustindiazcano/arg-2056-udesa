import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { formatNumber } from '../charts/format.js';
import { Reveal } from '../motion/Reveal.js';
import { imfChart } from './rule70Charts.js';
import { IMF_FIRST_YEAR, IMF_LAST_YEAR, IMF_VINTAGE_NOTE, averageGrowth, imfCountries, imfImplied } from './rule70Imf.js';

const es = (v: number, digits = 1): string => formatNumber(v, digits);
const YEARS = Array.from({ length: IMF_LAST_YEAR - IMF_FIRST_YEAR + 1 }, (_, i) => IMF_FIRST_YEAR + i);

/**
 * The fourth tab of the rule-of-70 slide: the real GDP growth that the IMF projects for a country, 2026 to 2031, the constant rate that
 * gives the same level in 2031 and how long a level takes to double at it. The projection is the IMF's, not ours.
 */
export function ImfProjections() {
  const countries = useMemo(() => imfCountries(), []);
  const [code, setCode] = useState('AR');
  const country = countries.find((c) => c.code === code)!;
  const implied = useMemo(() => imfImplied(code), [code]);
  const chart = useMemo(() => imfChart(country.name, YEARS, YEARS.map((y) => country.growth[String(y)]!)), [country]);

  return (
    <div className="rule70-grid">
      <div className="rule70-col">
        <Reveal k={`chart-${code}`} className="gdp-chart rule70-card">
          <strong>Crecimiento real que proyecta el FMI, {IMF_FIRST_YEAR} a {IMF_LAST_YEAR}</strong>
          <div className="rule70-chart">
            <EChart option={chart.option} aria-label={chart.summary} />
          </div>
          <p className="rule70-note">{IMF_VINTAGE_NOTE}</p>
        </Reveal>
      </div>

      <div className="rule70-col rule70-col--stack">
        <Reveal k="country" delay={0.05} className="gdp-chart rule70-card">
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
          <h3 className="rule70-case">{country.name}</h3>
          <table className="rule70-table" aria-label="Crecimiento proyectado por año">
            <thead>
              <tr>
                <th scope="col">Año</th>
                <th scope="col">Crecimiento real (% anual)</th>
              </tr>
            </thead>
            <tbody>
              {YEARS.map((y) => (
                <tr key={y}>
                  <td>{y}</td>
                  <td>{es(country.growth[String(y)]!, 2)}</td>
                </tr>
              ))}
              <tr>
                <td>Promedio geométrico</td>
                <td>{es(averageGrowth(code), 2)}</td>
              </tr>
            </tbody>
          </table>
          <p>
            A ese ritmo constante, el PBI real se duplicaría en <strong>{es(implied.years)} años</strong>
            {implied.year === null ? '' : <>: el nivel del doble se alcanzaría en {implied.year}</>}.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
