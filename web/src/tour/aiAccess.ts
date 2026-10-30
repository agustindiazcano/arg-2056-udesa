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

/** Taxes a card payment of a foreign digital service carries, over the list price. Argentina: digital VAT and the advance of 30 %; the others: the general VAT or GST rate (the United States has no national tax; state sales tax varies and is left out). */
export const ACCESS_COUNTRIES: readonly AccessCountry[] = [
  { name: 'Argentina', taxes: ARG_TAXES },
  { name: 'Estados Unidos', taxes: [] },
  { name: 'Chile', taxes: vat(19) },
  { name: 'Uruguay', taxes: vat(22) },
  { name: 'México', taxes: vat(16) },
  { name: 'España', taxes: vat(21) },
  { name: 'Alemania', taxes: vat(19) },
  { name: 'Japón', taxes: vat(10, 'Impuesto al consumo') },
  { name: 'Australia', taxes: vat(10, 'GST') }
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
    return { country: c.name, flag: flagSrc(c.name), list: price, taxes: total - price, total, yearlyExtra: (total - price) * 12 };
  }).sort((a, b) => b.total - a.total);
}
