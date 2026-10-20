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
  isRigi?: boolean;
  resolution?: string;
  refs?: string[];
  note?: string;
  department?: string;
  coordinates?: [number, number];
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
  ],
  'AR-R': [
    { name: 'General Roca', value: 1400 },
    { name: 'San Antonio', value: 800 },
    { name: 'Catriel / Peñas Blancas', value: 200 }
  ]
};

/** Registered projects by province and normalized department name. */
const DEPARTMENT_PROJECTS: Record<string, Record<string, DepartmentProject[]>> = {
  'AR-A': {
    'los andes': [
      {
        name: 'Taca Taca',
        company: 'First Quantum Minerals',
        kind: 'Cobre, molibdeno y oro',
        status: 'En evaluación RIGI',
        isRigi: true,
        investment: 4232,
        capacity: 'Cobre 227 kt; molibdeno 2.205 t; oro 106 koz',
        refs: ['R9', 'E11', 'R14'],
        coordinates: [-67.75, -24.52]
      },
      {
        name: 'Salar del Rincón',
        company: 'Rio Tinto',
        kind: 'Litio',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 2744,
        capacity: '60.000 t de LCE',
        refs: ['R1', 'R2', 'R3', 'R14'],
        coordinates: [-67.12, -24.08]
      },
      {
        name: 'Centenario-Ratones',
        company: 'Eramet',
        kind: 'Litio',
        status: 'Producción',
        capacity: '24.000 t de LCE',
        coordinates: [-66.85, -24.3]
      },
      {
        name: 'Diablillos',
        company: 'AbraSilver Resource Corp.',
        kind: 'Oro y plata',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 764,
        refs: ['R1', 'R5', 'R14'],
        coordinates: [-66.83, -25.32]
      },
      {
        name: 'Sal de Oro',
        company: 'Posco Argentina',
        kind: 'Litio',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 547,
        capacity: '25.000 t (hidróxido de litio)',
        refs: ['R1', 'R14'],
        coordinates: [-67.01, -25.42]
      },
      {
        name: 'Lindero',
        company: 'Mansfield / Fortuna Silver',
        kind: 'Oro',
        status: 'Producción',
        capacity: '100 koz/año',
        coordinates: [-67.78, -25.1]
      },
      {
        name: 'Mariana',
        company: 'Ganfeng Lithium',
        kind: 'Litio',
        status: 'Producción',
        capacity: '20.000 t de LCE',
        coordinates: [-67.9, -24.7]
      },
      {
        name: 'Rincón (Argosy)',
        company: 'Argosy Minerals',
        kind: 'Litio',
        status: 'Construcción',
        capacity: '12.000 t de LCE',
        coordinates: [-67.15, -24.12]
      },
      {
        name: 'Sal de los Ángeles',
        company: 'Revotech Asia / Tibet Summit',
        kind: 'Litio',
        status: 'Construcción',
        capacity: '20.000 t de LCE',
        coordinates: [-67.1, -24.5]
      }
    ],
    'general guemes': [
      {
        name: 'Planta Comercial Posco',
        company: 'Posco Argentina',
        kind: 'Procesamiento de hidróxido de litio',
        status: 'Producción',
        coordinates: [-65.05, -24.67]
      }
    ]
  },
  'AR-J': {
    iglesia: [
      {
        name: 'Vicuña',
        company: 'BHP y Lundin Mining',
        kind: 'Cobre, oro y plata',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 9737,
        capacity: 'Josemaría: 131 kt Cu; Filo del Sol integrado',
        refs: ['R1', 'R3', 'R14'],
        coordinates: [-69.55, -28.43]
      },
      {
        name: 'Veladero',
        company: 'Minera Argentina Gold (Barrick y Shandong)',
        kind: 'Oro y plata',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 436,
        refs: ['R1', 'R5', 'R14'],
        coordinates: [-69.95, -29.38]
      },
      {
        name: 'Parques Solares RIGI Iglesia',
        company: 'YPF Luz y 360 Energy',
        kind: 'Energía solar fotovoltaica para minería',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 520,
        refs: ['R14'],
        coordinates: [-69.2, -30.5]
      }
    ],
    calingasta: [
      {
        name: 'Los Azules',
        company: 'McEwen Copper (McEwen Mining y Stellantis)',
        kind: 'Cobre',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 2672,
        capacity: 'Cobre 175 kt LME Grado A',
        refs: ['R1', 'R2', 'R14'],
        coordinates: [-70.21, -31.11]
      },
      {
        name: 'Pachón',
        company: 'Glencore',
        kind: 'Cobre y molibdeno',
        status: 'En evaluación RIGI',
        isRigi: true,
        investment: 9533,
        capacity: 'Cobre 280 kt; molibdeno 9 kt',
        refs: ['R2', 'R14'],
        coordinates: [-70.43, -31.75]
      },
      {
        name: 'Altar',
        company: 'Aldebaran Resources y Sibanye Stillwater',
        kind: 'Cobre y oro',
        status: 'Exploración',
        capacity: 'Cobre 127 kt',
        coordinates: [-70.18, -31.48]
      }
    ],
    jachal: [
      {
        name: 'Gualcamayo (carbonatos profundos)',
        company: 'Minas Argentinas (Eris LLC)',
        kind: 'Oro y plata',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 665,
        refs: ['R1', 'R2', 'R14'],
        coordinates: [-68.64, -30.01]
      }
    ]
  },
  'AR-K': {
    'antofagasta de la sierra': [
      {
        name: 'Fénix (ampliación fase 1B)',
        company: 'Arcadium Lithium (Rio Tinto)',
        kind: 'Potasio y litio',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 531,
        capacity: '25.000 t de LCE',
        refs: ['R1', 'R14'],
        coordinates: [-67.05, -25.35]
      },
      {
        name: 'Sal de Vida',
        company: 'Arcadium Lithium (Rio Tinto)',
        kind: 'Litio',
        status: 'En evaluación RIGI',
        isRigi: true,
        investment: 818,
        capacity: '15.000 t de carbonato de litio',
        refs: ['R2', 'R14'],
        coordinates: [-66.98, -25.38]
      },
      {
        name: 'Hombre Muerto Oeste (HMW)',
        company: 'Galan Lithium',
        kind: 'Litio',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 292,
        capacity: '20.000 t de LCE',
        refs: ['R1', 'R2', 'R14'],
        coordinates: [-67.15, -25.4]
      }
    ],
    andalgala: [
      {
        name: 'Alumbrera-Agua Rica (MARA)',
        company: 'Glencore',
        kind: 'Cobre, oro, plata y molibdeno',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 4000,
        capacity: '200.000 t/año de cobre concentrado',
        refs: ['R1', 'R14'],
        coordinates: [-66.31, -27.43]
      }
    ],
    tinogasta: [
      {
        name: 'Tres Quebradas (3Q)',
        company: 'Liex S.A. (Zijin Mining)',
        kind: 'Litio',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 710,
        capacity: '20.000 t de LCE en Fiambalá',
        refs: ['R1', 'R14'],
        coordinates: [-68.58, -27.42]
      }
    ]
  },
  'AR-Y': {
    susques: [
      {
        name: 'Cauchari-Olaroz (ampliación)',
        company: 'Minera Exar (Ganfeng y Lithium Americas)',
        kind: 'Litio',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 1241,
        capacity: '40.000 t de LCE',
        refs: ['R1', 'R4', 'R14'],
        coordinates: [-66.81, -23.65]
      },
      {
        name: 'Olaroz',
        company: 'Rio Tinto Group / Arcadium',
        kind: 'Litio',
        status: 'Producción',
        capacity: '20.000 t de LCE',
        coordinates: [-66.85, -23.7]
      }
    ],
    rinconada: [
      {
        name: 'Chinchillas - Mina Pirquitas',
        company: 'SSR Mining',
        kind: 'Plata, plomo y cinc',
        status: 'Producción',
        coordinates: [-66.5, -22.5]
      }
    ]
  },
  'AR-Q': {
    anelo: [
      {
        name: 'Los Toldos II Este',
        company: 'Tecpetrol',
        kind: 'Producción no convencional (Vaca Muerta)',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 6432,
        resolution: 'Resolución 1771/2026',
        refs: ['R8', 'R13', 'R14'],
        coordinates: [-68.78, -37.89]
      },
      {
        name: 'Rincón de Aranda',
        company: 'Pampa Energía',
        kind: 'Vaca Muerta: ductos y plantas de tratamiento',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 4521,
        refs: ['R3', 'R14'],
        coordinates: [-68.65, -38.05]
      },
      {
        name: 'LLL Oil',
        company: 'YPF',
        kind: 'Exportación de crudo: 1.152 pozos',
        status: 'En evaluación RIGI',
        isRigi: true,
        investment: 25000,
        refs: ['R10', 'R14'],
        coordinates: [-68.85, -38.15]
      },
      {
        name: 'Los Toldos (primera etapa)',
        company: 'Tecpetrol',
        kind: 'Infraestructura de hidrocarburos',
        status: 'En evaluación RIGI',
        isRigi: true,
        investment: 1006,
        refs: ['R2', 'R14'],
        coordinates: [-68.75, -37.92]
      }
    ],
    pehuenches: [
      {
        name: 'Bajo del Choique-La Invernada',
        company: 'Pluspetrol y GyP',
        kind: 'Producción no convencional (Vaca Muerta)',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 12400,
        refs: ['R12', 'R14'],
        coordinates: [-68.95, -37.45]
      }
    ]
  },
  'AR-R': {
    'san antonio': [
      {
        name: 'Argentina LNG (San Matías)',
        company: 'Southern Energy (PAE y Golar LNG)',
        kind: 'GNL, exportación flotante',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 6878,
        refs: ['R2', 'R3', 'R14'],
        coordinates: [-65.1, -40.75]
      },
      {
        name: 'Oleoducto Vaca Muerta Sur (VMOS)',
        company: 'Consorcio VMOS (YPF, PAE, Vista, etc.)',
        kind: 'Oleoducto de 437 km a Punta Colorada',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 2900,
        refs: ['R2', 'R3', 'R6', 'R14'],
        coordinates: [-65.05, -41.69]
      },
      {
        name: 'Gasoducto dedicado a San Matías',
        company: 'Southern Energy',
        kind: 'Gasoducto de 27 a 30 millones de m³/d',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 1300,
        refs: ['R3', 'R7', 'R14'],
        coordinates: [-65.3, -40.6]
      },
      {
        name: 'GNL integrado de YPF, ENI y XRG',
        company: 'YPF, ENI y XRG',
        kind: 'GNL y gasoductos dedicados',
        status: 'En evaluación RIGI',
        isRigi: true,
        refs: ['R3', 'R14'],
        coordinates: [-65.12, -41.7]
      }
    ],
    'general roca': [
      {
        name: 'Arenas de Cercanías',
        company: 'Minera del Mojotoro y Orosmayo',
        kind: 'Arena para fractura (frac sand)',
        status: 'En evaluación RIGI',
        isRigi: true,
        investment: 232,
        refs: ['R2', 'R14'],
        coordinates: [-67.55, -39.03]
      }
    ]
  },
  'AR-M': {
    'las heras': [
      {
        name: 'PSJ Cobre Mendocino',
        company: 'Minera San Jorge (Solway Group)',
        kind: 'Cobre y oro',
        status: 'Aprobado RIGI',
        isRigi: true,
        investment: 891,
        refs: ['R1', 'R3', 'R4', 'R14'],
        coordinates: [-69.35, -32.59]
      }
    ]
  },
  'AR-B': {
    'bahia blanca': [
      {
        name: 'LNG del Plata',
        company: 'Camuzzi',
        kind: 'GNL y logística portuaria',
        status: 'En evaluación RIGI',
        isRigi: true,
        refs: ['R2', 'R14'],
        coordinates: [-62.27, -38.78]
      }
    ]
  },
  'AR-Z': {
    deseado: [
      { name: 'Cerro Negro', company: 'Newmont', kind: 'Oro y plata', status: 'Producción', coordinates: [-70.1, -46.9] },
      { name: 'Cerro Moro', company: 'Pan American Silver', kind: 'Oro y plata', status: 'Producción', coordinates: [-66.5, -48.0] },
      { name: 'San José', company: 'Hochschild Mining', kind: 'Plata y oro', status: 'Producción', coordinates: [-70.3, -46.8] }
    ],
    magallanes: [
      { name: 'Cerro Vanguardia', company: 'AngloGold Ashanti', kind: 'Oro y plata', status: 'Producción', coordinates: [-68.2, -48.4] }
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
  const found = provMap[normalized];
  if (found) return found;

  // Try partial or match
  for (const [deptKey, projs] of Object.entries(provMap)) {
    if (normalized.includes(deptKey) || deptKey.includes(normalized)) {
      return projs;
    }
  }
  return [];
}

/**
 * Returns all registered projects for a province (across all departments or filtered to a department).
 */
export function getProvinceProjects(
  provinceId: string,
  departmentName?: string | null
): DepartmentProject[] {
  const provMap = DEPARTMENT_PROJECTS[provinceId];
  if (!provMap) return [];
  if (departmentName) {
    return getDepartmentProjects(provinceId, departmentName);
  }
  const all: DepartmentProject[] = [];
  for (const projs of Object.values(provMap)) {
    all.push(...projs);
  }
  return all;
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
  'anelo': 'Añelo',
  'pehuenches': 'Pehuenches',
  'san antonio': 'San Antonio',
  'general roca': 'General Roca',
  'las heras': 'Las Heras',
  'bahia blanca': 'Bahía Blanca',
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
