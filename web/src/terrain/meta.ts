import Ajv from 'ajv/dist/2020.js';
import ajvFormats from 'ajv-formats';
import type { TerrainMeta } from '../types/terrain.js';
import schema from '../../../data/schemas/terrain_meta.schema.json' with { type: 'json' };

const ajv = new Ajv({ allErrors: true });
ajvFormats(ajv);
const validate = ajv.compile<TerrainMeta>(schema);

export function parseTerrainMeta(json: unknown): TerrainMeta {
  if (!validate(json)) {
    const err = validate.errors?.[0];
    const extra = err?.params && 'additionalProperty' in err.params ? ` ${String(err.params.additionalProperty)}` : '';
    const missing = err?.params && 'missingProperty' in err.params ? ` ${String(err.params.missingProperty)}` : '';
    throw new Error(`Terrain metadata validation failed: ${err?.instancePath}${missing}${extra} ${err?.message}`);
  }
  return json;
}
