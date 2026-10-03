import * as echarts from 'echarts/core';
import { BarChart, CustomChart, LineChart, MapChart, ScatterChart, TreemapChart } from 'echarts/charts';
import {
  GeoComponent,
  GraphicComponent,
  GridComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
  VisualMapContinuousComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

/**
 * The only ECharts parts the app loads. Each entry names the option `series[].type` it serves, so the coverage test
 * (tests/unit/echartsRegistry.test.ts) can fail when a builder uses a type that is not registered here.
 */
const SERIES = [
  { chart: BarChart, type: 'bar' },
  { chart: CustomChart, type: 'custom' },
  { chart: LineChart, type: 'line' },
  { chart: MapChart, type: 'map' },
  { chart: ScatterChart, type: 'scatter' },
  { chart: TreemapChart, type: 'treemap' }
] as const;

/** Each entry names the option keys it serves: top-level components, and the series-level markLine and markArea. */
const COMPONENTS = [
  { component: GridComponent, keys: ['grid', 'xAxis', 'yAxis'] },
  { component: TooltipComponent, keys: ['tooltip'] },
  { component: VisualMapContinuousComponent, keys: ['visualMap'] },
  { component: GeoComponent, keys: ['geo'] },
  { component: GraphicComponent, keys: ['graphic'] },
  { component: MarkLineComponent, keys: ['markLine'] },
  { component: MarkAreaComponent, keys: ['markArea'] }
] as const;

echarts.use([
  ...SERIES.map((s) => s.chart),
  ...COMPONENTS.map((c) => c.component),
  CanvasRenderer
]);

export const REGISTERED_SERIES: ReadonlySet<string> = new Set(SERIES.map((s) => s.type));
export const REGISTERED_COMPONENTS: ReadonlySet<string> = new Set(COMPONENTS.flatMap((c) => c.keys));

export const init = echarts.init;
export const registerMap = echarts.registerMap;
export type ECharts = echarts.ECharts;
