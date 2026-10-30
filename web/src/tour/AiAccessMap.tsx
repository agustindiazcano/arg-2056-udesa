import React, { useState } from 'react';
import geometry from './latamGeometry.json';
import { ACCESS_COUNTRIES, effectiveCost, taxPct } from './aiAccess.js';
import { accessBand } from './aiEvidence.js';
import { RefList } from '../ui/RefLink.js';

const names: Record<string, string> = {
  ARG: 'Argentina',
  FLK: 'Argentina',
  URY: 'Uruguay',
  CHL: 'Chile',
  COL: 'Colombia',
  PER: 'Perú',
  DOM: 'República Dominicana',
  MEX: 'México',
  VEN: 'Venezuela',
  ECU: 'Ecuador',
  HND: 'Honduras',
  NIC: 'Nicaragua',
  CRI: 'Costa Rica',
  SLV: 'El Salvador',
  BOL: 'Bolivia',
  GTM: 'Guatemala',
  PRY: 'Paraguay',
  PAN: 'Panamá',
  BRA: 'Brasil'
};

export function AiAccessMap({ price }: { price: number }) {
  const [active, setActive] = useState<string | null>('ARG');
  const country = ACCESS_COUNTRIES.find((c) => c.name === names[active ?? '']);
  return (
    <div className="ai-latam">
      <svg viewBox="0 0 360 370" role="group" aria-label="Mapa de América Latina: recargo sobre el precio de lista de IA. Brasil 3,5 %, Panamá 7 %, Paraguay 10 %, Guatemala 12 %, Costa Rica, El Salvador y Bolivia 13 %, Ecuador, Honduras y Nicaragua 15 %, México y Venezuela 16 %, Perú y República Dominicana 18 %, Chile y Colombia 19 %, Uruguay 22 %, Argentina 51 % en el supuesto de tarjeta en pesos.">
        {geometry.map((region) => {
          const c = ACCESS_COUNTRIES.find((item) => item.name === names[region.id]);
          const pct = c ? taxPct(c) : null;
          return <path key={region.id} d={region.path} fillRule="evenodd" className={`ai-country ai-country--${accessBand(pct)}`} tabIndex={0} role="button" aria-label={`${region.name}: ${pct === null ? 'sin dato comparable' : `${pct} % de recargo`}`} aria-pressed={active === region.id} onMouseEnter={() => setActive(region.id)} onFocus={() => setActive(region.id)} onClick={() => setActive(region.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(region.id); } }}><title>{region.name}</title></path>;
        })}
      </svg>
      <div className="ai-map-detail" aria-live="polite">
        <strong>{country?.name ?? geometry.find((r) => r.id === active)?.name ?? 'América Latina'}</strong>
        <span>{country ? `${effectiveCost(price, country).toLocaleString('es-AR', { maximumFractionDigits: 2 })} USD/mes · +${taxPct(country).toLocaleString('es-AR')} %` : 'Sin dato comparable en esta selección'}</span>
      </div>
      <p className="ai-evidence-caption">Recargo: <span className="ai-signal-low">menos de 20 %</span> · <span className="ai-signal-middle">20 a 25 %</span> · <span className="ai-signal-high">más de 25 %</span> · gris: sin dato.</p>
      <p className="ai-evidence-caption">Supuesto tributario común en LATAM (IVA digital / IOF); no son cotizaciones de checkout. <RefList ids={['AI48', 'AI49', 'AI50', 'AI51', 'AI52', 'AI53', 'AI63', 'AI64', 'AI65']} /></p>
    </div>
  );
}
