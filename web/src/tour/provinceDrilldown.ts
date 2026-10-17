import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import { PRODUCTION_UNIT, PRODUCER_MIN, SECTOR_LABELS, SECTOR_VALUES, rankedProvinces } from './provinceMock.js';
import { PROVINCE_MINING_BREAKDOWN, PROVINCE_HYDROCARBONS_BREAKDOWN, PROVINCE_AGRO_BREAKDOWN } from './provinceSectorBreakdown.js';
import type { View } from './provinceSectorBreakdown.js';

export interface DepartmentProductionRow {
  name: string;
  value: number;
}

export interface DepartmentProject {
  name: string;
  company: string;
  kind: string;
  status: string;
  capacity?: string;
  investment?: number;
}

/** Department-level mining production estimates (million USD), summing to provincial totals. */
const DEPT_MINING_PRODUCTION: Partial<Record<ProvinceId, DepartmentProductionRow[]>> = {
  'AR-A': [
    { name: 'Los Andes', value: 1450 },
    { name: 'General Güemes', value: 180 },
    { name: 'La Poma', value: 70 },
    { name: 'Cafayate', value: 50 },
    { name: 'San Carlos', value: 50 }
  ],
  'AR-J': [
    { name: 'Iglesia', value: 1500 },
    { name: 'Calingasta', value: 750 },
    { name: 'Jáchal', value: 250 },
    { name: 'Albardón', value: 100 }
  ],
  'AR-K': [
    { name: 'Antofagasta de la Sierra', value: 1900 },
    { name: 'Andalgalá', value: 800 },
    { name: 'Tinogasta', value: 350 },
    { name: 'Belén', value: 150 }
  ],
  'AR-Y': [
    { name: 'Susques', value: 1200 },
    { name: 'Rinconada', value: 450 },
    { name: 'Cochinoca', value: 150 },
    { name: 'Palpalá', value: 100 }
  ],
  'AR-Z': [
    { name: 'Deseado', value: 1600 },
    { name: 'Magallanes', value: 1000 },
    { name: 'Río Chico', value: 300 }
  ]
};

/** Department-level hydrocarbon production estimates (million USD). */
const DEPT_HC_PRODUCTION: Partial<Record<ProvinceId, DepartmentProductionRow[]>> = {
  'AR-Q': [
    { name: 'Añelo', value: 6200 },
    { name: 'Pehuenches', value: 2400 },
    { name: 'Confluencia', value: 800 },
    { name: 'Zapala', value: 400 }
  ],
  'AR-U': [
    { name: 'Escalante', value: 4200 },
    { name: 'Sarmiento', value: 700 }
  ],
  'AR-M': [
    { name: 'Malargüe', value: 3400 },
    { name: 'Tupungato', value: 500 },
    { name: 'Luján de Cuyo', value: 300 }
  ]
};

