import { APP_LOCALE, formatNumber } from '../../charts/format';
import { errorsText, validator } from '../../validation/validators';
import { MEN_PER_FIGURE } from './column';

/** One point of the campaign, as `andes_events.json` has it (schema `andes_events.schema.json`). */
export interface AndesForce {
  side: string;
  /** null when the count is not known: the `note` says why, and the screen never shows 0 for it */
  men: number | null;
  note?: string;
}

export interface AndesEvent {
  id: string;
  name: string;
  /** days from the departure of the main column (1817-01-19); negative for a column that left before it */
  day_of_campaign: number;
  date: string;
  date_precision: 'day' | 'month' | 'year' | 'approximate';
  lat: number;
  lon: number;
  elevation_m: number | null;
  /** the other columns of the crossing; the events of the main column have none */
  column_id?: string;
  column_name?: string;
  forces: AndesForce[];
  estimate_range?: { min: number; max: number };
  source: string;
  retrieved_at: string;
  note?: string;
}

const validate = validator<AndesEvent[]>('andesEvents');

/** The events of `andes_events.json`, checked against the schema. Throws with the first reasons when the file is invalid. */
export function parseAndesEvents(json: unknown): AndesEvent[] {
  if (validate(json)) return json;
  throw new Error(`Invalid andes events data: ${errorsText(validate.errors)}`);
}

const int = (n: number) => new Intl.NumberFormat(APP_LOCALE, { maximumFractionDigits: 0 }).format(n);

/** "Columna: 3.500", or "Opuestas: sin dato (note)": an unknown count is never written as 0. */
export function forceText(f: AndesForce): string {
  if (f.men === null) return `${f.side}: sin dato${f.note ? ` (${f.note})` : ''}`;
  return `${f.side}: ${int(f.men)}`;
}

export function precisionLabel(p: AndesEvent['date_precision']): string {
  return { day: 'fecha exacta', month: 'mes', year: 'año', approximate: 'fecha aproximada' }[p];
}

/** "entre 3.000 y 4.500", or null when the event has no range. */
export function rangeText(range: AndesEvent['estimate_range']): string | null {
  return range ? `entre ${int(range.min)} y ${int(range.max)}` : null;
}

const coordinate = (deg: number, pos: string, neg: string) => `${formatNumber(Math.abs(deg), 4)}° ${deg >= 0 ? pos : neg}`;

/** The facts of an event for the side panel, as label and value. */
export function battleFacts(e: AndesEvent): Array<{ label: string; value: string }> {
  const date = new Intl.DateTimeFormat(APP_LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${e.date}T00:00:00Z`)
  );
  return [
    { label: 'Fecha', value: `${date} (${precisionLabel(e.date_precision)})` },
    { label: 'Día de la campaña', value: String(e.day_of_campaign) },
    { label: 'Lugar', value: `${coordinate(e.lat, 'N', 'S')}, ${coordinate(e.lon, 'E', 'O')}` },
    { label: 'Altitud', value: e.elevation_m === null ? 'sin dato' : `${int(e.elevation_m)} m` }
  ];
}

/** The line under the map that says what the figures of the column are: a schematic picture, not a record. */
export function figuresNote(known: boolean): string {
  return known
    ? `Figuras esquemáticas: cada una representa ${MEN_PER_FIGURE} hombres (efectivos del primer punto); la mezcla de infantería, jinetes y mulas es ilustrativa.`
    : 'Figuras esquemáticas: sin dato de efectivos, la columna tiene un tamaño fijo; la mezcla de infantería, jinetes y mulas es ilustrativa.';
}
