import { tokens } from '../../styles/tokens.js';
import { APP_LOCALE, formatAxisNumber, formatValue } from '../format.js';
import { fade } from './gdp.js';

const LINE = { color: tokens.grid } as const;

/** The axes the Recorrido charts share: clean solid y-grid lines, quiet labels (matching Slide 5 style). */
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
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: LINE },
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
  /** optional per-bar colors; defaults to cycling tokens.categorical for single-series charts */
  colors?: string[];
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

/** Columns, one series per group member: a single series is a ranking with a rich categorical palette, two are a comparison; a series may carry a range. */
export function buildColumns(categories: string[], series: ColumnSeries[], opts: ColumnsOpts) {
  const n = series.length;
  const barWidth = opts.dense?.barWidth ?? (n === 1 ? 36 : BAR_WIDTH);
  const highlightIdx = opts.highlight !== undefined ? categories.indexOf(opts.highlight) : -1;
  const bars = series.map((s, seriesIdx) => {
    return {
      name: s.name,
      type: 'bar',
      barWidth,
      barMaxWidth: 44,
      barGap: `${Math.round((BAR_GAP - 1) * 100)}%`,
      data: s.values.map((v, i) => {
        const isHighlight = highlightIdx === i;
        const paletteColor =
          s.colors?.[i] ??
          (n === 1
            ? highlightIdx > 0
              ? tokens.categorical[1 + (i % (tokens.categorical.length - 1))]!
              : tokens.categorical[i % tokens.categorical.length]!
            : s.color !== tokens.muted
              ? s.color
              : tokens.categorical[(seriesIdx * 3 + i) % tokens.categorical.length]!);
        const barColor = isHighlight ? tokens.blue : paletteColor;
      return {
        value: v,
        itemStyle: {
          color: barColor,
          borderRadius: [4, 4, 0, 0],
          borderColor: isHighlight ? tokens.ink : 'rgba(255,255,255,0.16)',
          borderWidth: isHighlight ? 1.5 : 1
        }
      };
    }),
      label: { show: true, position: 'top', color: tokens.ink2, formatter: (p: { value: number }) => formatAxisNumber(p.value) }
    };
  });

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
    // many bars: the number stays above each one, smaller
    option.series.forEach((s) => {
      if (s.type === 'bar') Object.assign((s as { label: object }).label, { fontSize: 10 });
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
      lineStyle: { width: 3, color: s.color, ...(s.dashed ? { type: 'dashed' } : {}) },
      itemStyle: { color: s.color }
    }))
  };
  return { option, summary: opts.summary };
}

