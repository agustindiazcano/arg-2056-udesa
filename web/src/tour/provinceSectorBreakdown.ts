import { PROVINCES } from '../types/province.js';
import type { ProvinceId } from '../types/province.js';
import { PRODUCTION_UNIT, PRODUCER_MIN, SECTOR_VALUES } from './provinceMock.js';
import type { Sector } from './provinceMock.js';
import { RESOURCE_SECTORS, breakdown, sectorExports } from './resourcesData.js';
import type { Breakdown, Part, ResourceSector } from './resourcesData.js';

export type View = ResourceSector | 'total';

/** Detailed mining production by province (million USD), matching SECTOR_VALUES.mineria. */
export const PROVINCE_MINING_BREAKDOWN: Partial<Record<ProvinceId, Part[]>> = {
  'AR-A': [
    { label: 'Litio', value: 700 },
    { label: 'Oro', value: 550 },
    { label: 'Plata', value: 350 },
    { label: 'Boratos', value: 140 },
    { label: 'Cobre y molibdeno', value: 60 }
  ],
  'AR-K': [
    { label: 'Litio', value: 1600 },
    { label: 'Oro', value: 800 },
    { label: 'Cobre y molibdeno', value: 800 }
  ],
  'AR-J': [
    { label: 'Oro', value: 1900 },
    { label: 'Plata', value: 450 },
    { label: 'Cobre y molibdeno', value: 250 }
  ],
  'AR-Z': [
    { label: 'Oro', value: 2000 },
    { label: 'Plata', value: 750 },
    { label: 'Resto', value: 150 }
  ],
  'AR-Y': [
    { label: 'Litio', value: 1100 },
    { label: 'Plata', value: 500 },
    { label: 'Plomo, cinc y boratos', value: 300 }
  ],
  'AR-M': [
    { label: 'Rocas de aplicación y calizas', value: 200 },
    { label: 'Yeso y sales', value: 200 },
    { label: 'Hierro y manganeso', value: 140 }
  ],
  'AR-F': [
    { label: 'Rocas de aplicación', value: 180 },
    { label: 'Minerales no metalíferos', value: 140 },
    { label: 'Oro y plata', value: 100 }
  ],
  'AR-U': [
    { label: 'Pórfidos y rocas ornamentales', value: 180 },
    { label: 'Arcillas y yeso', value: 120 },
    { label: 'Resto', value: 80 }
  ],
  'AR-B': [
    { label: 'Calizas y áridos', value: 220 },
    { label: 'Cemento y arcillas', value: 130 }
  ],
  'AR-X': [
    { label: 'Calizas y mármoles', value: 160 },
    { label: 'Rocas de aplicación y áridos', value: 120 }
  ],
  'AR-R': [
    { label: 'Diatomita y yeso', value: 120 },
    { label: 'Rocas y áridos', value: 110 }
  ],
  'AR-D': [
    { label: 'Granito y calizas', value: 90 },
    { label: 'Cuarzo y feldespato', value: 70 }
  ],
  'AR-Q': [
    { label: 'Rocas de aplicación y arcillas', value: 90 },
    { label: 'Yeso', value: 60 }
  ],
  'AR-L': [
    { label: 'Sal común y sulfato', value: 80 },
    { label: 'Yeso', value: 40 }
  ],
  'AR-S': [
    { label: 'Arenas de fractura y rocas', value: 80 },
    { label: 'Cemento', value: 40 }
  ]
};

/** Detailed hydrocarbon production by province (million USD), matching SECTOR_VALUES.hidrocarburos. */
export const PROVINCE_HYDROCARBONS_BREAKDOWN: Partial<Record<ProvinceId, Part[]>> = {
  'AR-Q': [
    { label: 'Petróleo shale', value: 5800 },
    { label: 'Gas natural', value: 4000 }
  ],
  'AR-U': [
    { label: 'Petróleo convencional', value: 4100 },
    { label: 'Gas natural', value: 800 }
  ],
  'AR-M': [
    { label: 'Petróleo convencional', value: 3600 },
    { label: 'Gas natural', value: 600 }
  ],
  'AR-Z': [
    { label: 'Petróleo', value: 2900 },
    { label: 'Gas natural', value: 1200 }
  ],
  'AR-R': [
    { label: 'Petróleo', value: 1700 },
    { label: 'Gas natural', value: 700 }
  ],
  'AR-V': [
    { label: 'Gas natural', value: 1100 },
    { label: 'Petróleo', value: 400 }
  ],
  'AR-A': [
    { label: 'Gas natural', value: 650 },
    { label: 'Petróleo', value: 250 }
  ],
  'AR-B': [{ label: 'Refinación y petroquímica', value: 600 }],
  'AR-L': [
    { label: 'Petróleo', value: 340 },
    { label: 'Gas natural', value: 60 }
  ]
};

