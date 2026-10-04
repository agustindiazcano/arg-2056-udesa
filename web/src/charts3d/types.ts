/** One bar of a 3D bar chart. `display` is the value already formatted (es-AR, with its unit). */
export interface Bar3D {
  label: string;
  value: number;
  display: string;
  /** the value short, without its unit, for the label over the bar (the unit is in the title) */
  short: string;
  highlight: boolean;
}

/** What a 3D view needs to draw, as data: the 3D renderer knows nothing about the scenes. */
export interface Bars3DSpec {
  kind: 'bars';
  title: string;
  unit: string;
  bars: Bar3D[];
  /** the text alternative of the canvas */
  summary: string;
}

export type Chart3DSpec = Bars3DSpec;

export interface BarItem {
  x: number;
  height: number;
  width: number;
  depth: number;
  label: string;
  display: string;
  short: string;
  highlight: boolean;
}

export interface Tick {
  value: number;
  height: number;
}

export interface BarsLayout {
  items: BarItem[];
  /** total width of the row of bars */
  width: number;
  /** the largest value of the data */
  max: number;
  ticks: Tick[];
}
