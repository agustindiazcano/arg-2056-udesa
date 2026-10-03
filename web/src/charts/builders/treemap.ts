import { tokens } from '../../styles/tokens.js';
import { formatValue } from '../format.js';
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
      const share = totalValue ? ((r.value_usd || 0) / totalValue * 100).toFixed(1) : '0.0';
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
          formatter: `{b}\n${share}%`
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

  let summary = 'No data available.';
  if (groups.length > 0) {
    const largest = groups[0] || { name: "", value: 0 };
    const share = totalValue ? ((largest.value / totalValue) * 100).toFixed(1) : '0';
    summary = `Treemap showing ${groups.length} groups. The largest is ${largest.name} with ${share}% of the total.`;
  }

  return { option, excluded, summary };
}