/** Fluid animated lines plotted on a continuous numerical xAxis: smoothly interpolates data points at any fractional year. */
export function buildFluidLines(
  years: number[],
  series: LineChartSeries[],
  currentYear: number,
  opts: {
    unit: string;
    labelEvery: number;
    summary: string;
    yMin?: number;
    yMax?: number;
    showHead?: boolean;
    showGhost?: boolean;
    area?: boolean;
  }
) {
  const minYear = years[0]!;
  const maxYear = years.at(-1)!;
  const isComplete = currentYear >= maxYear;

  const allValues = series.flatMap((s) => s.values.filter((v): v is number => v !== null && Number.isFinite(v)));
  const yMin = opts.yMin ?? Math.floor(Math.min(...allValues) * 0.97);
  const yMax = opts.yMax ?? Math.ceil(Math.max(...allValues) * 1.02);

  const seriesData = series.map((s) => {
    const drawn: Array<[number, number]> = [];
    for (let i = 0; i < years.length; i++) {
      const y = years[i]!;
      const v = s.values[i];
      if (y <= currentYear && v !== null && v !== undefined && Number.isFinite(v)) {
        drawn.push([y, v]);
      }
    }
    // Interpolate fractional tip if between years and not yet complete
    if (!isComplete && currentYear > minYear && currentYear < maxYear) {
      const i = years.findIndex((y, idx) => y <= currentYear && (years[idx + 1] ?? Infinity) > currentYear);
      if (i >= 0 && i < years.length - 1) {
        const y0 = years[i]!;
        const y1 = years[i + 1]!;
        const v0 = s.values[i];
        const v1 = s.values[i + 1];
        if (v0 !== null && v0 !== undefined && v1 !== null && v1 !== undefined) {
          const t = (currentYear - y0) / (y1 - y0);
          const interpolated = v0 + (v1 - v0) * t;
          drawn.push([currentYear, interpolated]);
        }
      }
    }
    return {
      name: s.name,
      type: 'line',
      data: drawn,
      smooth: 0.25,
      symbol: 'none',
      z: 3,
      lineStyle: {
        width: 3,
        color: s.color,
        ...(s.dashed ? { type: 'dashed' } : {})
      },
      itemStyle: { color: s.color },
      ...(opts.area ? { areaStyle: { color: fade(s.color, '40', '00') } } : {})
    };
  });

  const headDots: object[] = [];
  if (opts.showHead && !isComplete && currentYear > minYear) {
    for (const s of series) {
      if (s.dashed) continue;
      const i = years.findIndex((y, idx) => y <= currentYear && (years[idx + 1] ?? Infinity) > currentYear);
      if (i >= 0 && i < years.length - 1) {
        const y0 = years[i]!;
        const y1 = years[i + 1]!;
        const v0 = s.values[i];
        const v1 = s.values[i + 1];
        if (v0 !== null && v0 !== undefined && v1 !== null && v1 !== undefined) {
          const t = (currentYear - y0) / (y1 - y0);
          const headVal = v0 + (v1 - v0) * t;
          headDots.push({
            name: `${s.name} (cabeza)`,
            type: 'line',
            data: [[currentYear, headVal]],
            symbol: 'circle',
            symbolSize: 8,
            z: 5,
            silent: true,
            lineStyle: { opacity: 0 },
            itemStyle: {
              color: s.color,
              borderColor: '#ffffff',
              borderWidth: 2
            }
          });
        }
      }
    }
  }

  const ghostSeries: object[] = [];
  if (opts.showGhost && !isComplete) {
    for (const s of series) {
      ghostSeries.push({
        name: `${s.name} (proyección)`,
        type: 'line',
        data: years.map((y, i) => [y, s.values[i]]),
        smooth: 0.25,
        symbol: 'none',
        z: 2,
        silent: true,
        lineStyle: {
          width: 1.5,
          color: s.color,
          opacity: 0.35,
          type: 'dashed'
        }
      });
    }
  }

  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      ...TOOLTIP,
      axisPointer: { type: 'line', lineStyle: { color: tokens.muted, type: 'dashed' } },
      formatter: (params: Array<{ seriesName: string; value: [number, number]; color: string }>) => {
        const first = params.find((p) => p.value && Array.isArray(p.value));
        if (!first) return '';
        const yr = Math.round(first.value[0]);
        const valid = params.filter(
          (p) => !p.seriesName.includes('(cabeza)') && !p.seriesName.includes('(proyección)')
        );
        return [
          `<strong>${yr}</strong>`,
          ...valid.map((p) => `${p.seriesName}: ${formatValue(p.value[1], opts.unit)}`)
        ].join('<br/>');
      }
    },
    grid: { left: 8, right: 24, top: 24, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      min: minYear,
      max: maxYear,
      minInterval: 1,
      interval: opts.labelEvery,
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisTick: { show: false },
      axisLabel: { color: tokens.ink2, hideOverlap: true, formatter: (v: number) => String(Math.round(v)) },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      splitLine: { lineStyle: LINE },
      axisLabel: { color: tokens.muted, formatter: (v: number) => formatAxisNumber(v) }
    },
    series: [...ghostSeries, ...seriesData, ...headDots]
  };

  return { option, summary: opts.summary };
}

