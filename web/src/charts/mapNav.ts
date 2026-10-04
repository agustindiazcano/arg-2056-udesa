import { BUTTON_FACTOR, zoomFactorFor } from './navState';
import type { ECharts } from './echarts.js';

type Chart = Pick<ECharts, 'getOption' | 'getWidth' | 'getHeight' | 'dispatchAction' | 'setOption'>;

/** The zoom the map has now (1 when nobody zoomed it yet). */
function currentZoom(chart: Chart): number {
  const geo = (chart.getOption() as { geo?: { zoom?: number }[] } | undefined)?.geo;
  return geo?.[0]?.zoom ?? 1;
}

/** The `+` and `-` buttons: zoom about the middle of the chart, within the limits. Nothing happens at a limit. */
export function zoomMap(chart: Chart, direction: 'in' | 'out'): void {
  const factor = zoomFactorFor(currentZoom(chart), direction === 'in' ? BUTTON_FACTOR : 1 / BUTTON_FACTOR);
  if (factor === 1) return;
  chart.dispatchAction({ type: 'geoRoam', componentType: 'geo', zoom: factor, originX: chart.getWidth() / 2, originY: chart.getHeight() / 2 });
}

/** The reset button: the whole territory, as the option first drew it. */
export function resetMap(chart: Chart): void {
  chart.setOption({ geo: { zoom: 1, center: null } });
}