/** Registered mining projects by province and normalized department name. */
const DEPARTMENT_PROJECTS: Record<string, Record<string, DepartmentProject[]>> = {
  'AR-A': {
    'los andes': [
      { name: 'Taca Taca', company: 'First Quantum Minerals', kind: 'Cobre, molibdeno y oro', status: 'Factibilidad', investment: 4232, capacity: 'Cobre 227 kt; molibdeno 2.205 t; oro 106 koz' },
      { name: 'Centenario-Ratones', company: 'Eramet', kind: 'Litio', status: 'Producción', capacity: '24.000 t de LCE' },
      { name: 'Lindero', company: 'Mansfield / Fortuna Silver', kind: 'Oro', status: 'Producción', capacity: '100 koz/año' },
      { name: 'Mariana', company: 'Ganfeng Lithium', kind: 'Litio', status: 'Producción', capacity: '20.000 t de LCE' },
      { name: 'Salar del Rincón', company: 'Rio Tinto', kind: 'Litio', status: 'Factibilidad y construcción', investment: 2744, capacity: '60.000 t de LCE' },
      { name: 'Rincón', company: 'Argosy Minerals', kind: 'Litio', status: 'Construcción', capacity: '12.000 t de LCE' },
      { name: 'Sal de los Ángeles', company: 'Revotech Asia / Tibet Summit', kind: 'Litio', status: 'Construcción', capacity: '20.000 t de LCE' },
      { name: 'Sal de Oro', company: 'Posco Argentina', kind: 'Litio', status: 'Producción', investment: 547, capacity: '25.000 t (hidróxido de litio)' },
      { name: 'Diablillos', company: 'AbraSilver', kind: 'Oro y plata', status: 'Aprobado RIGI', investment: 764 }
    ],
    'general guemes': [
      { name: 'Planta Comercial Posco', company: 'Posco Argentina', kind: 'Procesamiento de hidróxido de litio', status: 'Producción' }
    ]
  },
  'AR-J': {
    iglesia: [
      { name: 'Veladero', company: 'Barrick Gold y Shandong Gold', kind: 'Oro y plata', status: 'Producción' },
      { name: 'Josemaría (Vicuña)', company: 'Lundin Mining y BHP', kind: 'Cobre, oro y plata', status: 'Construcción', capacity: 'Cobre 131 kt; oro 224 koz' },
      { name: 'Filo del Sol (Vicuña)', company: 'Lundin Mining y BHP', kind: 'Cobre, oro y plata', status: 'Prefactibilidad' }
    ],
    calingasta: [
      { name: 'Los Azules', company: 'McEwen Mining y Stellantis', kind: 'Cobre', status: 'Evaluación económica preliminar', capacity: 'Cobre 175 kt' },
      { name: 'El Pachón', company: 'Glencore', kind: 'Cobre y molibdeno', status: 'Factibilidad', capacity: 'Cobre 280 kt; molibdeno 9 kt' },
      { name: 'Altar', company: 'Aldebaran Resources y Sibanye Stillwater', kind: 'Cobre y oro', status: 'Exploración', capacity: 'Cobre 127 kt' }
    ],
    jachal: [
      { name: 'Gualcamayo', company: 'Minas Argentinas', kind: 'Oro y plata', status: 'Producción y reactivación' }
    ]
  },
  'AR-K': {
    'antofagasta de la sierra': [
      { name: 'Fénix', company: 'Rio Tinto Group / Arcadium', kind: 'Litio', status: 'Producción', capacity: '25.000 t de LCE' },
      { name: 'Sal de Vida', company: 'Rio Tinto Group', kind: 'Litio', status: 'Construcción', capacity: '15.000 t de LCE' },
      { name: 'Hombre Muerto Oeste', company: 'Galán Litio', kind: 'Litio', status: 'Construcción', capacity: '20.000 t de LCE' }
    ],
    andalgala: [
      { name: 'MARA (Agua Rica - Alumbrera)', company: 'Glencore', kind: 'Cobre, oro y molibdeno', status: 'Factibilidad', capacity: '533 millones de libras concentrado' }
    ],
    tinogasta: [
      { name: 'Tres Quebradas', company: 'Zijin Mining', kind: 'Litio', status: 'Construcción', capacity: '20.000 t de LCE' }
    ]
  },
  'AR-Y': {
    susques: [
      { name: 'Cauchari-Olaroz', company: 'Ganfeng Lithium y Lithium Argentina', kind: 'Litio', status: 'Producción', capacity: '40.000 t de LCE' },
      { name: 'Olaroz', company: 'Rio Tinto Group / Arcadium', kind: 'Litio', status: 'Producción', capacity: '20.000 t de LCE' }
    ],
    rinconada: [
      { name: 'Chinchillas - Mina Pirquitas', company: 'SSR Mining', kind: 'Plata, plomo y cinc', status: 'Producción' }
    ]
  },
  'AR-Z': {
    deseado: [
      { name: 'Cerro Negro', company: 'Newmont', kind: 'Oro y plata', status: 'Producción' },
      { name: 'Cerro Moro', company: 'Pan American Silver', kind: 'Oro y plata', status: 'Producción' },
      { name: 'San José', company: 'Hochschild Mining', kind: 'Plata y oro', status: 'Producción' }
    ],
    magallanes: [
      { name: 'Cerro Vanguardia', company: 'AngloGold Ashanti', kind: 'Oro y plata', status: 'Producción' }
    ]
  }
};

const normalizeName = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/**
 * Returns department production rows for a province and sector if data exists, or null otherwise.
 */
export function getProvinceDepartmentProduction(
  view: View,
  provinceId: ProvinceId
): DepartmentProductionRow[] | null {
  if (view === 'mineria') {
    return DEPT_MINING_PRODUCTION[provinceId] ?? null;
  }
  if (view === 'hidrocarburos') {
    return DEPT_HC_PRODUCTION[provinceId] ?? null;
  }
  return null;
}

/**
 * Returns registered mining and investment projects for a department in a province.
 */
export function getDepartmentProjects(
  provinceId: string,
  departmentName: string
): DepartmentProject[] {
  const provMap = DEPARTMENT_PROJECTS[provinceId];
  if (!provMap) return [];
  const normalized = normalizeName(departmentName);
  return provMap[normalized] ?? [];
}

