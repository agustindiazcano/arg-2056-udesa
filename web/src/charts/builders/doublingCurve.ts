import { doublingYears, rule70, rule70ErrorPct } from '../../scenes/sandbox/arithmetic.js';
import { tokens } from '../../styles/tokens.js';
import { formatDecimal, formatNumber, formatPercent } from '../format.js';

interface DoublingCurveOpts {
  ratePct: number;
}

const MIN_RATE = 0.5;
const MAX_RATE = 12;
const STEP = 0.5;

/** The growth rates plotted by the curve and listed in its table view. */
export const DOUBLING_RATES = Array.from({ length: Math.round((MAX_RATE - MIN_RATE) / STEP) + 1 }, (_, i) => MIN_RATE + i * STEP);

export function buildDoublingCurve(opts: DoublingCurveOpts) {
  const { ratePct } = opts;

  const exact = {
    name: 'exacto',
    type: 'line',
    data: DOUBLING_RATES.map((r) => [r, doublingYears(r)]),
    symbol: 'none',
    lineStyle: { color: tokens.ink, width: 2 },
    itemStyle: { color: tokens.ink },
    endLabel: { show: true, color: tokens.ink, formatter: 'exacto' }
  };
  const approximate = {
    name: 'regla del 70',
    type: 'line',
    data: DOUBLING_RATES.map((r) => [r, rule70(r)]),
    symbol: 'none',
    lineStyle: { color: tokens.muted, width: 1, type: 'dashed' },
    itemStyle: { color: tokens.muted },
    endLabel: { show: true, color: tokens.muted, formatter: 'regla del 70' }
  };
  const inside = ratePct >= MIN_RATE && ratePct <= MAX_RATE;
  const markers = {
    name: 'markers',
    type: 'line',
    data: [],
    symbol: 'none',
    silent: true,
    markLine: {
      symbol: 'none',
      animation: false,
      data: inside
        ? [
            {
              xAxis: ratePct,
              name: `${formatDecimal(ratePct)}%`,
              lineStyle: { color: tokens.ink2, width: 1, type: 'solid' },
              label: { formatter: `${formatDecimal(ratePct)}%`, color: tokens.ink2 }
            }
          ]
        : []
    }
  };

  const option = {
    animation: false,
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ value?: [number, number] }>) => {
        const x = params[0]?.value?.[0];
        if (x === undefined) return '';
        const e = doublingYears(x);
        const a = rule70(x);
        return [
          `${formatDecimal(x)}% por año`,
          `exacto: ${e === null ? 'nunca' : `${formatNumber(e, 1)} años`}`,
          `regla del 70: ${a === null ? 'nunca' : `${formatNumber(a, 1)} años`}`
        ].join('<br/>');
      }
    },
    grid: { left: '2%', right: '12%', bottom: '2%', top: '10%', containLabel: true },
    xAxis: {
      type: 'value',
      name: 'Tasa de crecimiento (% por año)',
      min: MIN_RATE,
      max: MAX_RATE,
      nameTextStyle: { color: tokens.muted },
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisLabel: { color: tokens.muted },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: 'Años para duplicar',
      nameTextStyle: { color: tokens.muted },
      splitLine: { lineStyle: { color: tokens.grid, width: 1 } },
      axisLabel: { color: tokens.muted }
    },
    series: [exact, approximate, markers]
  };

  const e = doublingYears(ratePct);
  const a = rule70(ratePct);
  const err = rule70ErrorPct(ratePct);
  const summary =
    e === null || a === null || err === null
      ? `Con una tasa de crecimiento de ${formatPercent(ratePct)} el nivel nunca se duplica`
      : `A ${formatPercent(ratePct)} de crecimiento el tiempo de duplicación exacto es ${formatNumber(e, 1)} años y la regla del 70 da ` +
        `${formatNumber(a, 1)} años (error ${formatPercent(err, { signed: true })})`;

  return { option, excluded: 0, summary };
}
