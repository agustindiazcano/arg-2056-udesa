export interface Milestone {
  /** the multiple of the first value: 2 for "x2" */
  multiple: number;
  year: number;
  value: number;
}

/** The first year the series reaches `multiple` times its first value, for each multiple it reaches (a series that never gets there has no milestone). */
export function milestones(years: number[], values: Array<number | null>, multiples: readonly number[] = [2, 3, 4], baseValue?: number | null): Milestone[] {
  const base = baseValue != null ? baseValue : values.find((v): v is number => v !== null);
  if (base === undefined || base <= 0) return [];
  const out: Milestone[] = [];
  for (const multiple of multiples) {
    const i = values.findIndex((v) => v !== null && v >= base * multiple);
    if (i >= 0) out.push({ multiple, year: years[i]!, value: values[i] as number });
  }
  return out;
}

/** Adds the milestones of some lines to a line chart option: a dot on the line and the label "x2 · 2041". Only the milestones up to `upTo` show. */
export function addMilestones(option: object, years: number[], lines: Array<{ values: Array<number | null>; color: string }>, upTo = Infinity, baseValue?: number | null): object {
  const isCategory = (option as { xAxis?: { type?: string } })?.xAxis?.type === 'category';
  const dots = lines.map((line) => ({
    type: 'effectScatter',
    silent: true,
    rippleEffect: { scale: 2.5, period: 3, brushType: 'stroke', color: line.color },
    showEffectOn: 'render',
    z: 6,
    symbolSize: 8,
    itemStyle: { color: line.color, borderColor: '#ffffff', borderWidth: 2 },
    data: milestones(years, line.values, [2, 3, 4], baseValue)
      .filter((m) => m.year <= upTo)
      .map((m) => ({
        value: [isCategory ? String(m.year) : m.year, m.value],
        label: {
          show: true,
          position: 'top',
          distance: 6,
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: 'rgba(13,13,13,0.92)',
          padding: [2, 6],
          borderRadius: 4,
          borderColor: 'rgba(255,255,255,0.15)',
          borderWidth: 1,
          formatter: `x${m.multiple} · ${m.year}`
        }
      }))
  }));
  const o = option as { series: object[] };
  return { ...o, series: [...o.series, ...dots] };
}
