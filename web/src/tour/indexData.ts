import { INDEX_STEP, TOUR_ORDER, stepNumber } from './chartSteps.js';
import { AI_TITLE, COMPOSITION_TITLE, DEVELOPMENT_TITLE, EXPORTS_TITLE, FORECAST_UNCERTAINTY_TITLE, PRODUCTIVITY_TITLE, PROVINCE_TITLE, RESOURCES_TITLE, RULE70_TITLE, WORLD_TITLE } from './slideTitles.js';
import { TOUR_CHARTS } from './tourCharts.js';

export interface IndexItem {
  /** the id of the step, what the store and the code call it */
  id: number;
  /** the number of the slide: the one on the buttons of the menu and on the Data page */
  number: number;
  /** the title the slide shows as its heading */
  title: string;
}

/** The title each slide shows as its heading. */
const SPECIAL: Record<number, string> = { 0: WORLD_TITLE, 2: PROVINCE_TITLE, 4: EXPORTS_TITLE, 5: RULE70_TITLE, 8: RESOURCES_TITLE, 12: COMPOSITION_TITLE, 3: AI_TITLE, 14: PRODUCTIVITY_TITLE, 16: DEVELOPMENT_TITLE, 17: FORECAST_UNCERTAINTY_TITLE };

export const titleOf = (id: number): string => SPECIAL[id] ?? TOUR_CHARTS[id]!.title;

/** Every slide but the index, in the order they are shown, with its number and its title. */
export function indexItems(): IndexItem[] {
  return TOUR_ORDER.filter((id) => id !== INDEX_STEP).map((id) => ({ id, number: stepNumber(id), title: titleOf(id) }));
}

/** The slides of the dropdown menu of the navbar: slide 0, the index, first, then the others in the order they are shown. */
export function menuItems(): IndexItem[] {
  return TOUR_ORDER.map((id) => ({ id, number: stepNumber(id), title: id === INDEX_STEP ? 'Índice' : titleOf(id) }));
}
