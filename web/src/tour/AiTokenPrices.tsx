import React, { useState } from 'react';
import geometry from './latamGeometry.json';
import { ACCESS_COUNTRIES, effectiveCost, taxPct } from './aiAccess.js';
import { LATAM_COUNTRY_NAMES } from './AiAccessMap.js';
import { API_PRICES, accessBand } from './aiEvidence.js';
import { RefList } from '../ui/RefLink.js';
import { Segmented } from '../ui/Segmented.js';

const fmtUsd = (n: number, digits = 2) =>
  `${n.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} USD`;

export function AiTokenPrices() {
  const [modelId, setModelId] = useState<string>(API_PRICES[0]!.id);
  const [activeIso, setActiveIso] = useState<string>('ARG');
  const model = API_PRICES.find((m) => m.id === modelId) ?? API_PRICES[0]!;
  const argCountry = ACCESS_COUNTRIES.find((c) => c.name === 'Argentina')!;
  const argPct = taxPct(argCountry);
  const selectedCountry =
    ACCESS_COUNTRIES.find((c) => c.name === LATAM_COUNTRY_NAMES[activeIso]) ?? argCountry;
  const selectedPct = taxPct(selectedCountry);
  const argVsCountryPct = ((1 + argPct / 100) / (1 + selectedPct / 100) - 1) * 100;

  return (
    <div className="ai-token-prices">
      <div className="ai-scope-banner">
        <div>
          <strong>Sobrecosto por cada token en Argentina: +{argPct} % (tarjeta) · +48,5 % (giro B2B)</strong>
          <span>
            {' '}
            Frente a EE. UU. (0 %): cada millón de tokens de {model.model} sube de {fmtUsd(model.input)} a{' '}
            <strong>{fmtUsd(effectiveCost(model.input, argCountry))}</strong> en entrada y de {fmtUsd(model.output)} a{' '}
            <strong>{fmtUsd(effectiveCost(model.output, argCountry))}</strong> en salida (+26,9 % más caro que en Chile y +28,0 % más caro que en Perú).
          </span>
        </div>
        <Segmented
          label="Modelo API"
          options={API_PRICES.map((p) => ({ value: p.id, label: p.model }))}
          value={model.id}
          onChange={setModelId}
        />
      </div>

      <div className="ai-token-grid">
        <div className="ai-latam ai-token-map-box">
          <svg
            viewBox="0 0 360 370"
            role="group"
            aria-label={`Mapa semáforo de América Latina: sobrecosto porcentual y precio por millón de tokens de ${model.model} en cada país. Argentina +51 % (${fmtUsd(effectiveCost(model.output, argCountry))} salida), Uruguay +22 %, Chile y Colombia +19 %, Perú +18 %, México +16 %, Brasil +3,5 %.`}
          >
            {geometry.map((region) => {
              const c = ACCESS_COUNTRIES.find((item) => item.name === LATAM_COUNTRY_NAMES[region.id]);
              const pct = c ? taxPct(c) : null;
              const outCost = c ? fmtUsd(effectiveCost(model.output, c)) : null;
              return (
                <path
                  key={region.id}
                  d={region.path}
                  fillRule="evenodd"
                  className={`ai-country ai-country--${accessBand(pct)}`}
                  tabIndex={0}
                  role="button"
                  aria-label={
                    c && pct !== null
                      ? `${region.name}: +${pct.toLocaleString('es-AR')} % por token · Salida ${outCost}/1M tokens`
                      : `${region.name}: sin dato comparable`
                  }
                  aria-pressed={activeIso === region.id}
                  onMouseEnter={() => setActiveIso(region.id)}
                  onFocus={() => setActiveIso(region.id)}
                  onClick={() => setActiveIso(region.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveIso(region.id);
                    }
                  }}
                >
                  <title>{region.name}</title>
                </path>
              );
            })}
          </svg>
          <div className="ai-map-detail" aria-live="polite">
            <strong>
              {selectedCountry.name} · +{selectedPct.toLocaleString('es-AR')} % por token
            </strong>
            <span>
              {model.model}: Entrada <strong>{fmtUsd(effectiveCost(model.input, selectedCountry))}</strong> · Salida{' '}
              <strong>{fmtUsd(effectiveCost(model.output, selectedCountry))}</strong> / 1M tokens
              {selectedCountry.name !== 'Argentina'
                ? ` (Argentina paga +${argVsCountryPct.toLocaleString('es-AR', { maximumFractionDigits: 1 })} % más por token)`
                : ' (máximo recargo regional)'}
            </span>
          </div>
          <p className="ai-evidence-caption">
            Semáforo de sobrecosto por token: <span className="ai-signal-low">menos de 20 %</span> ·{' '}
            <span className="ai-signal-middle">20 a 25 %</span> · <span className="ai-signal-high">más de 25 % (Argentina +51 %)</span> · gris: sin dato.
          </p>
        </div>

        <div className="ai-token-tables">
          <p className="ai-evidence-caption">
            API: USD por millón de tokens (lista vs. costo en Argentina con +51 % de impuestos en tarjeta) · consulta 30-10-2026.
          </p>
          <table className="ai-access-table" aria-label="Precios de API por millón de tokens">
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Entrada (lista)</th>
                <th>Salida (lista)</th>
                <th>Lectura de caché</th>
                <th>Salida en AR (+51 %)</th>
              </tr>
            </thead>
            <tbody>
              {API_PRICES.map((p) => (
                <tr key={p.id}>
                  <th scope="row">
                    {p.model}
                    <small>{p.scope}</small>
                    <RefList ids={[p.ref]} />
                  </th>
                  <td>{p.input}</td>
                  <td>{p.output}</td>
                  <td>{p.cached ?? 'No incluida'}</td>
                  <td>
                    <strong>{effectiveCost(p.output, argCountry).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> (+51 %)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ai-evidence-caption">
            Son modelos concretos, con capacidades y tokenizadores distintos. Precio = entrada × tarifa de entrada + salida × tarifa de salida + caché × tarifa de lectura. Herramientas, escritura y almacenamiento de caché se cobran aparte.
          </p>
          <p className="ai-evidence-caption">
            Cursor integra modelos: en Teams/Enterprise agrega 0,25 USD por millón de tokens a modelos elegibles. <RefList ids={['AI34']} /> Una suscripción mensual no compra una cantidad fija de tokens API. No se convierte el abono de 20 USD en tokens.
          </p>
        </div>
      </div>
    </div>
  );
}
