import { flagSrc } from './worldCompare.js';

export interface AccessTax {
  label: string;
  /** percentage of the list price, added to it */
  pct: number;
}

export interface AccessCountry {
  name: string;
  taxes: readonly AccessTax[];
}

export interface Plan {
  id: string;
  label: string;
  /** list price in US dollars per month */
  price: number;
}

/** Reference monthly tiers, not interchangeable products: Claude Pro 20 USD, Max 100 USD, Ultra 200 USD. Official list consulted 2026-10-30 (AI30). */
export const PLANS: readonly Plan[] = [
  { id: 'p20', label: 'Plan de 20 USD', price: 20 },
  { id: 'p100', label: 'Plan de 100 USD', price: 100 },
  { id: 'p200', label: 'Plan de 200 USD', price: 200 }
];

const ARG_TAXES: readonly AccessTax[] = [
  { label: 'IVA de servicios digitales del exterior (RG 4240)', pct: 21 },
  { label: 'Percepción a cuenta de Ganancias o Bienes Personales (RG 5617)', pct: 30 }
];

const vat = (pct: number, label = 'IVA de servicios digitales'): readonly AccessTax[] => [{ label, pct }];

const EXTRA_FLAGS: Readonly<Record<string, string>> = {
  Colombia: '/flags/co.svg',
  Perú: '/flags/pe.svg'
};

export function accessFlag(country: string): string {
  const fromCompare = flagSrc(country);
  if (!fromCompare.includes('undefined')) return fromCompare;
  return EXTRA_FLAGS[country] ?? '';
}

/** Taxes a card payment of a foreign digital service carries, over the list price across Latin America and reference economies (OECD/CIAT/IDB VAT Digital Toolkit & national authorities). */
export const ACCESS_COUNTRIES: readonly AccessCountry[] = [
  { name: 'Argentina', taxes: ARG_TAXES },
  { name: 'Uruguay', taxes: vat(22, 'IVA tasa básica (DGI)') },
  { name: 'España', taxes: vat(21, 'IVA general') },
  { name: 'Chile', taxes: vat(19, 'IVA de servicios digitales (SII)') },
  { name: 'Colombia', taxes: vat(19, 'IVA de servicios digitales (DIAN)') },
  { name: 'Alemania', taxes: vat(19, 'IVA general') },
  { name: 'Perú', taxes: vat(18, 'IGV de servicios digitales (SUNAT D.L. 1623)') },
  { name: 'República Dominicana', taxes: vat(18, 'ITBIS general (DGII)') },
  { name: 'México', taxes: vat(16, 'IVA de servicios digitales (SAT)') },
  { name: 'Venezuela', taxes: vat(16, 'IVA alícuota general (SENIAT)') },
  { name: 'Ecuador', taxes: vat(15, 'IVA de servicios digitales (SRI)') },
  { name: 'Honduras', taxes: vat(15, 'ISV general (SAR)') },
  { name: 'Nicaragua', taxes: vat(15, 'IVA general (DGI)') },
  { name: 'Costa Rica', taxes: vat(13, 'IVA de servicios digitales (DGT)') },
  { name: 'El Salvador', taxes: vat(13, 'IVA general (DGII)') },
  { name: 'Bolivia', taxes: vat(13, 'IVA alícuota general (SIN)') },
  { name: 'Guatemala', taxes: vat(12, 'IVA general (SAT)') },
  { name: 'Paraguay', taxes: vat(10, 'IVA de servicios digitales (DNIT/IRE)') },
  { name: 'Japón', taxes: vat(10, 'Impuesto al consumo') },
  { name: 'Australia', taxes: vat(10, 'GST') },
  { name: 'Panamá', taxes: vat(7, 'ITBMS general (DGI)') },
  { name: 'Brasil', taxes: vat(3.5, 'IOF sobre tarjeta internacional (Decreto 12.499/2025)') },
  { name: 'Estados Unidos', taxes: [] }
];

export const taxPct = (country: AccessCountry): number => country.taxes.reduce((sum, t) => sum + t.pct, 0);

/** What the person pays in a month, in dollars: the list price plus the taxes. */
export const effectiveCost = (price: number, country: AccessCountry): number => price * (1 + taxPct(country) / 100);

export interface AccessRow {
  country: string;
  flag: string;
  list: number;
  taxes: number;
  total: number;
  /** extra paid over the list price in twelve months */
  yearlyExtra: number;
}

/** One row per country for a plan price, from the most expensive. */
export function accessRows(price: number): AccessRow[] {
  return ACCESS_COUNTRIES.map((c) => {
    const total = effectiveCost(price, c);
    return { country: c.name, flag: accessFlag(c.name), list: price, taxes: total - price, total, yearlyExtra: (total - price) * 12 };
  }).sort((a, b) => b.total - a.total);
}
