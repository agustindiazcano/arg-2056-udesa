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
import { AiAccessMap } from './AiAccessMap.js';
import { AiTokenPrices } from './AiTokenPrices.js';
import './aiEvidence.css';

const REFS = ['AI30', 'AI48', 'AI49'] as const;
const usd = (v: number, digits = 1): string => `${formatNumber(v, digits)} USD`;

/**
 * Slide 9: can Argentina miss the AI wave? The same plan costs more in Argentina because the card payment carries the digital VAT and the advance
 * of 30 %. A stacked bar per country (list price plus taxes) for the plan the visitor picks, and a table with the extra cost per month and per year.
 */
export function AiAccessStep() {
  const [view, setView] = useState<'bars' | 'map' | 'api'>('map');
  const [planId, setPlanId] = useState(PLANS[0]!.id);
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]!;
  const rows = useMemo(() => accessRows(plan.price), [plan]);
  const arg = rows.find((r) => r.country === 'Argentina')!;
  const argCountry = ACCESS_COUNTRIES.find((c) => c.name === 'Argentina')!;

  const summary = `Costo mensual del ${plan.label.toLowerCase()} con impuestos: ${rows.map((r) => `${r.country} ${usd(r.total)}`).join(', ')}`;
  const chart = useMemo(() => buildAccessStack(rows, { summary }), [rows, summary]);

  return (
    <section className="gdp-step prov-step ai-access-step" aria-label={AI_ACCESS_TITLE}>
      <header className="gdp-head">
        <Reveal k="head" className="gdp-title">
          <div className="slide-title-row">
            <h2>{AI_ACCESS_TITLE}</h2>
            <ChartHelp
              title={AI_ACCESS_TITLE}
              lead="Dólares por mes, precio de lista más impuestos, pagando con tarjeta"
              paragraphs={[
                'Tomamos 20 USD mensuales como referencia de entrada, el precio mensual de Claude Pro. También se comparan 100 USD (Claude Max) y 200 USD (Claude Ultra), según la lista consultada el 30 de octubre de 2026. No todos los productos ofrecen los mismos planes.',
                `En el supuesto argentino de un servicio digital del exterior alcanzado por IVA (21 %) y cancelación de tarjeta en pesos alcanzada por percepción (30 %), el desembolso suma ${taxPct(argCountry)} % sobre el precio de lista. El tratamiento puede variar con la forma de pago. Se excluyen Ingresos Brutos y comisiones.`,
                'En los otros países el recargo es el IVA general (el 10 % de Japón y Australia, el 22 % de Uruguay); en Estados Unidos no hay impuesto nacional y el impuesto estatal a las ventas varía.'
              ]}
              how="Elegí plan y vista: mapa de LATAM, barras por país o precios de API por millón de tokens. El semáforo mide el recargo del supuesto tributario, no calidad ni poder adquisitivo."
              refs={[...REFS]}
            />
          </div>
          <p className="gdp-sub">
            ¿Cuánto más cuesta en Argentina acceder a modelos de IA? · Referencia: planes de 20 USD/mes · <RefList ids={REFS} />
          </p>
        </Reveal>
        <div className="tour-controls">
          <Segmented label="Plan" options={PLANS.map((p) => ({ value: p.id, label: p.label }))} value={planId} onChange={setPlanId} />
          <Segmented label="Comparación" options={[{ value: 'map', label: 'Mapa LATAM' }, { value: 'bars', label: 'Barras' }, { value: 'api', label: 'Costo por token' }]} value={view} onChange={setView} />
        </div>
      </header>

      <div className="prov-grid">
        <Reveal k="chart" className="gdp-chart rule70-card">
          <div className="rule70-card-head">
            <strong>{view === 'api' ? 'Costo por token: suscripción y API son distintos' : `${plan.label}: costo mensual con impuestos`}</strong>
            {view === 'bars' && <div className="rule70-legend">
              <span className="ai-legend-item">
                <span className="rule70-key" style={{ background: 'var(--blue)' }} aria-hidden="true" /> Precio de lista
              </span>
              <span className="ai-legend-item">
                <span className="rule70-key" style={{ background: 'var(--scenario-pessimistic)' }} aria-hidden="true" /> Impuestos
              </span>
            </div>}
          </div>
          <div className="rule70-chart ai-main-chart ai-access-main">
            {view === 'bars' ? <EChart option={chart.option} aria-label={summary} /> : view === 'map' ? <AiAccessMap price={plan.price} /> : <AiTokenPrices />}
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
              <li>Referencia de precios: Pro 20 USD, Max 100 USD y Ultra 200 USD de Claude. Son abonos con límites, no bolsas fijas de tokens API.</li>
              <li>En este supuesto de tarjeta en pesos, el recargo argentino es {taxPct(argCountry)} %. Pagar con dólares propios puede cambiar la percepción. El impuesto estatal de EE. UU. queda fuera de la comparación.</li>
              <li>Con el 30 % a cuenta de Ganancias o Bienes Personales, parte puede recuperarse en la declaración anual; el IVA no.</li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
