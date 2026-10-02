export const PROVINCES = [
  { id: 'AR-A', name: 'Salta' },
  { id: 'AR-B', name: 'Buenos Aires' },
  { id: 'AR-C', name: 'Ciudad Autónoma de Buenos Aires' },
  { id: 'AR-D', name: 'San Luis' },
  { id: 'AR-E', name: 'Entre Ríos' },
  { id: 'AR-F', name: 'La Rioja' },
  { id: 'AR-G', name: 'Santiago del Estero' },
  { id: 'AR-H', name: 'Chaco' },
  { id: 'AR-J', name: 'San Juan' },
  { id: 'AR-K', name: 'Catamarca' },
  { id: 'AR-L', name: 'La Pampa' },
  { id: 'AR-M', name: 'Mendoza' },
  { id: 'AR-N', name: 'Misiones' },
  { id: 'AR-P', name: 'Formosa' },
  { id: 'AR-Q', name: 'Neuquén' },
  { id: 'AR-R', name: 'Río Negro' },
  { id: 'AR-S', name: 'Santa Fe' },
  { id: 'AR-T', name: 'Tucumán' },
  { id: 'AR-U', name: 'Chubut' },
  { id: 'AR-V', name: 'Tierra del Fuego, Antártida e Islas del Atlántico Sur' },
  { id: 'AR-W', name: 'Corrientes' },
  { id: 'AR-X', name: 'Córdoba' },
  { id: 'AR-Y', name: 'Jujuy' },
  { id: 'AR-Z', name: 'Santa Cruz' }
] as const;

export type ProvinceId = typeof PROVINCES[number]['id'];

export function isProvinceId(x: unknown): x is ProvinceId {
  if (typeof x !== 'string') return false;
  return PROVINCES.some(p => p.id === x);
}
