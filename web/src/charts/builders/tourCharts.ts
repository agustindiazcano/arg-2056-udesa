import { tokens } from '../../styles/tokens.js';
import { formatAxisNumber, formatValue } from '../format.js';
import { fade } from './gdp.js';

const GRID_LINE = { color: tokens.grid, type: 'dashed' } as const;

/** The axes the Recorrido charts share: dashed grid lines in both directions, quiet labels. */
function axes(categories: string[], labelEvery?: number, boundaryGap = true) {
  return {
    grid: { left: 8, right: 24, top: 24, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap,
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisTick: { show: false },
      axisLabel: { color: tokens.ink2, ...(labelEvery ? { interval: labelEvery } : {}) },
      splitLine: { show: true, ...(labelEvery ? { interval: labelEvery } : {}), lineStyle: GRID_LINE }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: GRID_LINE },
      axisLabel: { color: tokens.muted, formatter: (v: number) => formatAxisNumber(v) }
    }
  };
}

const TOOLTIP = {
  trigger: 'axis',
  backgroundColor: 'rgba(13,13,13,0.92)',
  borderColor: tokens.border,
  textStyle: { color: tokens.ink }
};

export interface ColumnSeries {
  name: string;
  values: number[];
  color: string;
  /** the range of each value, drawn as a whisker */
  range?: { low: number[]; high: number[] };
}

interface ColumnsOpts {
  unit: string;
  /** the category to paint with the accent color (single series only) */
  highlight?: string;
  summary: string;
  /** a bar chart of many categories: thinner bars and names turned this many degrees under them */
  dense?: { barWidth: number; rotate: number };
}

const BAR_WIDTH = 30;
const BAR_GAP = 1.1;

/** Columns, one series per group member: a single series is a ranking, two are a comparison; a series may carry a range. */
export function buildColumns(categories: string[], series: ColumnSeries[], opts: ColumnsOpts) {
  const n = series.length;
  const barWidth = opts.dense?.barWidth ?? (n === 1 ? 44 : BAR_WIDTH);
  const bars = series.map((s) => ({
    name: s.name,
    type: 'bar',
    barWidth,
    barGap: `${Math.round((BAR_GAP - 1) * 100)}%`,
    data: s.values.map((v, i) => ({
      value: v,
      itemStyle: {
        color: opts.highlight !== undefined && categories[i] === opts.highlight ? tokens.blue : s.color,
        borderRadius: [4, 4, 0, 0],
        shadowBlur: 10,
        shadowColor: `${s.color}55`
      }
    })),
    label: { show: true, position: 'top', color: tokens.ink2, formatter: (p: { value: number }) => formatAxisNumber(p.value) }
  }));

  // a range is a whisker: a vertical line with two caps, centred on the bar of its series
  const whiskers = series.flatMap((s, k) => {
    if (!s.range) return [];
    const { low, high } = s.range;
    const offset = (k - (n - 1) / 2) * barWidth * BAR_GAP;
    return [
      {
        name: `${s.name} (rango)`,
        type: 'custom',
        silent: true,
        z: 5,
        encode: { x: 0, y: [1, 2] },
        data: categories.map((_, i) => [i, low[i], high[i]]),
        renderItem: (_params: unknown, api: { value: (d: number) => number; coord: (p: [number, number]) => number[] }) => {
          const x = api.value(0);
          const top = api.coord([x, api.value(2)]);
          const bottom = api.coord([x, api.value(1)]);
          const cx = (top[0] ?? 0) + offset;
          const style = { stroke: tokens.ink, lineWidth: 2 };
          const cap = (y: number) => ({ type: 'line', shape: { x1: cx - 7, y1: y, x2: cx + 7, y2: y }, style });
          return {
            type: 'group',
            children: [
              { type: 'line', shape: { x1: cx, y1: top[1] ?? 0, x2: cx, y2: bottom[1] ?? 0 }, style },
              cap(top[1] ?? 0),
              cap(bottom[1] ?? 0)
            ]
          };
        }
      }
    ];
  });

  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      ...TOOLTIP,
      axisPointer: { type: 'shadow' },
      formatter: (params: Array<{ dataIndex: number }>) => {
        const i = params[0]?.dataIndex;
        if (i === undefined) return '';
        const lines = [`<strong>${categories[i]}</strong>`];
        for (const s of series) {
          const range = s.range ? ` (rango ${formatValue(s.range.low[i], '')}a ${formatValue(s.range.high[i], opts.unit)})` : '';
          lines.push(`${s.name}: ${formatValue(s.values[i], opts.unit)}${range}`);
        }
        return lines.join('<br/>');
      }
    },
    ...axes(categories),
    series: [...bars, ...whiskers]
  };
  if (opts.dense) {
    option.xAxis.axisLabel = { ...option.xAxis.axisLabel, rotate: opts.dense.rotate, interval: 0, fontSize: 11 } as never;
    option.series.forEach((s) => {
      if (s.type === 'bar') (s as { label: { show: boolean } }).label.show = false;
    });
  }
  return { option, summary: opts.summary };
}

