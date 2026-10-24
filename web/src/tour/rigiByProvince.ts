import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import { RIGI_MINING, RIGI_OIL_GAS } from './rigiProjects.js';
import type { RigiProject } from './rigiProjects.js';

export type RigiFilter = 'todos' | 'aprobado' | 'en evaluación';

const ALL: readonly RigiProject[] = [...RIGI_MINING, ...RIGI_OIL_GAS];

/** The ids of the provinces a project names ("Salta y Catamarca" is two), in the order named. */
export function provinceIdsOf(names: string): ProvinceId[] {
  return names
    .split(' y ')
    .map((n) => PROVINCES.find((p) => p.name === n.trim())?.id)
    .filter((id): id is ProvinceId => id !== undefined);
}

const selected = (filter: RigiFilter): RigiProject[] => ALL.filter((p) => filter === 'todos' || p.status === filter);

export interface RigiProvinceRow {
  id: ProvinceId;
  /** projects that touch the province */
  count: number;
  /** investment in million USD; a project that crosses provinces is split equally among them */
  investment: number;
}

/** What the RIGI list puts in each province that has a project. */
export function rigiByProvince(filter: RigiFilter): RigiProvinceRow[] {
  const rows = new Map<ProvinceId, RigiProvinceRow>();
  for (const project of selected(filter)) {
    const ids = provinceIdsOf(project.province);
    for (const id of ids) {
      const row = rows.get(id) ?? { id, count: 0, investment: 0 };
      row.count += 1;
      row.investment += (project.investment ?? 0) / ids.length;
      rows.set(id, row);
    }
  }
  return [...rows.values()];
}

/** The projects of a province, from the largest investment. */
export function rigiProjectsOf(id: ProvinceId, filter: RigiFilter): RigiProject[] {
  return selected(filter)
    .filter((p) => provinceIdsOf(p.province).includes(id))
    .sort((a, b) => (b.investment ?? 0) - (a.investment ?? 0));
}

export function rigiTotals(): { approved: number; evaluating: number; approvedInvestment: number; provinces: number } {
  const approved = ALL.filter((p) => p.status === 'aprobado');
  return {
    approved: approved.length,
    evaluating: ALL.length - approved.length,
    approvedInvestment: approved.reduce((s, p) => s + (p.investment ?? 0), 0),
    provinces: rigiByProvince('todos').length
  };
}
