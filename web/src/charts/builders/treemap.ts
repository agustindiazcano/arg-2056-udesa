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
  const rawGroups = Object.keys(grouped).map(group => {
    const total = grouped[group]!.reduce((sum, r) => sum + (r.value_usd || 0), 0);
    return { group, total, items: grouped[group]! };
  }).sort((a, b) => b.total - a.total);

  let leafIndex = 0;
  const groups = rawGroups.map((g, groupIdx) => {
    // Sort leaves inside group
    const children = g.items.sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0)).map((r, childIdx) => {
      const share = formatPercent(totalValue ? ((r.value_usd || 0) / totalValue) * 100 : 0);
      const isHighlighted = !opts.highlightGroup || opts.highlightGroup === g.group;
      const color = opts.highlightGroup
        ? (isHighlighted ? tokens.blue : tokens.muted)
        : (groupIdx === 1 && childIdx === 0 ? tokens.blue : tokens.categorical[(leafIndex + 1) % tokens.categorical.length]!);
      leafIndex++;
      return {
        name: r.label || r.category,
        value: r.value_usd,
        itemStyle: {
          color,
          borderColor: tokens.surface,
          borderWidth: 2,
          gapWidth: 2,
          borderRadius: 4
        },
        label: {
          show: true,
          position: 'inside',
          align: 'center',
          verticalAlign: 'middle',
          color: tokens.ink,
          fontWeight: 600,
          formatter: `{b}\n${share}`
        }
      };
    });

    return {
      name: g.group,
      value: g.total,
      children,
      itemStyle: {
        borderColor: tokens.surface,
        borderWidth: 2,
        gapWidth: 2,
        borderRadius: 4
      }
    };
  });

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
