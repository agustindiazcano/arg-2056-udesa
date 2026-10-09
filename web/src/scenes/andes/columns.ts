import type { AndesEvent } from './data';
import { buildRoute, positionAt } from './timeline';
import type { Route, RoutePosition } from './timeline';

/** One of the other columns of the crossing: its places in order of day, as a route. */
export interface Column {
  id: string;
  name: string;
  route: Route;
}

/**
 * The events of the file, split into the main column (the ones with no `column_id`, the one the camera follows and the panels
 * talk about) and the other columns, each with its own route. The order of the columns is the order they first appear.
 */
export function splitColumns(events: readonly AndesEvent[]): { main: AndesEvent[]; columns: Column[] } {
  const main: AndesEvent[] = [];
  const groups = new Map<string, { name: string; events: AndesEvent[] }>();
  for (const e of events) {
    if (!e.column_id) {
      main.push(e);
      continue;
    }
    const group = groups.get(e.column_id) ?? { name: e.column_name ?? e.column_id, events: [] };
    group.events.push(e);
    groups.set(e.column_id, group);
  }
  const columns = [...groups].map(([id, g]) => ({ id, name: g.name, route: buildRoute(g.events) }));
  return { main, columns };
}

/** The last day any column is on the road: the clock of the scene runs to it, so every ball gets to the end of its way. */
export function campaignEndDay(mainRoute: Route, columns: readonly Column[]): number {
  return Math.max(mainRoute.lastDay, ...columns.map((c) => c.route.lastDay));
}

/** Where a column is on a campaign day: at its first place before it leaves, at its last one after it arrives. */
export function positionOfColumn(column: Column, day: number): RoutePosition | null {
  return positionAt(column.route, day);
}

const COLORS: Record<string, string> = {
  'las-heras': '#f08a24',
  cabot: '#b58cff',
  freire: '#4cc38a',
  lemos: '#ffd24a',
  zelada: '#ff6b8a'
};

/** The color of a column on the map (the main one is the light blue of the army). */
export function columnColor(id: string): string {
  return COLORS[id] ?? '#cfd8e3';
}