/** A treemap of shares: every rectangle is a part of the whole, its area its share, styled after the 2D flat view of `test/tree-example.html`. */
export function buildShares(rows: Array<{ label: string; value: number; color?: string }>, opts: { unit: string; summary: string }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, r) => sum + r.value, 0);
  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(13,13,13,0.92)',
      borderColor: tokens.border,
      textStyle: { color: tokens.ink },
      formatter: (p: { name: string; value: number }) => {
        const pct = total > 0 && opts.unit !== '%' ? ` (${((p.value / total) * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %)` : '';
        return `${p.name}<br/>${formatValue(p.value, opts.unit)}${pct}`;
      }
    },
    series: [
      {
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        left: 6,
        right: 6,
        top: 6,
        bottom: 6,
        squareRatio: 1.15,
        itemStyle: { borderColor: tokens.page, borderWidth: 3, gapWidth: 3, borderRadius: 6 },
        label: {
          show: true,
          position: 'inside',
          align: 'center',
          verticalAlign: 'middle',
          color: tokens.ink,
          fontSize: 13,
          formatter: (p: { name: string; value: number }) => {
            if (opts.unit === '%') {
              return `{n|${p.name}}\n{v|${formatValue(p.value, opts.unit)}}`;
            }
            const pct = total > 0 ? `${((p.value / total) * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %` : '';
            return `{n|${p.name}}\n{v|${pct}}\n{s|${formatValue(p.value, opts.unit)}}`;
          },
          rich: {
            n: { fontSize: 13, fontWeight: 700, color: tokens.ink, lineHeight: 17, align: 'center' },
            v: { fontSize: 12, fontWeight: 600, color: tokens.ink, lineHeight: 16, align: 'center' },
            s: { fontSize: 10, color: tokens.ink2, lineHeight: 14, align: 'center' }
          }
        },
        data: sorted.map((r, i) => ({
          name: r.label,
          value: r.value,
          itemStyle: {
            color: r.color ?? tokens.categorical[i % tokens.categorical.length],
            borderColor: 'rgba(255,255,255,0.28)',
            borderWidth: 1
          }
        }))
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
  opts: { unit: string; name: string; summary: string; tip?: { flag: string; rank: number | null } }
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
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: frame.yMax,
      splitLine: { lineStyle: LINE },
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
        itemStyle: { color: tokens.blue, borderColor: tokens.ink, borderWidth: 2, shadowBlur: 14, shadowColor: 'rgba(57,135,229,0.7)' },
        ...(opts.tip
          ? {
              label: {
                show: true,
                position: 'right',
                distance: 8,
                formatter: opts.tip.rank === null ? '{f|}' : `{f|} {r|${opts.tip.rank}}`,
                rich: { f: { width: 22, height: 16, backgroundColor: { image: opts.tip.flag } }, r: { color: tokens.ink, fontSize: 13, fontWeight: 700 } }
              }
            }
          : {})
      }
    ]
  };
  return { option, summary: opts.summary };
}

export interface FollowedLine {
  name: string;
  values: number[];
  color: string;
  /** the line of the home country: thicker */
  main?: boolean;
  /** at the tip of the line: the flag (an image) and the place in the ranking, instead of the name */
  tip?: { flag: string; rank: number | null };
}

/**
 * Several lines as they are while the animation follows them (the countries of slide 1): each one drawn up to `frame.year` with a dot at its
 * head, on a linear or, when `log` is on, a logarithmic scale whose floor is the power of ten under the smallest value.
 */
