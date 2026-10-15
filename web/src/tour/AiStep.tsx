import React, { useMemo } from 'react';
import { EChart } from '../charts/EChart.js';
import { buildLines } from '../charts/builders/tourCharts.js';
import { formatValue } from '../charts/format.js';
import { linesSpec } from '../charts3d/specs.js';
import { Reveal } from '../motion/Reveal.js';
import { useStore } from '../state/store.js';
import { Segmented } from '../ui/Segmented.js';
import { AI_SCENARIOS } from './aiScenarios.js';
import { perCapitaSeries, populationPath, summaries } from './aiModel.js';
import { GDP_UNIT } from './gdpFacts.js';
import { TourChart } from './TourChart.js';
import { AI_TITLE } from './slideTitles.js';
import { aiImpactData } from './tourData.js';

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const pct = (v: number, digits = 1): string => `${v >= 0 ? '+' : ''}${v.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
const num = (v: number, digits = 1): string => v.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function Lines({ title, unit, years, series }: { title: string; unit: string; years: number[]; series: Array<{ name: string; values: Array<number | null>; color: string }> }) {
  const built = useMemo(() => {
    const labels = years.map(String);
    const summary = `${title}: ${series.map((s) => `${s.name} ${formatValue(s.values.at(-1) ?? null, unit)} en ${years.at(-1)}`).join(', ')}`;
    const { option } = buildLines(labels, series, { unit, labelEvery: 1, summary });
    const spec = linesSpec({ title, unit, xLabels: labels, series: series.map((s) => ({ ...s, tone: 'muted' as const })), summary });
    return { option, summary, spec };
  }, [title, unit, years, series]);
  return (
    <div className="tour-chart">
      <TourChart spec={built.spec}>
        <EChart option={built.option} aria-label={built.summary} />
      </TourChart>
    </div>
  );
}

/**
 * Step 3 of the Recorrido, "Cuarta revolución industrial": three scenarios of the real GDP of Argentina to 2035, the GDP per person under each
 * (over the UN population path), and the numbers side by side (growth, change per person, population, years to double). It has no buttons to the
 * charts of other slides.
 */
export function AiStep() {
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);
  const gdp = useMemo(() => aiImpactData(), []);
  const perCapita = useMemo(() => perCapitaSeries(), []);
  const rows = useMemo(() => summaries(), []);
  const pop = useMemo(() => populationPath(), []);
  const popChange = (pop.values.at(-1)! / pop.values[0]! - 1) * 100;
  return (
    <section className="gdp-step ai-step" aria-label={AI_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <h2>{AI_TITLE}</h2>
          <p className="gdp-sub">Tres escenarios de Argentina hasta 2035, con la IA como impulso a la productividad</p>
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
      <div className="ai-legend" role="list" aria-label="Escenarios">
        {AI_SCENARIOS.map((s) => (
          <span key={s.id} role="listitem" className="ai-key">
            <span className="tour-swatch" style={{ background: s.color }} aria-hidden="true" /> {s.name}
          </span>
        ))}
      </div>
      <div className="ai-grid">
        <Reveal k="gdp" className="gdp-chart">
          <strong className="composition-title">{`PBI real (${GDP_UNIT})`}</strong>
          <Lines title="PBI real de Argentina por escenario" unit={gdp.unit} years={gdp.years} series={gdp.series.map((s) => ({ name: s.name, values: s.values, color: s.color }))} />
        </Reveal>
        <Reveal k="percapita" delay={0.07} className="gdp-chart">
          <strong className="composition-title">PBI por habitante (miles de USD de 2015)</strong>
          <Lines title="PBI por habitante por escenario" unit={perCapita.unit} years={perCapita.years} series={perCapita.series} />
        </Reveal>
        <Reveal k="numbers" delay={0.14} className="gdp-chart ai-numbers">
          <table aria-label="Indicadores por escenario, 2026 a 2035">
            <thead>
              <tr>
                <th scope="col">2026 a 2035</th>
                {rows.map((r) => (
                  <th key={r.id} scope="col">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Crecimiento anual medio del PBI</th>
                {rows.map((r) => (
                  <td key={r.id}>{pct(r.averageGrowth, 2)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Cambio del PBI</th>
                {rows.map((r) => (
                  <td key={r.id}>{pct(r.gdpChange)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">PBI en 2035 (miles de millones)</th>
                {rows.map((r) => (
                  <td key={r.id}>{num(r.gdp2035)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">PBI por habitante en 2035 (miles de USD)</th>
                {rows.map((r) => (
                  <td key={r.id}>{num(r.perCapita2035, 2)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Cambio del PBI por habitante</th>
                {rows.map((r) => (
                  <td key={r.id}>{pct(r.perCapitaChange)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Años para duplicar el PBI a ese ritmo</th>
                {rows.map((r) => (
                  <td key={r.id}>{num(r.doublingYears)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Aporte de la IA a la productividad (puntos por año)</th>
                {AI_SCENARIOS.map((s) => (
                  <td key={s.id}>{`${num(s.aiPoints[0])} a ${num(s.aiPoints[1])}`}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="ai-note">
            {`Población: de ${num(pop.values[0]!)} millones en 2025 a ${num(pop.values.at(-1)!)} en 2035 (${pct(popChange)}), igual en los tres escenarios (ONU, variante media, sobre la cifra del INDEC).`}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
