import type { Quality } from '../data/series.js';

export type Cell = string | number | null;

export interface DataTable {
  id: string;
  title: string;
  columns: string[];
  rows: Cell[][];
  /** how real the table is, where it comes from and when it was read; set by `withMeta` */
  quality?: Quality;
  source?: string;
  url?: string;
  retrievedAt?: string | null;
}

export interface SlideData {
  /** the step of the Recorrido ("0" to "14") or "sim" for the simulator */
  id: string;
  /** "<number> · <title>", as the selector shows it */
  label: string;
  title: string;
  /** made-up data ("Datos de prueba") */
  mock: boolean;
  tables: DataTable[];
  /** ids of `REFERENCES` that this slide's data come from or quotes */
  refs: string[];
}

export type RefStatus = 'leída' | 'por informe' | 'usada' | 'citada' | 'contexto' | 'descartada' | 'secundaria';

export interface Reference {
  id: string;
  label: string;
  url: string;
  status: RefStatus;
  group: string;
}