export function buildFollowedLines(
  years: number[],
  lines: FollowedLine[],
  frame: { year: number; xMin: number; xMax: number; yMax: number; visibleCount: number },
  opts: { unit: string; summary: string; log?: boolean; growth?: { name: string; values: Array<number | null>; color: string } }
) {
  const positives = lines.flatMap((l) => l.values).filter((v) => v > 0);
  const logMin = positives.length ? 10 ** Math.floor(Math.log10(Math.min(...positives))) : 1;
  const next = years[frame.visibleCount];
  const drawn = (l: FollowedLine): Array<[number, number]> => {
    const pts: Array<[number, number]> = years.slice(0, frame.visibleCount).map((y, i) => [y, l.values[i]!]);
    const last = pts.at(-1);
    const nextValue = l.values[frame.visibleCount];
    if (last && next !== undefined && nextValue !== undefined && frame.year > last[0]) {
      const t = (frame.year - last[0]) / (next - last[0]);
      pts.push([frame.year, last[1] + (nextValue - last[1]) * t]);
    }
    return pts;
  };
  // the growth line (a rate in %) has its own axis at the right, from the lowest to the highest rate of the whole period so the axis does not move
  const g = opts.growth;
  const rates = g ? g.values.filter((v): v is number => v !== null) : [];
  const growthMin = rates.length ? Math.floor(Math.min(...rates)) : 0;
  const growthMax = rates.length ? Math.ceil(Math.max(...rates)) : 1;
  const growthSeries = g
    ? (() => {
        const pts: Array<[number, number | null]> = years.slice(0, frame.visibleCount).map((y, i) => [y, g.values[i] ?? null]);
        const last = pts.at(-1);
        const nextValue = g.values[frame.visibleCount];
        if (last && last[1] !== null && next !== undefined && nextValue !== undefined && nextValue !== null && frame.year > last[0]) {
          const t = (frame.year - last[0]) / (next - last[0]);
          pts.push([frame.year, last[1] + (nextValue - last[1]) * t]);
        }
        const head = [...pts].reverse().find((p) => p[1] !== null);
        return [
          {
            name: g.name,
            type: 'line',
            yAxisIndex: 1,
            data: pts,
            symbol: 'none',
            connectNulls: false,
            z: 2,
            lineStyle: { width: 1.5, color: g.color, type: 'dashed', opacity: 0.65 },
            itemStyle: { color: g.color }
          },
          {
            name: `${g.name} hoy`,
            type: 'line',
            yAxisIndex: 1,
            data: head ? [head] : [],
            symbol: 'circle',
            symbolSize: 7,
            z: 5,
            silent: true,
            lineStyle: { opacity: 0 },
            itemStyle: { color: g.color, borderColor: tokens.ink, borderWidth: 1 },
            label: {
              show: head !== undefined,
              position: 'right',
              distance: 8,
              formatter: head ? `Región ${new Intl.NumberFormat(APP_LOCALE, { maximumFractionDigits: 1 }).format(head[1] as number)} %` : '',
              color: g.color,
              fontSize: 12,
              fontWeight: 700
            }
          }
        ];
      })()
    : [];
  const series = lines.flatMap((l) => {
    const pts = drawn(l);
    const head = pts.at(-1);
    return [
      {
        name: l.name,
        type: 'line',
        data: pts,
        symbol: 'none',
        z: l.main ? 4 : 3,
        lineStyle: { width: l.main ? 3.5 : 2, color: l.color },
        itemStyle: { color: l.color }
      },
      {
        name: `${l.name} hoy`,
        type: 'line',
        data: head ? [head] : [],
        symbol: 'circle',
        symbolSize: l.main ? 10 : 7,
        z: 5,
        silent: true,
        lineStyle: { opacity: 0 },
        itemStyle: { color: l.color, borderColor: tokens.ink, borderWidth: l.main ? 2 : 1 },
        ...(l.tip
          ? {
              label: {
                show: true,
                position: 'right',
                distance: 8,
                formatter: l.tip.rank === null ? '{f|}' : `{f|} {r|${l.tip.rank}}`,
                rich: {
                  f: { width: 22, height: 16, backgroundColor: { image: l.tip.flag } },
                  r: { color: tokens.ink, fontSize: 13, fontWeight: 700 }
                }
              }
            }
          : {})
      }
    ];
  });
  const levelAxis = {
    type: opts.log ? 'log' : 'value',
    min: opts.log ? logMin : 0,
    max: frame.yMax,
    splitLine: { lineStyle: LINE },
    axisLabel: { color: tokens.muted, formatter: (v: number) => formatAxisNumber(v) }
  };
  // with the growth line: a second axis at the right in %, in the color of that line, without grid lines
  const yAxes = g
    ? [
        levelAxis,
        {
          type: 'value',
          position: 'right',
          min: growthMin,
          max: growthMax,
          splitLine: { show: false },
          axisLabel: { color: g.color, formatter: (v: number) => `${v} %` }
        }
      ]
    : levelAxis;
  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: { show: false },
    // room above the lines for the counter of the year and the flags that sit over the chart
    grid: { left: 8, right: g ? 86 : 36, top: 92, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      min: frame.xMin,
      max: frame.xMax,
      minInterval: 1,
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisTick: { show: false },
      axisLabel: { color: tokens.muted, formatter: (v: number) => String(Math.round(v)) },
      splitLine: { show: false }
    },
    yAxis: yAxes,
    series: [...series, ...growthSeries]
  };
  return { option, summary: opts.summary };
}
