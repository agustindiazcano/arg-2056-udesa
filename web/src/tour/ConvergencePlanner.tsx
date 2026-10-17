import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { formatNumber } from '../charts/format.js';
import { Reveal } from '../motion/Reveal.js';
import { tokens } from '../styles/tokens.js';
import {
  ARG_PER_CAPITA_2026,
  CONVERGENCE_START_YEAR,
  CONVERGENCE_TARGET_YEAR,
  developedBenchmarks
} from './rule70Convergence.js';
import { GDP_UNIT } from './gdpFacts.js';

const es = (v: number, digits = 1): string => formatNumber(v, digits);

export function ConvergencePlanner() {
  const benchmarks = useMemo(() => developedBenchmarks(), []);
  const [selectedCode, setSelectedCode] = useState<string>('ESP'); // default Spain
  const [horizonYears, setHorizonYears] = useState<20 | 30>(30);

  const selected = useMemo(
    () => benchmarks.find((b) => b.code === selectedCode) ?? benchmarks[0]!,
    [benchmarks, selectedCode]
  );

  const targetYear = CONVERGENCE_START_YEAR + horizonYears;
  const requiredRate = horizonYears === 30 ? selected.requiredRate30Years : selected.requiredRate20Years;

  // Chart: trajectory of Argentina's GDP per capita reaching target vs benchmark level
  const chart = useMemo(() => {
    const years: number[] = [];
    const argTrajectory: number[] = [];
    const targetLine: number[] = [];

    for (let y = CONVERGENCE_START_YEAR; y <= CONVERGENCE_TARGET_YEAR; y += 1) {
      years.push(y);
      targetLine.push(selected.gdpPerCapita2024);
      const t = y - CONVERGENCE_START_YEAR;
      if (t <= horizonYears) {
        argTrajectory.push(Math.round(ARG_PER_CAPITA_2026 * Math.pow(1 + requiredRate / 100, t)));
      } else {
        // after reaching horizon, keep target level
        argTrajectory.push(selected.gdpPerCapita2024);
      }
    }

    const option = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) => (value !== null && value !== undefined ? `$${es(Number(value), 0)} USD` : '—')
      },
      legend: {
        data: ['Trayectoria necesaria (Argentina)', `${selected.name} (PBI pc 2024)`],
        textStyle: { color: tokens.muted }
      },
      grid: { left: 60, right: 20, top: 40, bottom: 35 },
      xAxis: {
        type: 'category',
        data: years.map(String),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: tokens.muted, interval: 4 }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: tokens.muted,
          formatter: (v: number) => `$${es(v / 1000, 0)}k`
        },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [
        {
          name: 'Trayectoria necesaria (Argentina)',
          type: 'line',
          data: argTrajectory,
          color: tokens.blue,
          lineStyle: { width: 3 },
          symbol: 'none'
        },
        {
          name: `${selected.name} (PBI pc 2024)`,
          type: 'line',
          data: targetLine,
          color: tokens.scenario.pessimistic,
          lineStyle: { width: 2, type: 'dashed' },
          symbol: 'none'
        }
      ]
    };

    const summary = `Convergencia hacia ${selected.name}: Argentina necesita crecer al ${es(requiredRate, 2)}% anual per cápita para alcanzar $${es(selected.gdpPerCapita2024, 0)} USD en ${targetYear}.`;

    return { option, summary };
  }, [selected, horizonYears, requiredRate, targetYear]);

  return (
    <div className="rule70-grid">
      <div className="rule70-col">
        <Reveal k={`convergence-chart-${selectedCode}-${horizonYears}`} className="gdp-chart rule70-card">
          <div className="rule70-card-head">
            <strong>Planificación de convergencia hacia {selected.name}</strong>
            <div className="rule70-switches" role="group" aria-label="Plazo de convergencia">
              <button
                type="button"
                className="btn btn--sm"
                aria-pressed={horizonYears === 20}
                onClick={() => setHorizonYears(20)}
              >
                20 años (2046)
              </button>
              <button
                type="button"
                className="btn btn--sm"
                aria-pressed={horizonYears === 30}
                onClick={() => setHorizonYears(30)}
              >
                30 años (2056)
              </button>
            </div>
          </div>
          <div className="rule70-chart">
            <EChart option={chart.option} aria-label={chart.summary} />
          </div>
          <p className="rule70-note">
            Precios constantes en dólares de 2015 (Banco Mundial). Base Argentina 2026: <strong>${es(ARG_PER_CAPITA_2026, 0)} USD</strong> por habitante.
          </p>
        </Reveal>
      </div>

      <div className="rule70-col rule70-col--stack">
        <Reveal k="convergence-targets" delay={0.05} className="gdp-chart rule70-card">
          <strong>Seleccionar país de referencia desarrollado</strong>
          <div className="rule70-presets" role="group" aria-label="Países desarrollados de referencia">
            {benchmarks.map((b) => (
              <button
                key={b.code}
                type="button"
                className={`chip ${b.code === selectedCode ? 'chip--active' : ''}`}
                aria-pressed={b.code === selectedCode}
                onClick={() => setSelectedCode(b.code)}
              >
                {b.name}
              </button>
            ))}
          </div>

          <div className="rule70-case-meta">
            <h3 className="rule70-case">{selected.name}</h3>
            <p className="draft-muted">{selected.description}</p>
          </div>

          <table className="rule70-table" aria-label="Métricas de convergencia con el país seleccionado">
            <tbody>
              <tr>
                <td>PBI per cápita actual ({selected.name})</td>
                <td><strong>${es(selected.gdpPerCapita2024, 0)} USD</strong></td>
              </tr>
              <tr>
                <td>Brecha actual frente a Argentina</td>
                <td><strong>{es(selected.ratioOverArg, 2)}×</strong> el PBI pc de Argentina</td>
              </tr>
              <tr>
                <td>Tasa per cápita anual requerida ({horizonYears} años)</td>
                <td><strong style={{ color: tokens.blue }}>+{es(requiredRate, 2)} % por año</strong></td>
              </tr>
              <tr>
                <td>Tasa total de PBI anual requerida (a 2056)</td>
                <td><strong>+{es(selected.requiredTotalGdpGrowth2056, 2)} % por año</strong></td>
              </tr>
              <tr>
                <td>PBI total necesario en 2056</td>
                <td><strong>${es(selected.impliedTotalGdp2056, 0)}</strong> {GDP_UNIT}</td>
              </tr>
            </tbody>
          </table>

          <div className="rule70-note">
            <strong>¿Qué significa esta tasa?</strong>
            <p>
              Por la regla del 70, crecer al <strong>{es(requiredRate, 1)} %</strong> anual implica duplicar el ingreso por persona cada <strong>{es(70 / requiredRate, 1)} años</strong>. Para alcanzar el nivel de vida de {selected.name} en {horizonYears} años ({targetYear}), el ingreso medio argentino debe multiplicarse por <strong>{es(selected.ratioOverArg, 2)}</strong>.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
