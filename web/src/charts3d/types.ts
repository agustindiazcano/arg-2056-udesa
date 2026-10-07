import type { ProvincesGeo } from '../geo/provinces';
import type { MapValues } from '../scenes/forecast/mapSelectors';
import type { BarsView } from './followAnim';

/** One bar of a 3D bar chart. `display` is the value already formatted (es-AR, with its unit). */
export interface Bar3D {
  label: string;
  value: number;
  display: string;
  /** the value short, without its unit, for the label over the bar (the unit is in the title) */
  short: string;
  highlight: boolean;
}

/** A clock shared by a page and its 3D charts: the milliseconds of an animation, written by the page (it plays, it is dragged) and read by the charts on every frame. */
export interface TimelineClock {
  current: number;
}

/** What a 3D view needs to draw, as data: the 3D renderer knows nothing about the scenes. */
export interface Bars3DSpec {
  kind: 'bars';
  title: string;
  unit: string;
  bars: Bar3D[];
  /** the text alternative of the canvas */
  summary: string;
  /**
   * Bars that change with a clock (the GDP of the region from 1900 to 2026): the heights come from `valuesAt(year)` on every frame, in the
   * order of `bars`, and the camera stands close to the bar `focus` while the years go by and pulls back a little at the end.
   */
  timeline?: {
    clock: TimelineClock;
    yearAt: (elapsedMs: number) => number;
    valuesAt: (year: number) => number[];
    focus: number;
    /** the numbers of the camera, read on every frame (the tuner of the page changes them while the chart is on screen) */
    view?: { current: BarsView };
  };
}

/** The province map in space: the same data as the flat map, as extruded provinces. */
export interface Map3DSpec {
  kind: 'map';
  title: string;
  geo: ProvincesGeo;
  values: MapValues;
  metric: 'level' | 'change';
  selectedId: string | null;
  /** how a plotted value reads in the tooltip */
  formatValue: (value: number) => string;
  /** a click on a province (null clears the selection) */
  onSelect: (id: string | null) => void;
  /** the map stands upright, north up and seen almost from above (the Recorrido), not tilted on a table */
  upright?: boolean;
  /** the camera flies to the selected province and back to the whole map when nothing is selected */
  zoomToSelected?: boolean;
  summary: string;
}

/** One line of a 3D line chart. `tone` says how it is drawn: the home series bright, the peers quiet. */
export interface Line3D {
  name: string;
  /** one value per x label; null is a gap */
  values: Array<number | null>;
  tone: 'highlight' | 'muted' | 'accent';
  /** a color from the tokens that overrides the tone (the scenario colors) */
  color?: string;
  /** drawn as a dashed line (a projection) */
  dashed?: boolean;
}

/** A line chart in space: each series is a wall in its own lane, the band a translucent wall. */
export interface Lines3DSpec {
  kind: 'lines';
  title: string;
  unit: string;
  xLabels: string[];
  series: Line3D[];
  /** a range drawn behind the lines (the p10 to p90 of the forecast) */
  band?: { lower: Array<number | null>; upper: Array<number | null> };
  /** index of the x label to mark (the playhead year) */
  marker?: number;
  /** the line draws itself from the first x to the last while the camera follows it, then the camera pulls back to the whole chart */
  follow?: boolean;
  /** with `follow`: the moment of the animation comes from this clock (the page plays it and the visitor drags it) instead of from a timer of the chart */
  clock?: TimelineClock;
  summary: string;
}

export interface LinesLayout {
  xs: number[];
  series: Array<{ name: string; tone: Line3D['tone']; dashed?: boolean; z: number; segments: Array<Array<{ x: number; y: number }>> }>;
  bands: Array<{ upper: Array<{ x: number; y: number }>; lower: Array<{ x: number; y: number }> }>;
  ticks: Tick[];
  xTicks: Array<{ x: number; label: string }>;
  markerX: number | null;
  /** the value at the top of the scale */
  top: number;
}

export type Chart3DSpec = Bars3DSpec | Map3DSpec | Lines3DSpec;

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
