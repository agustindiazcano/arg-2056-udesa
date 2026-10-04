import type { ReactNode } from 'react';

/** The small picture of a view in the carousel: a drawing of its kind of chart, not the chart itself. */
export interface ThumbSpec {
  kind: 'bars' | 'line' | 'fan' | 'treemap' | 'map' | 'table';
  /** the numbers it draws (any scale); a default shape is drawn without them */
  values?: number[];
}

/** One chart, map or table of a scene. The carousel lists them and the viewer shows the selected ones. */
export interface DashView {
  id: string;
  /** the name under the thumbnail and the name of the button */
  name: string;
  thumb: ThumbSpec;
  content: ReactNode;
}

export interface LegendItem {
  label: string;
  tone: 'ink' | 'blue' | 'muted';
}

/** What a scene gives the dashboard. The data hooks and selectors of the scene do not change. */
export interface DashScene {
  title: string;
  subtitle?: string;
  legend?: LegendItem[];
  /** source names of the data on screen and the date they were retrieved (or generated) */
  sources: readonly string[];
  retrievedAt?: string;
  dateLabel?: string;
  views: DashView[];
  /** the list of names on the left (countries, resources, presets) */
  rail?: ReactNode;
  /** the indicator tiles of the right panel */
  tiles?: ReactNode;
  /** extra controls of the right panel (the sliders of the sandbox) */
  side?: ReactNode;
  /** the scene filters; they go to the bottom bar when it is on the page */
  filters?: ReactNode;
  /** a line under the title (scope notes) */
  notes?: ReactNode;
  /**
   * One big view that takes the whole area with its own floating controls (the Andes scene): no title rail, carousel, viewer
   * bar or viewer, only the right panel. The scene draws its own title, names and source line over the stage.
   */
  stage?: ReactNode;
}
