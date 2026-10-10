import { rangeText } from './data';
import type { AndesEvent } from './data';
import { ENEMY_ID, SKIRMISHES } from './forces';

/** The event a red ball stands for: the battle of Chacabuco for the royalist army, the combat of its place for the royalists of a skirmish; null for any other ball. */
export function eventOfRedBall<T extends AndesEvent>(id: string, points: readonly T[]): T | null {
  if (id === ENEMY_ID) return points.find((p) => /batalla/i.test(p.name)) ?? null;
  const skirmish = SKIRMISHES.find((k) => k.id === id);
  return skirmish ? (points.find((p) => skirmish.match.test(p.name)) ?? null) : null;
}

/** The card of a battle or a combat: its name, its date in words, and what the data knows as rows (the forces of each side, the estimate, the altitude). */
export function battleCard(event: AndesEvent): { title: string; date: string; rows: Array<[string, string]>; note: string | null } {
  const date = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${event.date}T00:00:00Z`));
  const rows: Array<[string, string]> = event.forces.map((f): [string, string] => [f.side, f.men === null ? 'sin dato' : new Intl.NumberFormat('es-AR').format(f.men)]);
  const range = rangeText(event.estimate_range);
  if (range) rows.push(['Estimación realista', `${range} hombres`]);
  if (event.elevation_m !== null) rows.push(['Altitud', `${new Intl.NumberFormat('es-AR').format(event.elevation_m)} m`]);
  return { title: /\(combate\)\s*$/i.test(event.name) ? `Combate de ${event.name.replace(/\s*\(combate\)\s*$/i, '')}` : event.name, date, rows, note: event.note ?? null };
}
