import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { buildAccessStack } from '../charts/builders/accessCost.js';
import { formatNumber } from '../charts/format.js';
import { Reveal } from '../motion/Reveal.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { Segmented } from '../ui/Segmented.js';
import { ACCESS_COUNTRIES, PLANS, accessRows, taxPct } from './aiAccess.js';
import { AI_ACCESS_TITLE } from './slideTitles.js';

const REFS = ['A20', 'A21', 'A22'] as const;
const usd = (v: number, digits = 1): string => `${formatNumber(v, digits)} USD`;

/**
 * Slide 9: can Argentina miss the AI wave? The same plan costs more in Argentina because the card payment carries the digital VAT and the advance
 * of 30 %. A stacked bar per country (list price plus taxes) for the plan the visitor picks, and a table with the extra cost per month and per year.
 */
export function AiAccessStep() {
  const [planId, setPlanId] = useState(PLANS[0]!.id);
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]!;
  const rows = useMemo(() => accessRows(plan.price), [plan]);
  const arg = rows.find((r) => r.country === 'Argentina')!;
  const argCountry = ACCESS_COUNTRIES.find((c) => c.name === 'Argentina')!;

  const summary = `Costo mensual del ${plan.label.toLowerCase()} con impuestos: ${rows.map((r) => `${r.country} ${usd(r.total)}`).join(', ')}`;
  const chart = useMemo(() => buildAccessStack(rows, { summary }), [rows, summary]);

  return (
    <section className="gdp-step prov-step" aria-label={AI_ACCESS_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <div className="slide-title-row">
            <h2>{AI_ACCESS_TITLE}</h2>
            <ChartHelp
              title={AI_ACCESS_TITLE}
              lead="Dólares por mes, precio de lista más impuestos, pagando con tarjeta"
              paragraphs={[
                'Los planes de los asistentes de IA cuestan lo mismo en dólares en casi todo el mundo: unos 20 USD el plan básico y 100 o 200 USD los planes de más uso.',
                `En Argentina el pago con tarjeta suma el IVA de servicios digitales del exterior (21 %) y una percepción a cuenta de Ganancias o Bienes Personales (30 %): ${taxPct(argCountry)} % sobre el precio de lista, sin contar Ingresos Brutos provinciales ni comisiones del banco.`,
                'En los otros países el recargo es el IVA general (el 10 % de Japón y Australia, el 22 % de Uruguay); en Estados Unidos no hay impuesto nacional y el impuesto estatal a las ventas varía.'
              ]}
              how="Elegí un plan arriba. La barra azul es el precio de lista y la roja, lo que se agrega en impuestos. La tabla muestra cuánto paga de más una persona en un año."
              refs={[...REFS]}
            />
          </div>
          <p className="gdp-sub">
            Lo mismo cuesta más en Argentina · <RefList ids={REFS} />
          </p>
        </Reveal>
        <div className="tour-controls">
          <Segmented label="Plan" options={PLANS.map((p) => ({ value: p.id, label: p.label }))} value={planId} onChange={setPlanId} />
        </div>
      </header>

      <div className="prov-grid">
        <Reveal k="chart" className="gdp-chart rule70-card">
          <div className="rule70-card-head">
            <strong>{plan.label}: costo mensual con impuestos</strong>
            <div className="rule70-legend">
              <span className="ai-legend-item">
                <span className="rule70-key" style={{ background: 'var(--blue)' }} aria-hidden="true" /> Precio de lista
              </span>
              <span className="ai-legend-item">
                <span className="rule70-key" style={{ background: 'var(--scenario-pessimistic, #d03b3b)' }} aria-hidden="true" /> Impuestos
              </span>
            </div>
          </div>
          <div className="rule70-chart ai-main-chart">
            <EChart option={chart.option} aria-label={summary} />
          </div>
        </Reveal>

        <div className="prov-side">
          <Reveal k="table" delay={0.07} className="gdp-chart rule70-card" role="region" aria-label="Costo por país">
            <div className="rule70-card-head">
              <strong>Cuánto se paga de más</strong>
            </div>
            <table className="ai-access-table" aria-label={`Costo del ${plan.label.toLowerCase()} por país`}>
              <thead>
                <tr>
                  <th scope="col">País</th>
                  <th scope="col">Impuestos</th>
                  <th scope="col">Total por mes</th>
                  <th scope="col">De más por año</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.country}>
                    <th scope="row">
                      <img src={r.flag} alt="" width={20} height={15} />
                      {r.country}
                    </th>
                    <td>{usd(r.taxes)}</td>
                    <td>{usd(r.total)}</td>
                    <td>{usd(r.yearlyExtra, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>

          <Reveal k="notes" delay={0.14} className="gdp-chart rule70-card" role="region" aria-label="Qué significa">
            <div className="rule70-card-head">
              <strong>Qué significa para Argentina</strong>
            </div>
            <ul className="ai-access-notes">
              <li>
                El {plan.label.toLowerCase()} sale {usd(arg.total)} por mes: {usd(arg.taxes)} más que el precio de lista, {usd(arg.yearlyExtra, 0)} por año.
              </li>
              <li>Quien paga en Argentina abona {taxPct(argCountry)} % más que quien paga en Estados Unidos por exactamente el mismo plan.</li>
              <li>Con el 30 % a cuenta de Ganancias o Bienes Personales, parte puede recuperarse en la declaración anual; el IVA no.</li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
