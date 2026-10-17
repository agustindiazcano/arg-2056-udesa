import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import rawDepartments from '../geo/departmentsIndex.json';

export interface SearchResult {
  id: string;
  name: string;
  type: 'provincia' | 'departamento';
  provinceId: ProvinceId;
  provinceName: string;
  subtitle?: string;
}

interface DepartmentEntry {
  name: string;
  provinceId: string;
  cabecera?: string;
}

const departments = rawDepartments as DepartmentEntry[];

export const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

function matchScore(name: string, q: string, isProvince: boolean): number {
  const n = normalize(name);
  if (n === q) return isProvince ? 100 : 90;
  if (n.startsWith(q)) return isProvince ? 80 : 70;
  const words = n.split(/\s+/);
  if (words.some((w) => w.startsWith(q))) return isProvince ? 60 : 50;
  if (n.includes(q)) return isProvince ? 40 : 30;
  return 0;
}

/**
 * Searches provinces and departments with normalized accent and case insensitivity.
 */
export function searchGeo(query: string, maxResults = 8): SearchResult[] {
  const q = normalize(query);
  if (!q) return [];

  const results: Array<{ score: number; item: SearchResult }> = [];

  // Match provinces
  for (const prov of PROVINCES) {
    const score = matchScore(prov.name, q, true);
    if (score > 0) {
      results.push({
        score,
        item: {
          id: prov.id,
          name: prov.name,
          type: 'provincia',
          provinceId: prov.id,
          provinceName: prov.name,
          subtitle: 'Provincia'
        }
      });
    }
  }

  // Match departments
  for (const dept of departments) {
    const score = matchScore(dept.name, q, false);
    if (score > 0) {
      const province = PROVINCES.find((p) => p.id === dept.provinceId);
      const provName = province?.name ?? dept.provinceId;
      const subtitle = dept.cabecera
        ? `${provName} (cabecera: ${dept.cabecera})`
        : provName;

      results.push({
        score,
        item: {
          id: `${dept.provinceId}:${dept.name}`,
          name: dept.name,
          type: 'departamento',
          provinceId: dept.provinceId as ProvinceId,
          provinceName: provName,
          subtitle
        }
      });
    }
  }

  results.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, 'es'));

  return results.slice(0, maxResults).map((r) => r.item);
}
