import { tokens } from '../../styles/tokens.js';
import { formatPercent, formatValue } from '../format.js';
import type { CompositionRecord } from '../../types/index.js';

interface TreemapOpts {
  highlightGroup?: string;
}

export function buildTreemap(records: CompositionRecord[], opts: TreemapOpts = {}) {
  let excluded = 0;
  const validRecords = records.filter(r => {
    if (r.value_usd === null || r.value_usd === undefined) {
      excluded++;
      return false;
    }
    return true;
  });

  const totalValue = validRecords.reduce((sum, r) => sum + (r.value_usd || 0), 0);

  // Group the records
  const grouped: Record<string, typeof validRecords> = {};
  for (const r of validRecords) {
    if (!grouped[r.group]) { grouped[r.group] = []; }
    grouped[r.group]!.push(r);
  }

  // Calculate group totals and sort groups
  const groups = Object.keys(grouped).map(group => {
    const total = grouped[group]!.reduce((sum, r) => sum + (r.value_usd || 0), 0);
    // Sort leaves inside group
    const children = grouped[group]!.sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0)).map(r => {
      const share = formatPercent(totalValue ? ((r.value_usd || 0) / totalValue) * 100 : 0);
      const isHighlighted = !opts.highlightGroup || opts.highlightGroup === r.group;
      return {
        name: r.label || r.category,
        value: r.value_usd,
        itemStyle: {
          color: isHighlighted ? tokens.blue : tokens.muted,
          borderColor: tokens.surface,
          borderWidth: 2,
          gapWidth: 2
        },
        label: {
          show: true,
          formatter: `{b}\n${share}`
        }
      };
    });

    return {
      name: group,
      value: total,
      children,
      itemStyle: {
        borderColor: tokens.surface,
        borderWidth: 2,
        gapWidth: 2
      }
    };
  });

  groups.sort((a, b) => b.value - a.value);

  const option = {
    tooltip: {
      formatter: (info: { name: string; value: number }) => {
        const val = formatValue(info.value, 'USD');
        return `${info.name}: ${val}`;
      }
    },
    series: [
      {
        type: 'treemap',
        data: groups,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        itemStyle: {
          borderColor: tokens.surface,
          borderWidth: 2,
          gapWidth: 2
        },
        label: {
          show: true
        }
      }
    ]
  };

  let summary = 'Sin datos disponibles.';
  if (groups.length > 0) {
    const largest = groups[0] || { name: "", value: 0 };
    const share = formatPercent(totalValue ? (largest.value / totalValue) * 100 : 0);
    summary = `Mapa de árbol con ${groups.length} grupos. El mayor es ${largest.name} con ${share} del total.`;
  }

  return { option, excluded, summary };
}
