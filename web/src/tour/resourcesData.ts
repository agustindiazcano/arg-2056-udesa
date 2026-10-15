import agro from './agroArgentina.json';
import energy from './energyArgentina.json';
import { EXPORT_COMPLEXES } from './tourData.js';

/** Years of the crop series shown in the Resources slide (campaign start years in the MAGyP files). */
export interface CropSeries {
  crop: string;
  /** million tonnes per campaign, in the order of `AGRO_TONNES.campaigns`; null where the file has no campaign */
  values: Array<number | null>;
}

export interface AgroTonnes {
  campaigns: number[];
  series: CropSeries[];
}

type CropRow = { campaign: number; production_t: number | null };

/**
 * Production of the four main crops (MAGyP) in million tonnes, by campaign. A campaign missing from a crop's file stays null; nothing is
 * interpolated or carried over. The campaign is named by its start year (2024 is 2024/25).
 */
export function agroTonnes(): AgroTonnes {
  const crops = agro.crops as Record<string, CropRow[]>;
  const campaigns = [...new Set(Object.values(crops).flatMap((rows) => rows.map((r) => r.campaign)))].sort((a, b) => a - b);
  const series = Object.entries(crops).map(([crop, rows]) => ({
    crop,
    values: campaigns.map((c) => {
      const t = rows.find((r) => r.campaign === c)?.production_t;
      return t === null || t === undefined ? null : t / 1e6;
    })
  }));
  return { campaigns, series };
}

export const campaignLabel = (c: number): string => `${c}/${String(c + 1).slice(2)}`;

export type ResourceSector = 'mineria' | 'hidrocarburos' | 'agro';

export const RESOURCE_SECTORS: ReadonlyArray<{ value: ResourceSector; label: string }> = [
  { value: 'mineria', label: 'Minería' },
  { value: 'hidrocarburos', label: 'Hidrocarburos' },
  { value: 'agro', label: 'Agro' }
];

export interface Part {
  label: string;
  value: number;
}

/** The complexes of the INDEC exports of 2025 that make up each sector, in million USD (`EXPORT_COMPLEXES`); the mining complex of the INDEC is gold and silver. */
const SECTOR_COMPLEXES: Record<ResourceSector, readonly string[]> = {
  mineria: ['Oro y plata'],
  hidrocarburos: ['Petrolero-petroquímico'],
  agro: ['Complejo soja', 'Maicero', 'Triguero', 'Girasol', 'Carne y cuero bovinos', 'Lácteo']
};

/** Exports of 2025 by sector, billion USD: the three sectors side by side (INDEC, complexes grouped). */
export function sectorExports(): Part[] {
  return RESOURCE_SECTORS.map((s) => ({
    label: s.label,
    value: Math.round(EXPORT_COMPLEXES.filter((c) => SECTOR_COMPLEXES[s.value].includes(c.label)).reduce((sum, c) => sum + c.y2025, 0) / 100) / 10
  }));
}

export interface Breakdown {
  title: string;
  unit: string;
  parts: Part[];
}

/** What a sector is made of: mining exports of 2024 by mineral, oil of 2025 by province and the crops of the last campaign everyone has. */
export function breakdown(sector: ResourceSector): Breakdown {
  if (sector === 'mineria') {
    return {
      title: 'Minería: exportaciones de 2024 por mineral',
      unit: 'miles de millones de USD',
      parts: [
        { label: 'Oro', value: 3.141 },
        { label: 'Plata', value: 0.652 },
        { label: 'Litio', value: 0.645 },
        { label: 'Cobre y resto', value: 0.235 }
      ]
    };
  }
  if (sector === 'hidrocarburos') {
    const provinces = (energy.provinces2025 as Array<{ province: string; oil_kbd: number }>)
      .filter((p) => p.oil_kbd >= 1)
      .map((p) => ({ label: p.province, value: p.oil_kbd }));
    return { title: 'Hidrocarburos: petróleo de 2025 por provincia', unit: 'miles de barriles por día', parts: provinces };
  }
  const { campaigns, series } = agroTonnes();
  const i = campaigns.indexOf(2024);
  return {
    title: 'Agro: producción de la campaña 2024/25 por cultivo',
    unit: 'millones de toneladas',
    parts: series.map((s) => ({ label: s.crop, value: s.values[i] ?? 0 })).filter((p) => p.value > 0)
  };
}

