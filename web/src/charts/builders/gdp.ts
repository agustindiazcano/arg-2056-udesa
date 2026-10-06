import type { GdpData } from '../../tour/gdpMock.js';
import { LAST_OBSERVED_YEAR } from '../../tour/gdpMock.js';
import { tokens } from '../../styles/tokens.js';
import { formatAxisNumber, formatValue } from '../format.js';

const HISTORY = 'PBI observado';
const EXPECTED = 'Proyección esperada';
const RANGE = 'Rango';

/** A vertical fade of one color (a hex without alpha), for the area under a line. */
function fade(color: string, from: string, to: string) {
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: `${color}${from}` },
      { offset: 1, color: `${color}${to}` }
    ]
  };
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** The 2D chart of the GDP: the observed line with a glowing area, the projection dashed, and its range as a soft band. */
export function buildGdp(data: GdpData) {
  const categories = data.years.map(String);
  const first = data.years[0];
  const last = data.years[data.years.length - 1];
  const firstObserved = data.history.find((v) => v !== null) ?? null;
  const lastObserved = data.history[data.years.indexOf(LAST_OBSERVED_YEAR)] ?? null;
  const end = data.expected[data.expected.length - 1] ?? null;
  const rangeStart = data.years.indexOf(LAST_OBSERVED_YEAR);

  // the range is two stacked lines: an invisible floor and a translucent band on top of it
  const floor = data.low.map((v, i) => (i < rangeStart ? null : v));
  const band = data.high.map((v, i) => (i < rangeStart ? null : round1(v - (data.low[i] ?? v))));
  const stacked = (name: string, values: Array<number | null>, area: boolean) => ({
    name,
    type: 'line',
    data: values,
    stack: 'range',
    symbol: 'none',
    silent: true,
    lineStyle: { opacity: 0 },
    ...(area ? { areaStyle: { color: tokens.blue, opacity: 0.16 } } : {}),
    z: 1
  });

  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(13,13,13,0.92)',
      borderColor: tokens.border,
      textStyle: { color: tokens.ink },
      axisPointer: { type: 'line', lineStyle: { color: tokens.muted, type: 'dashed' } },
      formatter: (params: Array<{ dataIndex: number }>) => {
        const i = params[0]?.dataIndex;
        if (i === undefined) return '';
        const observed = data.history[i] ?? null;
        const value = observed ?? data.expected[i] ?? null;
        const lines = [`<strong>${categories[i]}</strong>`, `${formatValue(value, data.unit)} (${observed === null ? 'proyección esperada' : 'observado'})`];
        if (observed === null) lines.push(`Rango: ${formatValue(data.low[i], '')}a ${formatValue(data.high[i], data.unit)}`);
        return lines.join('<br/>');
      }
    },
    grid: { left: 8, right: 24, top: 24, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false,
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisTick: { show: false },
      axisLabel: { color: tokens.muted, interval: 4 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: tokens.grid, type: 'dashed' } },
      axisLabel: { color: tokens.muted, formatter: (v: number) => formatAxisNumber(v) }
    },
    series: [
      stacked(RANGE, floor, false),
      stacked(`${RANGE} (banda)`, band, true),
      {
        name: HISTORY,
        type: 'line',
        data: data.history,
        smooth: 0.25,
        symbol: 'none',
        z: 3,
        lineStyle: { width: 3, color: tokens.ink, shadowBlur: 12, shadowColor: 'rgba(255,255,255,0.35)' },
        itemStyle: { color: tokens.ink },
        areaStyle: { color: fade('#ffffff', '40', '00') },
        markLine: {
          symbol: 'none',
          silent: true,
          animation: false,
          lineStyle: { color: tokens.muted, type: 'dotted' },
          label: { color: tokens.muted, formatter: 'Hoy' },
          data: [{ xAxis: String(LAST_OBSERVED_YEAR) }]
        }
      },
      {
        name: EXPECTED,
        type: 'line',
        data: data.expected,
        smooth: 0.25,
        symbol: 'none',
        z: 3,
        lineStyle: { width: 3, color: tokens.blue, type: 'dashed', shadowBlur: 14, shadowColor: 'rgba(57,135,229,0.55)' },
        itemStyle: { color: tokens.blue },
        areaStyle: { color: fade(tokens.blue, '55', '00') }
      }
    ]
  };

  const summary =
    `PBI de la Argentina (datos de prueba): de ${formatValue(firstObserved, data.unit)} en ${first} ` +
    `a ${formatValue(lastObserved, data.unit)} en ${LAST_OBSERVED_YEAR}, y una proyección esperada de ` +
    `${formatValue(end, data.unit)} en ${last}, con un rango que se abre desde ${LAST_OBSERVED_YEAR}`;
  return { option, summary };
}
