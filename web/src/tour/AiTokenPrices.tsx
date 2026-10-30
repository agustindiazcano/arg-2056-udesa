import React from 'react';
import { API_PRICES } from './aiEvidence.js';
import { RefList } from '../ui/RefLink.js';

export function AiTokenPrices() {
  return <div className="ai-token-prices">
    <p>API: USD por millón de tokens, antes de impuestos · consulta 30-10-2026.</p>
    <table className="ai-access-table" aria-label="Precios de API por millón de tokens"><thead><tr><th>Modelo</th><th>Entrada</th><th>Salida</th><th>Lectura de caché</th></tr></thead><tbody>{API_PRICES.map((p) => <tr key={p.id}><th scope="row">{p.model}<small>{p.scope}</small><RefList ids={[p.ref]} /></th><td>{p.input}</td><td>{p.output}</td><td>{p.cached ?? 'No incluida'}</td></tr>)}</tbody></table>
    <p className="ai-evidence-caption">Son modelos concretos, con capacidades y tokenizadores distintos. Precio = entrada × tarifa de entrada + salida × tarifa de salida + caché × tarifa de lectura. Herramientas, escritura y almacenamiento de caché se cobran aparte.</p>
    <p className="ai-evidence-caption">Cursor es un producto que integra modelos: el costo depende del modelo, el plan y la ruta. En Teams/Enterprise, la documentación agrega 0,25 USD por millón de tokens a modelos elegibles; no a todos los planes. <RefList ids={['AI34']} /></p>
    <p className="ai-evidence-caption">Una suscripción mensual no compra una cantidad fija de tokens API. No se convierte el abono de 20 USD en tokens.</p>
  </div>;
}