export interface Total {
  label: string;
  value: string;
  unit: string;
}

const es = (v: number, digits = 1): string => v.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/**
 * The totals shown above the charts: dollars, tonnes, barrels and reserves of the chosen view. Mining reserves and resources are the figures of the
 * Secretaría de Minería (ARMINERA 2025: lithium 122 million tonnes of carbonate equivalent, 21 of them reserves; 105 million ounces of gold, 3,216
 * million of silver); oil and gas are the production of 2025 and the proved reserves of the Secretaría de Energía (31 December 2025).
 */
export function totals(view: ResourceSector | 'total'): Total[] {
  const exportsBn = sectorExports();
  const bySector = (label: string) => exportsBn.find((p) => p.label === label)?.value ?? 0;
  const crops = breakdown('agro').parts;
  const cropsMt = crops.reduce((sum, p) => sum + p.value, 0);
  const oil2025 = (energy.national as Record<string, { oil_kbd: number; gas_mmm3d: number }>)['2025']!;
  const provedOilMm3 = energy.reserves.proved.oil_mm3;
  const provedGas = energy.reserves.proved.gas_mmm3;
  const provedOilMbbl = Math.round((provedOilMm3 * 6.28981) / 1000);
  const mining2024 = breakdown('mineria').parts.reduce((sum, p) => sum + p.value, 0);
  const mineria: Total[] = [
    { label: 'Exportaciones mineras de 2024', value: es(mining2024), unit: 'miles de millones de USD' },
    { label: 'Recursos de litio', value: '122', unit: 'millones de t de carbonato equivalente (21 de reservas)' },
    { label: 'Recursos de oro', value: '105', unit: 'millones de onzas' },
    { label: 'Recursos de plata', value: '3.216', unit: 'millones de onzas' }
  ];
  const hidrocarburos: Total[] = [
    { label: 'Exportaciones del complejo petrolero, 2025', value: es(bySector('Hidrocarburos')), unit: 'miles de millones de USD' },
    { label: 'Petróleo producido en 2025', value: es(oil2025.oil_kbd), unit: 'miles de barriles por día' },
    { label: 'Gas producido en 2025', value: es(oil2025.gas_mmm3d), unit: 'millones de m³ por día' },
    { label: 'Reservas comprobadas de petróleo', value: provedOilMbbl.toLocaleString('es-AR'), unit: 'millones de barriles' },
    { label: 'Reservas comprobadas de gas', value: provedGas.toLocaleString('es-AR'), unit: 'millones de m³' }
  ];
  const agro: Total[] = [
    { label: 'Exportaciones del agro, 2025', value: es(bySector('Agro')), unit: 'miles de millones de USD' },
    { label: 'Cosecha 2024/25 de soja, maíz, trigo y girasol', value: es(cropsMt), unit: 'millones de toneladas' }
  ];
  if (view === 'mineria') return mineria;
  if (view === 'hidrocarburos') return hidrocarburos;
  if (view === 'agro') return agro;
  return [
    { label: 'Exportaciones de los tres sectores, 2025', value: es(exportsBn.reduce((sum, p) => sum + p.value, 0)), unit: 'miles de millones de USD' },
    { label: 'Cosecha 2024/25', value: es(cropsMt), unit: 'millones de toneladas' },
    { label: 'Petróleo producido en 2025', value: es(oil2025.oil_kbd), unit: 'miles de barriles por día' },
    { label: 'Reservas comprobadas de petróleo', value: provedOilMbbl.toLocaleString('es-AR'), unit: 'millones de barriles' },
    { label: 'Recursos de litio', value: '122', unit: 'millones de t de carbonato equivalente' }
  ];
}
