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
  day_of_campaign: number;
  date: string;
  date_precision: 'day' | 'month' | 'year' | 'approximate';
  lat: number;
  lon: number;
  elevation_m: number | null;
  forces: AndesForce[];
  estimate_range?: { min: number; max: number };
  source: string;
  retrieved_at: string;
  note?: string;
}
