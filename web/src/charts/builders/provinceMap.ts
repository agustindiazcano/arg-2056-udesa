import { MALVINAS_ID } from '../../geo/malvinas.js';
import type { ProvincesGeo } from '../../geo/provinces.js';
import { mapSummary } from '../../scenes/forecast/mapSelectors.js';
import type { MapMetric, MapValues } from '../../scenes/forecast/mapSelectors.js';
import { DIVERGING, NO_DATA, SEQUENTIAL_BLUE, tokens } from '../../styles/tokens.js';
import { PROVINCES } from '../../types/province.js';
import type { Scenario } from '../../types/scenario.js';
import { formatValue } from '../format.js';

/** Name under which the component registers the GeoJSON with echarts. */
export const MAP_NAME = 'ar-provinces';

export interface ProvinceMapInput {
  geo: ProvincesGeo;
  values: MapValues;
  centroids: Record<string, [number, number]>;
  smallIds: string[];
  unit: string;
  indicatorLabel: string;
}

export interface ProvinceMapOpts {
  metric: MapMetric;
  selectedId: string | null;
  scenario: Scenario;
  year: number;
}

const SCENARIO_LABEL: Record<Scenario, string> = {
  pessimistic: 'Pessimistic',
  expected: 'Expected',
  optimistic: 'Optimistic'
};

const nameOf = (id: string) => PROVINCES.find((p) => p.id === id)?.name;

interface TooltipParams {
  name?: string;
  data?: { provinceId?: string };
}

export function buildProvinceMap(input: ProvinceMapInput, opts: ProvinceMapOpts) {
  const { geo, values, centroids, smallIds, unit, indicatorLabel } = input;
  const { metric, selectedId, scenario, year } = opts;

  const show = (x: number) => (metric === 'level' ? formatValue(x, unit) : `${x.toFixed(1)}% per year`);

  const items = geo.features
    .map((f) => f.properties.id as string)
    .filter((id) => values.values[id] !== undefined)
    .map((id) => ({ name: id, value: values.values[id]!.plotted }));

  const markers = smallIds
    .filter((id) => values.values[id] !== undefined || id === selectedId)
    .filter((id) => centroids[id] !== undefined)
    .map((id) => ({ name: nameOf(id) ?? id, value: centroids[id]!, provinceId: id }));

  const regions: Array<Record<string, unknown>> = [];
  if (selectedId !== null) {
    regions.push({ name: selectedId, itemStyle: { borderColor: tokens.ink, borderWidth: 2 } });
  }
  regions.push({
    name: MALVINAS_ID,
    itemStyle: { areaColor: NO_DATA, borderColor: tokens.surface, borderWidth: 1 },
    label: { show: true, formatter: 'Malvinas', color: tokens.ink2 }
  });

  const tooltipFormatter = (params: TooltipParams): string => {
    const id = params.data?.provinceId ?? params.name ?? '';
    if (id === MALVINAS_ID) {
      return 'Malvinas Islands<br/>Territory shown for reference: illustrative outline, no data';
    }
    const name = nameOf(id) ?? id;
    const v = values.values[id];
    if (!v) return `${name}<br/>no data`;
    const lines = [name, show(v.plotted)];
    if (metric === 'level') {
      lines.push(`p10 to p90: ${formatValue(v.p10, unit)} to ${formatValue(v.p90, unit)} (80% of simulated outcomes)`);
    }
    lines.push(`Rank ${v.rank}`, `${SCENARIO_LABEL[scenario]} scenario`);
    return lines.join('<br/>');
  };

  const domain = values.domain;
  const visualMap = domain
    ? {
        type: 'continuous',
        min: domain[0],
        max: domain[1],
        seriesIndex: 0,
        calculable: false,
        orient: 'horizontal',
        left: 8,
        bottom: 8,
        itemWidth: 12,
        itemHeight: 140,
        text: [show(domain[1]), show(domain[0])],
        textStyle: { color: tokens.ink2 },
        inRange: { color: metric === 'level' ? SEQUENTIAL_BLUE : DIVERGING }
      }
    : undefined;

  const graphic =
    values.missing.length > 0
      ? [
          {
            type: 'group',
            left: 8,
            bottom: 44,
            children: [
              { type: 'rect', shape: { width: 12, height: 12 }, style: { fill: NO_DATA, stroke: tokens.muted, lineWidth: 1 } },
              { type: 'text', left: 18, top: -1, style: { text: 'No data', fill: tokens.ink2 } }
            ]
          }
        ]
      : undefined;

  const option = {
    animation: false,
    tooltip: { trigger: 'item', formatter: tooltipFormatter },
    ...(visualMap ? { visualMap } : {}),
    ...(graphic ? { graphic } : {}),
    geo: {
      map: MAP_NAME,
      nameProperty: 'id',
      roam: false,
      label: { show: false },
      itemStyle: { areaColor: NO_DATA, borderColor: tokens.surface, borderWidth: 1 },
      emphasis: { itemStyle: { borderColor: tokens.ink2, borderWidth: 1.5 }, label: { show: false } },
      select: { disabled: true },
      regions
    },
    series: [
      { type: 'map', map: MAP_NAME, geoIndex: 0, nameProperty: 'id', data: items },
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        symbol: 'emptyCircle',
        symbolSize: 12,
        itemStyle: { color: tokens.ink2, borderWidth: 2 },
        label: { show: true, position: 'right', formatter: '{b}', color: tokens.ink2 },
        data: markers
      }
    ]
  };

  return {
    option,
    excluded: values.excluded,
    summary: mapSummary(values, metric, indicatorLabel, year, unit),
    mapName: MAP_NAME
  };
}