export interface LineChartSeries {
  name: string;
  values: Array<number | null>;
  color: string;
  dashed?: boolean;
}

/** Several glowing lines with a fade under each, on the shared axes. */
export function buildLines(xLabels: string[], series: LineChartSeries[], opts: { unit: string; labelEvery: number; summary: string }) {
  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      ...TOOLTIP,
      axisPointer: { type: 'line', lineStyle: { color: tokens.muted, type: 'dashed' } },
      formatter: (params: Array<{ dataIndex: number }>) => {
        const i = params[0]?.dataIndex;
        if (i === undefined) return '';
        return [`<strong>${xLabels[i]}</strong>`, ...series.map((s) => `${s.name}: ${formatValue(s.values[i] ?? null, opts.unit)}`)].join('<br/>');
      }
    },
    ...axes(xLabels, opts.labelEvery, false),
    series: series.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.values,
      smooth: 0.25,
      symbol: 'none',
      z: 3,
      lineStyle: { width: 3, color: s.color, ...(s.dashed ? { type: 'dashed' } : {}), shadowBlur: 12, shadowColor: `${s.color}88` },
      itemStyle: { color: s.color },
      areaStyle: { color: fade(s.color, '40', '00') }
    }))
  };
  return { option, summary: opts.summary };
}

/** A treemap of shares: every rectangle is a part of the whole, its area its share. */
export function buildShares(rows: Array<{ label: string; value: number }>, opts: { unit: string; summary: string }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const blues = ['#3987e5', '#2f74c7', '#2a64ab', '#245690', '#1f4876', '#1a3b5f', '#163049', '#122638'];
  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(13,13,13,0.92)',
      borderColor: tokens.border,
      textStyle: { color: tokens.ink },
      formatter: (p: { name: string; value: number }) => `${p.name}<br/>${formatValue(p.value, opts.unit)}`
    },
    series: [
      {
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        left: 8,
        right: 8,
        top: 8,
        bottom: 8,
        itemStyle: { borderColor: tokens.page, borderWidth: 3, gapWidth: 2, borderRadius: 6 },
        label: {
          show: true,
          color: tokens.ink,
          fontSize: 15,
          formatter: (p: { name: string; value: number }) => `{n|${p.name}}\n{v|${formatValue(p.value, opts.unit)}}`,
          rich: { n: { fontSize: 15, fontWeight: 600, color: tokens.ink }, v: { fontSize: 13, color: tokens.ink2 } }
        },
        data: sorted.map((r, i) => ({ name: r.label, value: r.value, itemStyle: { color: blues[Math.min(i, blues.length - 1)] } }))
      }
    ]
  };
  return { option, summary: opts.summary };
}

/** The GDP line as it is while the animation follows it: only up to `frame.year`, in a moving window of years. */
export function buildFollowedSeries(
  years: number[],
  values: number[],
  frame: { year: number; xMin: number; xMax: number; yMax: number; visibleCount: number },
  opts: { unit: string; name: string; summary: string }
) {
  const drawn: Array<[number, number]> = years.slice(0, frame.visibleCount).map((y, i) => [y, values[i]!]);
  const last = drawn.at(-1);
  // the head, a little past the last whole year: it moves smoothly between two years
  const next = years[frame.visibleCount];
  const nextValue = values[frame.visibleCount];
  if (last && next !== undefined && nextValue !== undefined && frame.year > last[0]) {
    const t = (frame.year - last[0]) / (next - last[0]);
    drawn.push([frame.year, last[1] + (nextValue - last[1]) * t]);
  }
  const head = drawn.at(-1);
  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: { show: false },
    grid: { left: 8, right: 28, top: 24, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      min: frame.xMin,
      max: frame.xMax,
      minInterval: 1,
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisTick: { show: false },
      axisLabel: { color: tokens.muted, formatter: (v: number) => String(Math.round(v)) },
      splitLine: { show: true, lineStyle: GRID_LINE }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: frame.yMax,
      splitLine: { lineStyle: GRID_LINE },
      axisLabel: { color: tokens.muted, formatter: (v: number) => formatAxisNumber(v) }
    },
    series: [
      {
        name: opts.name,
        type: 'line',
        data: drawn,
        symbol: 'none',
        z: 3,
        lineStyle: { width: 3, color: tokens.ink, shadowBlur: 12, shadowColor: 'rgba(255,255,255,0.35)' },
        itemStyle: { color: tokens.ink },
        areaStyle: { color: fade('#ffffff', '40', '00') }
      },
      {
        name: 'Hoy',
        type: 'line',
        data: head ? [head] : [],
        symbol: 'circle',
        symbolSize: 11,
        z: 4,
        silent: true,
        lineStyle: { opacity: 0 },
        itemStyle: { color: tokens.blue, borderColor: tokens.ink, borderWidth: 2, shadowBlur: 14, shadowColor: 'rgba(57,135,229,0.7)' }
      }
    ]
  };
  return { option, summary: opts.summary };
}
