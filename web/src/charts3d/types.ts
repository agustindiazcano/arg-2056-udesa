import type { ProvincesGeo } from '../geo/provinces';
import type { MapValues } from '../scenes/forecast/mapSelectors';

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
  summary: string;
}

export interface LinesLayout {
  xs: number[];
  series: Array<{ name: string; tone: Line3D['tone']; z: number; segments: Array<Array<{ x: number; y: number }>> }>;
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
