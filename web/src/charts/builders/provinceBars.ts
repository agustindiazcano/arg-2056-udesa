import { tokens } from '../../styles/tokens.js';
import { formatValue, formatAxisNumber } from '../format.js';
import { PROVINCES } from '../../types/province.js';
import type { ProvinceId, ResourceProductionRecord } from '../../types/index.js';

interface ProvinceBarsOpts {
  resource: string;
  year: number;
  topN?: number;
  /** The selected province: it keeps the blue, the others turn muted, and it stays on the chart outside the top N. */
  highlight?: ProvinceId | null;
}

export function buildProvinceBars(records: ResourceProductionRecord[], opts: ProvinceBarsOpts) {
  const { resource, year, topN = 10, highlight = null } = opts;
  
  let excluded = 0;
  
  // Filter for matching resource, year, and not AR
  const filtered = records.filter(r => {
    if (r.resource !== resource || r.year !== year || r.geo === 'AR') return false;
    if (r.value === null || r.value === undefined) {
      excluded++;
      return false;
    }
    return true;
  });

  // Sort descending
  filtered.sort((a, b) => (b.value || 0) - (a.value || 0));

  // Determine unit
  const unit = filtered.length > 0 && filtered[0] ? (filtered[0].unit || '') : '';

  // Get top N
  const top = filtered.slice(0, topN);
  let rest = filtered.slice(topN);
  const picked = highlight ? rest.find((r) => r.geo === highlight) : undefined;
  if (picked) {
    top.push(picked);
    rest = rest.filter((r) => r !== picked);
  }

  const seriesData: { name: string; value: number; isOther: boolean; geo?: string }[] = top.map(r => {
    const prov = PROVINCES.find(p => p.id === r.geo);
    return {
      name: prov ? prov.name : r.geo,
      value: r.value as number,
      isOther: false,
      geo: r.geo
    };
  });

  if (rest.length > 0) {
    const restSum = rest.reduce((sum, r) => sum + (r.value || 0), 0);
    seriesData.push({
      name: 'Otras',
      value: restSum,
      isOther: true
    });
  }

  // ECharts renders from bottom up for horizontal bars (yAxis type category),
  // so we reverse the array to have the largest at the top.
  seriesData.reverse();

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: Record<string, unknown>[]) => {
        const pList = params as { name: string; value: number }[];
        const p = pList[0];
        if (!p) return '';
        return `<strong>${p.name}</strong><br/>${formatValue(p.value, unit)}`;
      }
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '2%',
      top: '2%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      splitLine: {
        lineStyle: { color: tokens.grid, width: 1 }
      },
      axisLabel: { color: tokens.muted, formatter: (v: number) => formatAxisNumber(v) }
    },
    yAxis: {
      type: 'category',
      data: seriesData.map(d => d.name),
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisTick: { show: false },
      axisLabel: { color: tokens.muted }
    },
    series: [
      {
        type: 'bar',
        data: seriesData.map(d => ({
          value: d.value,
          itemStyle: {
            color: d.isOther || (highlight !== null && d.geo !== highlight) ? tokens.muted : tokens.blue,
            borderRadius: [0, 4, 4, 0] // 4px rounded data end (top-right, bottom-right)
          }
        })),
        barWidth: 16,
        itemStyle: {
          borderColor: tokens.surface,
          borderWidth: 1
        },
        label: {
          show: false // labels only on the selected mark and the extremes? The brief says: "labels only on the selected mark and the extremes". For now we'll just show tooltip, maybe wait on label logic.
        }
      }
    ]
  };

  let summary = 'Sin datos para este recurso y año.';
  if (seriesData.length > 0) {
    // Note: seriesData is reversed, so the largest is at the end (top bar)
    const largest = seriesData[seriesData.length - 1]! || { name: "", value: 0 };
    summary = `Gráfico de barras de producción por provincia. La mayor es ${largest.name} con ${formatValue(largest.value, unit)}.`;
  }

  return { option, excluded, summary };
}
