import type { Era } from '../../content/eras.js';
import type { LongRunView } from '../../scenes/economy/selectors.js';
import { tokens } from '../../styles/tokens.js';
import { formatValue } from '../format.js';

interface LongRunOpts {
  highlight: string;
  year: number;
  eras: readonly Era[];
  hovered: string | null;
  indicatorLabel: string;
}

/** Opacity of the era bands (the grid token at low opacity). */
export const ERA_OPACITY = 0.4;

const HIGHLIGHT_WIDTH = 3;
const HOVERED_WIDTH = 2;
const PEER_WIDTH = 1;

export function buildLongRun(view: LongRunView, opts: LongRunOpts) {
  const { highlight, year, eras, hovered, indicatorLabel } = opts;
  const categories = view.years.map(String);
  const first = view.years[0];
  const last = view.years[view.years.length - 1];

  let excluded = 0;
  const lines = view.series.map((s) => {
    const isHome = s.country === highlight;
    const isHovered = !isHome && s.country === hovered;
    const color = isHome ? tokens.ink : isHovered ? tokens.ink2 : tokens.muted;
    const width = isHome ? HIGHLIGHT_WIDTH : isHovered ? HOVERED_WIDTH : PEER_WIDTH;
    const data = s.points.map((p) => p.value);
    excluded += data.filter((v) => v === null).length;
    return {
      isHome,
      line: {
        name: s.country,
        type: 'line',
        data,
        connectNulls: false,
        symbol: 'none',
        lineStyle: { color, width },
        itemStyle: { color },
        endLabel: { show: true, color, formatter: s.country }
      }
    };
  });
  // the home country is drawn last, on top of the peers
  const ordered = [...lines.filter((l) => !l.isHome), ...lines.filter((l) => l.isHome)].map((l) => l.line);

  const bands =
    first === undefined || last === undefined
      ? []
      : eras
          .filter((e) => e.endYear >= first && e.startYear <= last)
          .map((e) => [
            { name: e.label, xAxis: String(Math.max(e.startYear, first)) },
            { xAxis: String(Math.min(e.endYear, last)) }
          ]);

  const markers = {
    name: 'markers',
    type: 'line',
    data: [],
    symbol: 'none',
    silent: true,
    markLine: {
      symbol: 'none',
      animation: false,
      data: view.years.includes(year)
        ? [
            {
              xAxis: String(year),
              name: `Year ${year}`,
              lineStyle: { color: tokens.ink2, width: 1, type: 'solid' },
              label: { formatter: `Year ${year}`, color: tokens.ink2 }
            }
          ]
        : []
    },
    ...(bands.length > 0
      ? {
          markArea: {
            silent: true,
            itemStyle: { color: tokens.grid, opacity: ERA_OPACITY },
            label: { position: 'insideTop', color: tokens.muted },
            data: bands
          }
        }
      : {})
  };

  const option = {
    animation: false,
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ dataIndex: number }>) => {
        const index = params[0]?.dataIndex;
        const label = index === undefined ? undefined : categories[index];
        if (index === undefined || label === undefined) return '';
        const rows = view.series.map((s) => {
          const value = s.points[index]?.value ?? null;
          return `${s.country}: ${value === null ? 'No data' : formatValue(value, view.unit)}`;
        });
        return [label, ...rows].join('<br/>');
      }
    },
    grid: { left: '2%', right: '8%', bottom: '2%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false,
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisLabel: { color: tokens.muted },
      axisTick: { lineStyle: { color: tokens.baseline } }
    },
    yAxis: {
      type: 'value',
      name: view.mode === 'index' ? `Index (base year = ${view.baseYear})` : view.unit,
      nameTextStyle: { color: tokens.muted },
      splitLine: { lineStyle: { color: tokens.grid, width: 1 } },
      axisLabel: { color: tokens.muted }
    },
    series: [...ordered, markers]
  };

  const home = view.series.find((s) => s.country === highlight);
  const known = home?.points.filter((p) => p.value !== null) ?? [];
  let summary = `No ${indicatorLabel} data for ${highlight}.`;
  if (known.length > 0) {
    const a = known[0]!;
    const b = known[known.length - 1]!;
    const label =
      view.mode === 'index' ? `${indicatorLabel} (index, base year ${view.baseYear} = 100)` : indicatorLabel;
    const peers = view.series.length - 1;
    summary =
      `${highlight} ${label}: ${formatValue(a.value, view.unit)} in ${a.year} to ` +
      `${formatValue(b.value, view.unit)} in ${b.year}, compared with ${peers} ${peers === 1 ? 'peer' : 'peers'}`;
  }

  return { option, excluded, summary };
}
