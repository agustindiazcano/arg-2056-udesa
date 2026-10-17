import { INDEX_STEP, TOUR_ORDER, stepNumber } from './chartSteps.js';
import { SPECIAL_TITLES, menuItems } from './menuItems.js';
import type { IndexItem } from './menuItems.js';
import { TOUR_CHARTS } from './tourCharts.js';

export type { IndexItem };

export const titleOf = (id: number): string => SPECIAL_TITLES[id] ?? TOUR_CHARTS[id]!.title;

/** Every slide but the index, in the order they are shown, with its number and its title. */
export function indexItems(): IndexItem[] {
  return TOUR_ORDER.filter((id) => id !== INDEX_STEP).map((id) => ({ id, number: stepNumber(id), title: titleOf(id) }));
}

export { menuItems };
