import type { Section } from '../types/scene';

/** Switches the deprecated Data Dashboard back on (`localStorage.setItem('arg2056.showDashboard', '1')`): the end-to-end tests and the developers use it. */
export const SHOW_DASHBOARD_KEY = 'arg2056.showDashboard';

/** The sections to offer (in the navigation and under Comenzar): the Data Dashboard is deprecated and stays hidden unless it is switched on. */
export function visibleSections(sections: readonly Section[]): Section[] {
  let shown = false;
  try {
    shown = window.localStorage.getItem(SHOW_DASHBOARD_KEY) === '1';
  } catch {
    // no storage: the default holds
  }
  return sections.filter((s) => s !== 'dashboard' || shown);
}

/** The names of the three sections in the top navigation. */
export const SECTION_LABELS: Record<Section, string> = {
  andes: 'Andes',
  dashboard: 'Data Dashboard',
  tour: 'Recorrido'
};
