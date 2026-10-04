import { tokens } from '../../styles/tokens.js';
import { formatValue, formatAxisNumber } from '../format.js';
import type { ResourceProductionRecord } from '../../types/index.js';

interface TrendOpts {
  resource: string;
  geo?: string;
}

export function buildTrend(records: ResourceProductionRecord[], opts: TrendOpts) {
  const { resource, geo = 'AR' } = opts;
  
  const excluded = 0; // null is kept, but what does the spec say?
  // Spec: "a null value stays null in the data (a gap) and the series has connectNulls: false; never converted to 0"
  
  const filtered = records.filter(r => r.resource === resource && r.geo === geo);
  filtered.sort((a, b) => a.year - b.year);
  
  const unit = filtered.length > 0 && filtered[0] ? (filtered[0].unit || '') : '';
  
  const years = filtered.map(r => r.year.toString());
  const values = filtered.map(r => r.value); // null is kept

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Record<string, unknown>[]) => {
        const pList = params as { name: string; value: number | null }[];
        const p = pList[0];
        if (!p) return "";
        if (p.value === null || p.value === undefined) return `${p.name}: Sin datos`;
        return `${p.name}: ${formatValue(p.value, unit)}`;
      }
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '2%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLine: { lineStyle: { color: tokens.baseline } },
      axisLabel: { color: tokens.muted },
      axisTick: { lineStyle: { color: tokens.baseline } }
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: { color: tokens.muted },
      splitLine: {
        lineStyle: { color: tokens.grid, width: 1 }
      },
      axisLabel: { color: tokens.muted, formatter: (v: number) => formatAxisNumber(v) }
    },
    series: [
      {
        type: 'line',
        data: values,
        connectNulls: false,
        lineStyle: { color: tokens.blue, width: 2 },
        itemStyle: { color: tokens.blue },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  };

  let summary = 'Sin datos de tendencia.';
  if (values.length > 0) {
    const validValues = values.filter(v => v !== null) as number[];
    if (validValues.length > 0) {
      summary = `Gráfico de líneas de la tendencia de producción de ${years[0]} a ${years[years.length - 1]}.`;
    }
  }

  return { option, excluded, summary };
}
