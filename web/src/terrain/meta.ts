import { validator } from '../validation/validators';
import type { TerrainMeta } from '../types/terrain.js';

const validate = validator<TerrainMeta>('terrainMeta');

export function parseTerrainMeta(json: unknown): TerrainMeta {
  if (!validate(json)) {
    const err = validate.errors?.[0];
    const extra = err?.params && 'additionalProperty' in err.params ? ` ${String(err.params.additionalProperty)}` : '';
    const missing = err?.params && 'missingProperty' in err.params ? ` ${String(err.params.missingProperty)}` : '';
    throw new Error(`Terrain metadata validation failed: ${err?.instancePath}${missing}${extra} ${err?.message}`);
  }
  return json;
}
