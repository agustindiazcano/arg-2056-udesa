import { describe, it, expect } from 'vitest';
import { MAP_NAME, buildProvinceMap } from '../../src/charts/builders/provinceMap.js';
import { MALVINAS_ID } from '../../src/geo/malvinas.js';
import { mapSummary } from '../../src/scenes/forecast/mapSelectors.js';
import type { MapValues } from '../../src/scenes/forecast/mapSelectors.js';
import type { Position, ProvincesGeo } from '../../src/geo/provinces.js';
import { DIVERGING, NO_DATA, SEQUENTIAL_BLUE, tokens } from '../../src/styles/tokens.js';

interface Option {
  animation: boolean;
  tooltip: { trigger: string; formatter: (p: { name?: string; data?: { provinceId?: string } }) => string };
  visualMap?: { type: string; min: number; max: number; seriesIndex: number; inRange: { color: string[] }; text: string[] };
  geo: {
    map: string;
    nameProperty: string;
    roam: boolean;
    scaleLimit: { min: number; max: number };
    itemStyle: { areaColor: string; borderColor: string; borderWidth: number };
    regions: Array<{ name: string; itemStyle?: Record<string, unknown>; label?: { show: boolean; formatter: string } }>;
  };
  graphic?: Array<{ children: Array<{ type: string; style?: { fill?: string; text?: string } }> }>;
  series: Array<{
    type: string;
    geoIndex?: number;
    nameProperty?: string;
    symbol?: string;
    itemStyle?: { color?: string };
    data: Array<{ name: string; value: number | [number, number]; provinceId?: string }>;
  }>;
}

const ring: Position[] = [[-70, -40], [-60, -40], [-60, -30], [-70, -40]];
const features = ['AR-A', 'AR-B', 'AR-C', 'AR-D'].map((id, i) => ({
  type: 'Feature' as const,
  properties: {
    id: id as 'AR-A',
    name: id,
    area_km2: 100 * (i + 1),
    centroid: [-65 + i, -35] as [number, number],
    centroid_inside: true,
    bbox: [-70, -40, -60, -30] as [number, number, number, number]
  },
  geometry: { type: 'Polygon' as const, coordinates: [ring] }
}));
const geo: ProvincesGeo = { type: 'FeatureCollection', features };
const centroids = Object.fromEntries(features.map((f) => [f.properties.id, f.properties.centroid]));

const values: MapValues = {
  values: {
    'AR-A': { plotted: 20, p10: 19, p50: 20, p90: 21, rank: 2 },
    'AR-B': { plotted: 25, p10: 24, p50: 25, p90: 26, rank: 1 }
  },
  missing: ['AR-C', 'AR-D'],
  domain: [5, 30],
  excluded: 2
};

function build(over: { values?: MapValues; metric?: 'level' | 'change'; selectedId?: string | null; smallIds?: string[]; observed?: boolean } = {}) {
  const result = buildProvinceMap(
    {
      geo,
      values: over.values ?? values,
      centroids,
      smallIds: over.smallIds ?? ['AR-A', 'AR-B', 'AR-C'],
      unit: 't',
      indicatorLabel: 'producción de oro'
    },
    { metric: over.metric ?? 'level', selectedId: over.selectedId ?? null, scenario: 'expected', year: 2027, observed: over.observed }
  );
  return { ...result, option: result.option as unknown as Option };
}

describe('buildProvinceMap with observed data', () => {
  it('shows the value and the rank, with no p10-p90 line and no scenario', () => {
    const { option } = build({ observed: true });
    expect(option.tooltip.formatter({ name: 'AR-B' })).toBe('Buenos Aires<br/>25 t<br/>Puesto 1');
  });

  it('still says "sin datos" for a province without a value', () => {
    expect(build({ observed: true }).option.tooltip.formatter({ name: 'AR-C' })).toBe(
      'Ciudad Autónoma de Buenos Aires<br/>sin datos'
    );
  });
});