export type DrilldownKind = 'provinces' | 'departments' | 'minerals';

export interface DrilldownResult {
  kind: DrilldownKind;
  title: string;
  unit: string;
  rows: Array<{ name: string; value: number }>;
}

/**
 * Core selector for the bottom-left ranking chart:
 * - If no province selected: returns national provinces ranking.
 * - If province selected with department data: returns department ranking.
 * - If province selected WITHOUT department data: falls back to mineral / sector subcategory breakdown.
 */
export function provinceDrilldownData(
  view: View,
  provinceId: ProvinceId | null
): DrilldownResult {
  const label = view === 'total' ? 'Total' : SECTOR_LABELS[view];

  if (provinceId === null) {
    const raw = view !== 'total' ? SECTOR_VALUES[view] : SECTOR_VALUES.mineria.map((_, i) =>
      (['mineria', 'hidrocarburos', 'agro'] as const).reduce((sum, s) => sum + (SECTOR_VALUES[s][i] ?? 0), 0)
    );
    const ranked = rankedProvinces(raw).filter((r) => r.value >= PRODUCER_MIN);
    return {
      kind: 'provinces',
      title: `${label}: provincias que producen`,
      unit: PRODUCTION_UNIT,
      rows: ranked.map((r) => ({ name: r.short, value: r.value }))
    };
  }

  const province = PROVINCES.find((p) => p.id === provinceId);
  const provName = province?.name ?? provinceId;

  // Check department-level data
  const deptData = getProvinceDepartmentProduction(view, provinceId);
  if (deptData && deptData.length > 0) {
    const title = view === 'mineria'
      ? `${provName}: producción minera por departamento`
      : `${provName}: producción por departamento`;
    return {
      kind: 'departments',
      title,
      unit: PRODUCTION_UNIT,
      rows: deptData
    };
  }

  // Fallback: show mineral or subsector breakdown for that province
  const table = view === 'mineria'
    ? PROVINCE_MINING_BREAKDOWN
    : view === 'hidrocarburos'
      ? PROVINCE_HYDROCARBONS_BREAKDOWN
      : PROVINCE_AGRO_BREAKDOWN;

  const parts = table[provinceId];
  if (parts && parts.length > 0) {
    const title = view === 'mineria'
      ? `${provName}: producción por mineral`
      : `${provName}: producción por rubro`;
    return {
      kind: 'minerals',
      title,
      unit: PRODUCTION_UNIT,
      rows: parts.map((p) => ({ name: p.label, value: p.value }))
    };
  }

  const provIndex = PROVINCES.findIndex((p) => p.id === provinceId);
  const totalVal = provIndex >= 0 && view !== 'total' ? (SECTOR_VALUES[view][provIndex] ?? 0) : 0;
  return {
    kind: 'minerals',
    title: `${provName}: producción de ${label.toLowerCase()}`,
    unit: PRODUCTION_UNIT,
    rows: totalVal > 0 ? [{ name: label, value: totalVal }] : []
  };
}

export interface ProjectCatalogEntry {
  name: string;
  provinceId: ProvinceId;
  provinceName: string;
  department: string;
  company?: string;
  kind?: string;
}

const DEPT_CANONICAL_NAMES: Record<string, string> = {
  'los andes': 'Los Andes',
  'general guemes': 'General Güemes',
  'iglesia': 'Iglesia',
  'calingasta': 'Calingasta',
  'jachal': 'Jáchal',
  'antofagasta de la sierra': 'Antofagasta de la Sierra',
  'andalgala': 'Andalgalá',
  'tinogasta': 'Tinogasta',
  'susques': 'Susques',
  'rinconada': 'Rinconada',
  'deseado': 'Deseado',
  'magallanes': 'Magallanes'
};

export function getAllMiningProjects(): ProjectCatalogEntry[] {
  const list: ProjectCatalogEntry[] = [];
  for (const [provId, depts] of Object.entries(DEPARTMENT_PROJECTS)) {
    const province = PROVINCES.find((p) => p.id === provId);
    const provName = province?.name ?? provId;
    for (const [deptNorm, projects] of Object.entries(depts)) {
      const deptDisplay = DEPT_CANONICAL_NAMES[deptNorm] ?? deptNorm;
      for (const p of projects) {
        list.push({
          name: p.name,
          provinceId: provId as ProvinceId,
          provinceName: provName,
          department: deptDisplay,
          company: p.company,
          kind: p.kind
        });
      }
    }
  }
  return list;
}

