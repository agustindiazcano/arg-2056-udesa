import type { ProjectRecord } from '../../types/index.js';
import { PROVINCES } from '../../types/province.js';

export function selectProjectsForTable(records: ProjectRecord[], resource: string) {
  const filtered = records.filter(r => r.resource === resource);
  
  // order by capex_usd descending with null last
  filtered.sort((a, b) => {
    if (a.capex_usd === null && b.capex_usd === null) return 0;
    if (a.capex_usd === null) return 1;
    if (b.capex_usd === null) return -1;
    return b.capex_usd - a.capex_usd;
  });

  return filtered.map(r => {
    const prov = PROVINCES.find(p => p.id === r.geo);
    return {
      name: r.name,
      province: prov ? prov.name : r.geo,
      status: r.status,
      capex_usd: r.capex_usd,
      start_year: r.start_year,
      capacity: r.capacity_per_year,
      capacity_unit: r.capacity_unit
    };
  });
}

export function getAvailableYears(records: { year: number }[]): number[] {
  const years = Array.from(new Set(records.map(r => r.year)));
  years.sort((a, b) => a - b);
  return years;
}

export function clampYear(year: number, available: number[]): number {
  if (available.length === 0) return year;
  if (year < available[0]!) return available[0]!;
  if (year > available[available.length - 1]!) return available[available.length - 1]!;
  
  // Find closest or exact
  let closest = available[0]!;
  let minDiff = Math.abs(year - available[0]!);
  for (const y of available) {
    const diff = Math.abs(year - y);
    if (diff < minDiff || (diff === minDiff && y > closest)) {
      minDiff = diff;
      closest = y;
    }
  }
  return closest;
}
