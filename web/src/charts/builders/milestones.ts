import { tokens } from '../../styles/tokens.js';

export interface Milestone {
  /** the multiple of the first value: 2 for "x2" */
  multiple: number;
  year: number;
  value: number;
}

/** The first year the series reaches `multiple` times its first value, for each multiple it reaches (a series that never gets there has no milestone). */
export function milestones(years: number[], values: Array<number | null>, multiples: readonly number[] = [2, 3, 4]): Milestone[] {
  const base = values.find((v): v is number => v !== null);
  if (base === undefined || base <= 0) return [];
  const out: Milestone[] = [];
  for (const multiple of multiples) {
    const i = values.findIndex((v) => v !== null && v >= base * multiple);
    if (i >= 0) out.push({ multiple, year: years[i]!, value: values[i] as number });
  }
  return out;
}

/** Adds the milestones of some lines to a line chart option: a dot on the line and the label "x2 · 2041". Only the milestones up to `upTo` show. */
export function addMilestones(option: object, years: number[], lines: Array<{ values: Array<number | null>; color: string }>, upTo = Infinity): object {
  const dots = lines.map((line) => ({
    type: 'scatter',
    silent: true,
    z: 6,
    symbolSize: 11,
    itemStyle: { color: line.color, borderColor: tokens.ink, borderWidth: 2 },
    data: milestones(years, line.values)
      .filter((m) => m.year <= upTo)
      .map((m) => ({
        value: [String(m.year), m.value],
        label: { show: true, position: 'top', color: tokens.ink, fontSize: 12, fontWeight: 600, formatter: `x${m.multiple} · ${m.year}` }
      }))
  }));
  const o = option as { series: object[] };
  return { ...o, series: [...o.series, ...dots] };
}
