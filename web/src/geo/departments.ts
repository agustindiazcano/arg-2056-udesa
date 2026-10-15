export interface DepartmentProperties {
  id: string;
  departamento: string;
  cabecera: string;
  provinciaId: string;
  provincia: string;
  centroid: [number, number];
}

export interface DepartmentFeature {
  type: 'Feature';
  id: string;
  properties: DepartmentProperties;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface DepartmentsGeo {
  type: 'FeatureCollection';
  source: string;
  retrieved_at: string;
  provinceId: string;
  features: DepartmentFeature[];
}

const cache = new Map<string, DepartmentsGeo>();

/** Loads departments GeoJSON for a given province (e.g. 'AR-M' for Mendoza). */
export async function loadDepartments(
  provinceId: string,
  baseUrl = '/geo/departments'
): Promise<DepartmentsGeo | null> {
  if (cache.has(provinceId)) return cache.get(provinceId)!;
  try {
    const res = await fetch(`${baseUrl}/${provinceId}.json`);
    if (!res.ok) return null;
    const data = (await res.json()) as DepartmentsGeo;
    cache.set(provinceId, data);
    return data;
  } catch {
    return null;
  }
}
