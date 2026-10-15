import { formatAxisNumber, formatNumber } from '../charts/format.js';
import { tokens } from '../styles/tokens.js';
import { START_YEAR, compoundPath, doublingMarks, errorCurve } from './rule70Model.js';
import { doublingTimeExact } from '../core/doubling.js';
import { INDICATOR_LABEL, INDICATOR_UNIT, ROLLING_WINDOW } from './rule70Countries.js';
import type { Analysis } from './rule70Countries.js';

export type Scale = 'linear' | 'log';

const TOOLTIP = { trigger: 'axis', backgroundColor: 'rgba(13,13,13,0.92)', borderColor: tokens.border, textStyle: { color: tokens.ink } };
const GRID = { left: 8, right: 24, top: 24, bottom: 8, containLabel: true };
const LINE = { color: tokens.grid };

const es = (v: number, digits = 1): string => formatNumber(v, digits);

/**
 * The compound growth of a level at a constant rate, from 1 (the level of 2026) over the horizon. On the log axis (base 2, so every
 * gridline is a doubling) constant growth is a straight line. The horizontal lines mark x2, x4, x8... the doublings.
 */
export function growthChart(ratePct: number, horizonYears: number, scale: Scale) {
  const { years, values } = compoundPath(ratePct, horizonYears);
  const labels = years.map((t) => String(START_YEAR + t));
  const top = values[values.length - 1] ?? 1;
  const levels: number[] = [];
  for (let m = 2; m <= top; m *= 2) levels.push(m);
  const exact = doublingTimeExact(ratePct);
  const summary =
    `Crecimiento de un nivel que aumenta ${es(ratePct)} % por año, de ${START_YEAR} a ${START_YEAR + horizonYears}, en escala ${scale === 'log' ? 'logarítmica' : 'lineal'}: ` +
    `sube de 1 a ${es(top, 2)} veces el nivel de ${START_YEAR}` +
    (Number.isFinite(exact) ? `, y se duplica cada ${es(exact)} años` : '');
  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: { ...TOOLTIP, formatter: (p: Array<{ dataIndex: number }>) => `<strong>${labels[p[0]!.dataIndex]}</strong><br/>${es(values[p[0]!.dataIndex]!, 2)} veces el nivel de ${START_YEAR}` },
    grid: GRID,
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisTick: { show: false },
      axisLabel: { color: tokens.ink2, interval: Math.max(0, Math.floor(horizonYears / 6) - 1) }
    },
    yAxis:
      scale === 'log'
        ? { type: 'log', logBase: 2, min: 1, splitLine: { lineStyle: LINE }, axisLabel: { color: tokens.muted, formatter: (v: number) => `×${es(v, 0)}` } }
        : { type: 'value', min: 1, splitLine: { lineStyle: LINE }, axisLabel: { color: tokens.muted, formatter: (v: number) => `×${es(v, 0)}` } },
    series: [
      {
        name: 'Nivel',
        type: 'line',
        data: values,
        symbol: 'none',
        smooth: false,
        lineStyle: { width: 3, color: tokens.blue },
        itemStyle: { color: tokens.blue },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: tokens.muted, type: 'dashed' },
          label: { color: tokens.ink2, formatter: (p: { value: number }) => `×${es(p.value, 0)}` },
          data: levels.map((yAxis) => ({ yAxis }))
        }
      }
    ]
  };
  return { option, summary, marks: doublingMarks(ratePct, horizonYears), values, labels };
}

/** The error of the rules of 70 and 72 against the exact time, in percent, for rates from 0.1 % to 20 %. */
export function errorChart() {
  const { rates, error70, error72 } = errorCurve();
  const labels = rates.map((r) => formatNumber(r, 1));
  const whole = (label: string): boolean => /,0$/.test(label);
  const summary =
    `Error de la regla del 70 y de la regla del 72 contra el tiempo exacto de duplicación, en porcentaje, para tasas de 0,1 % a 20 %: ` +
    `con tasas muy bajas la regla del 70 se pasa ${es(error70[0]!)} % y la del 72 ${es(error72[0]!)} %; a 8 % la del 72 se equivoca ${es(error72[rates.indexOf(8)]!, 2)} %`;
  const line = (name: string, data: number[], color: string) => ({
    name,
    type: 'line',
    data,
    symbol: 'none',
    smooth: false,
    lineStyle: { width: 3, color },
    itemStyle: { color }
  });
  const option = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      ...TOOLTIP,
      formatter: (p: Array<{ dataIndex: number }>) => {
        const i = p[0]!.dataIndex;
        return `<strong>${labels[i]} % por año</strong><br/>Regla del 70: ${es(error70[i]!, 2)} %<br/>Regla del 72: ${es(error72[i]!, 2)} %`;
      }
    },
    grid: GRID,
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisTick: { show: false },
      axisLabel: { color: tokens.ink2, interval: 0, formatter: (v: string) => (whole(v) && Number(v.replace(',', '.')) % 2 === 0 ? v : '') }
    },
    yAxis: { type: 'value', splitLine: { lineStyle: LINE }, axisLabel: { color: tokens.muted, formatter: (v: number) => `${es(v, 0)} %` } },
    series: [
      { ...line('Regla del 70', error70, tokens.scenario.pessimistic), markLine: { silent: true, symbol: 'none', lineStyle: { color: tokens.muted }, label: { show: false }, data: [{ yAxis: 0 }] } },
      line('Regla del 72', error72, tokens.blue)
    ]
  };
  return { option, summary, labels, error70, error72 };
}