/** Detailed agro production by province (million USD), matching SECTOR_VALUES.agro. */
export const PROVINCE_AGRO_BREAKDOWN: Partial<Record<ProvinceId, Part[]>> = {
  'AR-B': [
    { label: 'Soja', value: 6200 },
    { label: 'Maíz', value: 4100 },
    { label: 'Trigo', value: 3100 },
    { label: 'Bovinos y lácteos', value: 2100 }
  ],
  'AR-S': [
    { label: 'Soja', value: 5500 },
    { label: 'Maíz', value: 3800 },
    { label: 'Lácteos y bovinos', value: 2300 },
    { label: 'Trigo y girasol', value: 1200 }
  ],
  'AR-X': [
    { label: 'Maíz', value: 4800 },
    { label: 'Soja', value: 4500 },
    { label: 'Maní y especialidades', value: 1500 },
    { label: 'Lácteos y carne', value: 1000 }
  ],
  'AR-E': [
    { label: 'Avícola y porcino', value: 1400 },
    { label: 'Soja y maíz', value: 1300 },
    { label: 'Arroz y cítricos', value: 1200 }
  ],
  'AR-L': [
    { label: 'Ganadería bovina', value: 1200 },
    { label: 'Trigo y cebada', value: 900 },
    { label: 'Girasol y maíz', value: 700 }
  ],
  'AR-G': [
    { label: 'Soja y maíz', value: 1600 },
    { label: 'Algodón', value: 700 },
    { label: 'Ganadería', value: 400 }
  ],
  'AR-M': [
    { label: 'Vitivinicultura (uva y vino)', value: 1600 },
    { label: 'Frutas y hortalizas', value: 700 }
  ],
  'AR-H': [
    { label: 'Algodón', value: 900 },
    { label: 'Soja y maíz', value: 800 },
    { label: 'Girasol', value: 400 }
  ],
  'AR-W': [
    { label: 'Arroz', value: 700 },
    { label: 'Cítricos y forestal', value: 600 },
    { label: 'Ganadería', value: 400 }
  ],
  'AR-A': [
    { label: 'Granos y oleaginosas', value: 750 },
    { label: 'Legumbres (porotos)', value: 380 },
    { label: 'Tabaco', value: 220 },
    { label: 'Azúcar y cítricos', value: 150 }
  ],
  'AR-T': [
    { label: 'Azúcar y bioetanol', value: 750 },
    { label: 'Limón y cítricos', value: 650 }
  ],
  'AR-D': [
    { label: 'Maíz y soja', value: 700 },
    { label: 'Ganadería bovina', value: 600 }
  ],
  'AR-N': [
    { label: 'Yerba mate y té', value: 850 },
    { label: 'Forestal', value: 350 }
  ],
  'AR-R': [
    { label: 'Manzanas y peras', value: 800 },
    { label: 'Hortalizas y frutos secos', value: 300 }
  ],
  'AR-P': [
    { label: 'Ganadería', value: 350 },
    { label: 'Algodón y granos', value: 300 }
  ],
  'AR-J': [
    { label: 'Vid y olivo', value: 300 },
    { label: 'Hortalizas y semillas', value: 150 }
  ],
  'AR-Y': [
    { label: 'Caña de azúcar', value: 250 },
    { label: 'Tabaco y cítricos', value: 200 }
  ],
  'AR-U': [
    { label: 'Ovina y lana', value: 250 },
    { label: 'Cerezas y frutos finos', value: 100 }
  ],
  'AR-Q': [
    { label: 'Frutas de pepita', value: 200 },
    { label: 'Hortalizas y pasturas', value: 100 }
  ],
  'AR-Z': [{ label: 'Ganadería ovina (lana y carne)', value: 280 }],
  'AR-F': [
    { label: 'Olivo y aceite', value: 150 },
    { label: 'Vid y nueces', value: 100 }
  ],
  'AR-K': [
    { label: 'Olivo y nueces', value: 130 },
    { label: 'Vid y forrajes', value: 90 }
  ]
};

const SECTOR_PROVINCE_TABLES: Record<Sector, Partial<Record<ProvinceId, Part[]>>> = {
  mineria: PROVINCE_MINING_BREAKDOWN,
  hidrocarburos: PROVINCE_HYDROCARBONS_BREAKDOWN,
  agro: PROVINCE_AGRO_BREAKDOWN
};

/**
 * Pure selector that returns the composition breakdown for the resources panel.
 * - When no province is selected: shows national sector breakdown (or total sector exports).
 * - When a province is selected and view is a sector (mineria, hidrocarburos, agro): shows what that province produces in THAT sector.
 * - When a province is selected and view is total: shows the macro-sectors (mineria, hidrocarburos, agro) for that province.
 * - Returns null when a province has no significant production in the selected sector (to hide the panel cleanly).
 */
export function provinceSectorBreakdown(view: View, provinceId: ProvinceId | null): Breakdown | null {
  if (provinceId === null) {
    if (view === 'total') {
      return {
        title: 'Exportaciones de 2025 por sector',
        unit: 'miles de millones de USD',
        parts: sectorExports()
      };
    }
    return breakdown(view);
  }

  const provinceIndex = PROVINCES.findIndex((p) => p.id === provinceId);
  if (provinceIndex < 0) return null;
  const province = PROVINCES[provinceIndex]!;

  if (view === 'total') {
    const parts = RESOURCE_SECTORS.map((s) => ({
      label: s.label,
      value: SECTOR_VALUES[s.value][provinceIndex] ?? 0
    })).filter((p) => p.value >= PRODUCER_MIN);

    if (parts.length === 0) return null;
    return {
      title: `${province.name}: qué produce`,
      unit: PRODUCTION_UNIT,
      parts
    };
  }

  const sectorValue = SECTOR_VALUES[view][provinceIndex] ?? 0;
  if (sectorValue < PRODUCER_MIN) return null;

  const table = SECTOR_PROVINCE_TABLES[view];
  const parts = table[provinceId] ?? [{ label: view === 'mineria' ? 'Minerales y rocas' : view === 'hidrocarburos' ? 'Hidrocarburos' : 'Producción agropecuaria', value: sectorValue }];

  return {
    title: `${province.name}: ${view === 'mineria' ? 'minería' : view === 'hidrocarburos' ? 'hidrocarburos' : 'agro'}`,
    unit: PRODUCTION_UNIT,
    parts
  };
}