describe('buildProvinceMap', () => {
  it('registers features by their AR-X id and binds the map series to the geo component', () => {
    const { option, mapName } = build();
    expect(mapName).toBe(MAP_NAME);
    expect(MAP_NAME).toBe('ar-provinces');
    expect(option.geo.map).toBe(MAP_NAME);
    expect(option.geo.nameProperty).toBe('id');
    expect(option.geo.roam).toBe(true);
    expect(option.geo.scaleLimit).toEqual({ min: 1, max: 8 });
    const map = option.series.find((s) => s.type === 'map')!;
    expect(map.geoIndex).toBe(0);
    expect(map.nameProperty).toBe('id');
  });

  it('has one data item per province with a value and none for the missing ones', () => {
    const map = build().option.series.find((s) => s.type === 'map')!;
    expect(map.data).toEqual([
      { name: 'AR-A', value: 20 },
      { name: 'AR-B', value: 25 }
    ]);
  });

  it('sets the visualMap range to the domain, bound to the map series', () => {
    const vm = build().option.visualMap!;
    expect(vm.type).toBe('continuous');
    expect([vm.min, vm.max]).toEqual([5, 30]);
    expect(vm.seriesIndex).toBe(0);
  });

  it('uses the sequential ramp for level, darkest for the lowest value', () => {
    const colors = build().option.visualMap!.inRange.color;
    expect(colors).toEqual(SEQUENTIAL_BLUE);
    expect(colors[0]).toBe('#0d366b');
    expect(colors[colors.length - 1]).toBe('#cde2fb');
  });

  it('uses the diverging ramp for change, not reversed, with a symmetric domain', () => {
    const change: MapValues = { ...values, domain: [-60, 60] };
    const vm = build({ values: change, metric: 'change' }).option.visualMap!;
    expect(vm.inRange.color).toEqual(DIVERGING);
    expect([vm.min, vm.max]).toEqual([-60, 60]);
    expect(vm.inRange.color[10]).toBe(tokens.blue); // the highest values end in blue
  });

  it('labels the ends of the scale with formatted values', () => {
    expect(build().option.visualMap!.text).toEqual(['30 t', '5 t']);
    const change: MapValues = { ...values, domain: [-60, 60] };
    expect(build({ values: change, metric: 'change' }).option.visualMap!.text).toEqual(['60,0% por año', '-60,0% por año']);
  });

  it('paints provinces without data with the NO_DATA token, never with a ramp color', () => {
    const { option } = build();
    expect(option.geo.itemStyle.areaColor).toBe(NO_DATA);
    expect(SEQUENTIAL_BLUE).not.toContain(option.geo.itemStyle.areaColor);
    expect(DIVERGING.slice(0, 5)).not.toContain(option.geo.itemStyle.areaColor);
  });

  it('shows a "Sin datos" swatch in the legend only when some province is missing', () => {
    const withMissing = build().option.graphic!;
    const children = withMissing[0]!.children;
    expect(children.find((c) => c.type === 'rect')!.style!.fill).toBe(NO_DATA);
    expect(children.find((c) => c.type === 'text')!.style!.text).toBe('Sin datos');

    const complete: MapValues = {
      values: {
        'AR-A': values.values['AR-A']!, 'AR-B': values.values['AR-B']!,
        'AR-C': { plotted: 1, p10: 0, p50: 1, p90: 2, rank: 3 }, 'AR-D': { plotted: 2, p10: 1, p50: 2, p90: 3, rank: 4 }
      },
      missing: [],
      domain: [1, 25],
      excluded: 0
    };
    expect(build({ values: complete }).option.graphic).toBeUndefined();
  });

  it('separates provinces with a 1px surface border', () => {
    const { itemStyle } = build().option.geo;
    expect(itemStyle.borderColor).toBe(tokens.surface);
    expect(itemStyle.borderWidth).toBe(1);
  });

  it('marks the selected province with a 2px ink border and changes no color', () => {
    const { option } = build({ selectedId: 'AR-B' });
    const region = option.geo.regions.find((r) => r.name === 'AR-B')!;
    expect(region.itemStyle).toEqual({ borderColor: tokens.ink, borderWidth: 2 });
    expect(option.geo.regions.filter((r) => r.name !== MALVINAS_ID && r.name !== 'AR-B')).toEqual([]);
    expect(option.geo.itemStyle.areaColor).toBe(NO_DATA);
    expect(option.visualMap!.inRange.color).toEqual(SEQUENTIAL_BLUE);
    const none = build().option;
    expect(none.geo.regions.find((r) => r.name === 'AR-B')).toBeUndefined();
  });

  it('draws the illustrative Malvinas region as no data with its label', () => {
    const region = build().option.geo.regions.find((r) => r.name === MALVINAS_ID)!;
    expect(region.itemStyle).toMatchObject({ areaColor: NO_DATA });
    expect(region.label).toMatchObject({ show: true, formatter: 'Malvinas' });
  });

  it('puts markers only on small provinces that have a value or are selected', () => {
    const markers = (o: Option) => o.series.find((s) => s.type === 'scatter')!.data.map((d) => d.provinceId);
    expect(markers(build().option)).toEqual(['AR-A', 'AR-B']); // AR-C is small but has no value
    expect(markers(build({ selectedId: 'AR-C' }).option)).toEqual(['AR-A', 'AR-B', 'AR-C']);
    expect(markers(build({ smallIds: [] }).option)).toEqual([]);
  });

  it('places markers at the province centroid as rings in the ink-2 token', () => {
    const scatter = build().option.series.find((s) => s.type === 'scatter')!;
    expect(scatter.data[0]).toEqual({ name: 'Salta', value: [-65, -35], provinceId: 'AR-A' });
    expect(scatter.symbol).toBe('emptyCircle');
    expect(scatter.itemStyle!.color).toBe(tokens.ink2);
  });

  it('formats the tooltip for a province with data (level)', () => {
    expect(build().option.tooltip.formatter({ name: 'AR-B' })).toBe(
      'Buenos Aires<br/>25 t<br/>p10 a p90: 24 t a 26 t (80% de los resultados simulados)<br/>Puesto 1<br/>Escenario esperado'
    );
  });

  it('formats the tooltip for change without the p10-p90 line', () => {
    const change: MapValues = {
      ...values,
      values: { 'AR-A': { plotted: 4.25, p10: 19, p50: 20, p90: 21, rank: 2 } },
      missing: [],
      domain: [-5, 5]
    };
    expect(build({ values: change, metric: 'change' }).option.tooltip.formatter({ name: 'AR-A' })).toBe(
      'Salta<br/>4,3% por año<br/>Puesto 2<br/>Escenario esperado'
    );
  });

  it('shows only "sin datos" for a province without a value', () => {
    expect(build().option.tooltip.formatter({ name: 'AR-C' })).toBe('Ciudad Autónoma de Buenos Aires<br/>sin datos');
  });

  it('formats the tooltip of a marker by its provinceId', () => {
    expect(build().option.tooltip.formatter({ name: 'Salta', data: { provinceId: 'AR-A' } })).toContain('Salta<br/>20 t');
  });

  it('describes the Malvinas as an illustrative territory outline', () => {
    expect(build().option.tooltip.formatter({ name: MALVINAS_ID })).toBe(
      'Islas Malvinas<br/>Territorio mostrado como referencia: contorno ilustrativo, sin datos'
    );
  });

  it('counts excluded provinces and builds the summary with mapSummary', () => {
    const { excluded, summary } = build();
    expect(excluded).toBe(2);
    expect(summary).toBe(mapSummary(values, 'level', 'producción de oro', 2027, 't'));
  });

  it('with no domain has no color scale, no data items and every province as no data', () => {
    const empty: MapValues = { values: {}, missing: ['AR-A', 'AR-B', 'AR-C', 'AR-D'], domain: null, excluded: 4 };
    const { option, summary } = build({ values: empty });
    expect(option.visualMap).toBeUndefined();
    expect(option.series.find((s) => s.type === 'map')!.data).toEqual([]);
    expect(summary).toBe('Sin datos provinciales de producción de oro en 2027.');
  });

  it('does not animate data changes', () => {
    expect(build().option.animation).toBe(false);
  });

  it('contains no color literal: every color is a token', () => {
    const allowed = new Set<string>(
      [
        ...Object.values(tokens).filter((v): v is string => typeof v === 'string'),
        ...Object.values(tokens.scenario),
        ...Object.values(tokens.state),
        ...SEQUENTIAL_BLUE,
        ...DIVERGING,
        NO_DATA
      ].map((c) => c.toLowerCase())
    );
    for (const metric of ['level', 'change'] as const) {
      const text = JSON.stringify(build({ metric, selectedId: 'AR-B' }).option);
      const found = text.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) ?? [];
      expect(found.length).toBeGreaterThan(0);
      for (const color of found) expect(allowed.has(color.toLowerCase())).toBe(true);
    }
  });
});