const BASE = { animation: false, backgroundColor: 'transparent' };

const lineSeries = (name: string, data: Array<number | null>, color: string, style: 'solid' | 'dashed' | 'dotted', width = 2) => ({
  name,
  type: 'line',
  data,
  symbol: 'none',
  smooth: false,
  connectNulls: false,
  lineStyle: { width, color, type: style },
  itemStyle: { color }
});

/** The real series of a country against the path of a constant rate between the endpoints and the line fitted on every year. */
export function countryChart(a: Analysis, scale: Scale) {
  const labels = a.points.map((p) => String(p.year));
  const actual = a.points.map((p) => p.actual);
  const constant = a.points.map((p) => p.constant);
  const fitted = a.points.map((p) => Math.exp(a.fit.intercept + a.fit.slope * p.year));
  const unit = INDICATOR_UNIT[a.indicator];
  const summary =
    `${a.name}, ${INDICATOR_LABEL[a.indicator].toLowerCase()} (${unit}) de ${a.from} a ${a.to}, en escala ${scale === 'log' ? 'logarítmica' : 'lineal'}: ` +
    `va de ${es(a.v0)} a ${es(a.v1)}, ${es(a.cagrPct, 2)} % por año entre los extremos; la línea punteada es una tasa constante y la de trazos el ajuste de todos los años`;
  const axisLabel = { color: tokens.muted, formatter: (v: number) => formatAxisNumber(v) };
  const option = {
    ...BASE,
    tooltip: {
      ...TOOLTIP,
      formatter: (p: Array<{ dataIndex: number }>) => {
        const i = p[0]!.dataIndex;
        return `<strong>${labels[i]}</strong><br/>Real: ${actual[i] === null ? 'sin dato' : es(actual[i]!)}<br/>Tasa constante: ${es(constant[i]!)}<br/>Ajuste: ${es(fitted[i]!)}`;
      }
    },
    grid: GRID,
    xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine: { lineStyle: { color: tokens.baseline } }, axisTick: { show: false }, axisLabel: { color: tokens.ink2, interval: Math.max(0, Math.floor(labels.length / 7) - 1) } },
    yAxis: scale === 'log' ? { type: 'log', splitLine: { lineStyle: LINE }, axisLabel } : { type: 'value', splitLine: { lineStyle: LINE }, axisLabel },
    series: [lineSeries('Real', actual, tokens.blue, 'solid', 3), lineSeries('Tasa constante entre los extremos', constant, tokens.muted, 'dotted'), lineSeries('Ajuste de todos los años', fitted, tokens.scenario.optimistic, 'dashed')]
  };
  return { option, summary, labels, actual, constant, fitted };
}

/** The doubling time implied by the rate of each window of ROLLING_WINDOW years, ending in each year. */
export function rollingChart(a: Analysis) {
  const labels = a.rolling.map((r) => String(r.year));
  const values = a.rolling.map((r) => (Number.isFinite(r.doublingYears) ? r.doublingYears : null));
  const finite = values.filter((v): v is number => v !== null);
  const summary =
    `${a.name}: tiempo de duplicación implícito en ventanas móviles de ${ROLLING_WINDOW} años, ${a.rolling[0]?.year ?? a.from} a ${a.to}` +
    (finite.length ? `, de ${es(Math.min(...finite))} a ${es(Math.max(...finite))} años; donde la ventana no creció no hay duplicación` : ', sin ventanas que crezcan');
  const option = {
    ...BASE,
    tooltip: {
      ...TOOLTIP,
      formatter: (p: Array<{ dataIndex: number }>) => {
        const i = p[0]!.dataIndex;
        return `<strong>${labels[i]}</strong><br/>${values[i] === null ? 'No se duplica' : `Se duplica cada ${es(values[i]!)} años`} (${es(a.rolling[i]!.ratePct, 2)} % por año)`;
      }
    },
    grid: GRID,
    xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine: { lineStyle: { color: tokens.baseline } }, axisTick: { show: false }, axisLabel: { color: tokens.ink2, interval: Math.max(0, Math.floor(labels.length / 7) - 1) } },
    yAxis: { type: 'value', min: 0, splitLine: { lineStyle: LINE }, axisLabel: { color: tokens.muted, formatter: (v: number) => `${es(v, 0)} años` } },
    series: [lineSeries('Años para duplicarse', values, tokens.blue, 'solid', 3)]
  };
  return { option, summary, labels, values };
}
