import { INDEX_STEP, TOUR_ORDER, stepNumber } from './chartSteps.js';
import { AI_EVIDENCE_SLIDES } from './aiEvidence.js';
import { DRAFT_SLIDES } from './draftSlides.js';
import {
  AI_ACCESS_TITLE,
  AI_PYRAMID_TITLE,
  AI_TITLE,
  COMPOSITION_TITLE,
  DEVELOPMENT_TITLE,
  ENCLAVE_TITLE,
  EXPORTS_TITLE,
  FORECAST_LIMITS_TITLE,
  FORECAST_UNCERTAINTY_TITLE,
  PEERS_TITLE,
  PRODUCTIVITY_TITLE,
  PROVINCE_TITLE,
  RESOURCES_TITLE,
  RULE70_TITLE,
  SHOCKS_TITLE,
  WORLD_TITLE
} from './slideTitles.js';

export interface IndexItem {
  /** the id of the step, what the store and the code call it */
  id: number;
  /** the number of the slide: the one on the buttons of the menu and on the Data page */
  number: number;
  /** the title the slide shows as its heading */
  title: string;
}

/** The title each slide shows as its heading. Light on purpose: the navbar shows these titles and must not load the charts. */
export const SPECIAL_TITLES: Record<number, string> = {
  0: WORLD_TITLE,
  2: PROVINCE_TITLE,
  4: EXPORTS_TITLE,
  5: RULE70_TITLE,
  8: RESOURCES_TITLE,
  12: COMPOSITION_TITLE,
  3: AI_TITLE,
  14: PRODUCTIVITY_TITLE,
  16: DEVELOPMENT_TITLE,
  17: FORECAST_UNCERTAINTY_TITLE,
  21: AI_ACCESS_TITLE,
  22: SHOCKS_TITLE,
  23: ENCLAVE_TITLE,
  24: PEERS_TITLE,
  25: FORECAST_LIMITS_TITLE,
  26: AI_PYRAMID_TITLE,
  ...Object.fromEntries(DRAFT_SLIDES.map((d) => [d.id, d.title])),
  ...Object.fromEntries(AI_EVIDENCE_SLIDES.map((d) => [d.id, d.title]))
};

/** The slides of the dropdown menu of the navbar: slide 0, the index, first, then the others in the order they are shown. */
export function menuItems(): IndexItem[] {
  return TOUR_ORDER.map((id) => ({ id, number: stepNumber(id), title: id === INDEX_STEP ? 'Índice' : SPECIAL_TITLES[id]! }));
}
