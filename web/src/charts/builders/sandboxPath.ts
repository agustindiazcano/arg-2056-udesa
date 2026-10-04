import { positionLabel } from '../../content/labels.js';
import { positionVsRange, summaryText } from '../../scenes/sandbox/selectors.js';
import type { PathView } from '../../scenes/sandbox/selectors.js';
import { BAND_ALPHA, tokens } from '../../styles/tokens.js';
import { formatValue, formatAxisNumber } from '../format.js';

interface SandboxPathOpts {
  year: number;
  effectivePct: number;
}

const RANGE_LABEL = 'rango del modelo (todos los escenarios, p10 a p90)';
const VISITOR_LABEL = 'supuestos elegidos';
const EXPECTED_LABEL = 'modelo, esperado';

export function buildSandboxPath(view: PathView, opts: SandboxPathOpts) {
  const { year, effectivePct } = opts;
  const categories = view.years.map(String);

  const span = view.lower.map((lo, i) => {
    const hi = view.upper[i] ?? null;
    return lo === null || hi === null ? null : hi - lo;
  });
  const excluded = view.lower.filter((lo, i) => lo === null || view.upper[i] === null).length;

  const bandBase = {
    name: 'range low',
    type: 'line',
    stack: 'band',
    data: view.lower,
    connectNulls: false,
    symbol: 'none',
    lineStyle: { opacity: 0 },
    tooltip: { show: false }
  };
  const bandSpan = {
    name: RANGE_LABEL,
    type: 'line',
    stack: 'band',
    data: span,
    connectNulls: false,
    symbol: 'none',
    lineStyle: { opacity: 0 },
    areaStyle: { color: tokens.blue, opacity: BAND_ALPHA },
    endLabel: { show: true, color: tokens.blue, formatter: RANGE_LABEL },
    tooltip: { show: false }
  };
  const expected = {
    name: EXPECTED_LABEL,
    type: 'line',
    data: view.expected,
    connectNulls: false,
    symbol: 'none',
    lineStyle: { color: tokens.muted, width: 1, type: 'dashed' },
    itemStyle: { color: tokens.muted },
    endLabel: { show: true, color: tokens.muted, formatter: EXPECTED_LABEL }
  };
  const visitor = {
    name: VISITOR_LABEL,
    type: 'line',
    data: view.visitor,
    connectNulls: false,
    symbol: 'none',
    lineStyle: { color: tokens.ink, width: 3 },
    itemStyle: { color: tokens.ink },
    endLabel: { show: true, color: tokens.ink, formatter: VISITOR_LABEL }
  };
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
              name: `Año ${year}`,
              lineStyle: { color: tokens.ink2, width: 1, type: 'solid' },
              label: { formatter: `Año ${year}`, color: tokens.ink2 }
            }
          ]
        : []
    }
  };

  const option = {
    animation: false,
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ dataIndex?: number }>) => {
        const i = params[0]?.dataIndex;
        const y = i === undefined ? undefined : view.years[i];
        if (i === undefined || y === undefined) return '';
        const value = view.visitor[i] ?? null;
        const lo = view.lower[i] ?? null;
        const hi = view.upper[i] ?? null;
        const position = positionVsRange(value, lo, hi);
        return [
          String(y),
          `Supuestos elegidos: ${value === null ? 'Sin datos' : formatValue(value, view.unit)}`,
          `Rango del modelo: ${lo === null || hi === null ? 'sin datos' : `${formatValue(lo, view.unit)} a ${formatValue(hi, view.unit)}`}`,
          `Posición: ${position ? positionLabel(position).toLowerCase() : 'sin datos'}`
        ].join('<br/>');
      }
    },
    grid: { left: '2%', right: '16%', bottom: '2%', top: '10%', containLabel: true },
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
      name: view.unit,
      nameTextStyle: { color: tokens.muted },
      splitLine: { lineStyle: { color: tokens.grid, width: 1 } },
      axisLabel: { color: tokens.muted, formatter: (v: number) => formatAxisNumber(v) }
    },
    series: [bandBase, bandSpan, expected, visitor, markers]
  };

  let summary = 'Sin trayectoria para mostrar.';
  const last = view.years.length - 1;
  const first = view.visitor[0];
  const end = view.visitor[last];
  if (last >= 0 && first !== undefined && end !== undefined && first > 0) {
    summary = summaryText({
      effectivePct,
      firstYear: view.years[0]!,
      lastYear: view.years[last]!,
      multiple: end / first,
      position: positionVsRange(end, view.lower[last] ?? null, view.upper[last] ?? null)
    });
  }

  return { option, excluded, summary };
}
