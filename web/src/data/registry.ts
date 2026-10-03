import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import andesEventsSchema from '../../../data/schemas/andes_events.schema.json';
import populationSchema from '../../../data/schemas/population.schema.json';
import type { Scene } from '../types/scene';
import { parseComposition } from '../types/composition';
import { parseEconomySeries } from '../types/economy';
import { parseForecastOutput } from '../types/forecast';
import { parseProductionProjections } from '../types/projections';
import { parseProjects } from '../types/projects';
import { parseReferences } from '../types/references';
import { parseResourceProduction } from '../types/resourceProduction';

export interface Dataset {
  /** file name inside public/data */
  file: string;
  /** the parser the app uses for it; throws when the file is invalid */
  parse: (json: unknown) => unknown;
  /** scenes that fail without it. Empty means optional: it is only parsed when present. */
  requiredBy: readonly Scene[];
}

const ajv = new Ajv();
addFormats(ajv);

/** Parser from an existing JSON Schema, for the files whose scene (or reader) has no typed parser yet. */
function schemaParser(label: string, schema: object): (json: unknown) => unknown {
  const validate = ajv.compile(schema);
  return (json) => {
    if (validate(json)) return json;
    throw new Error(`Invalid ${label} data: ${ajv.errorsText(validate.errors)}`);
  };
}

/** Every data file the app can load, with the parser it uses and the scenes that need it. */
export const DATASETS: readonly Dataset[] = [
  // The andes and ai-revolution scenes are placeholders and load nothing yet, so their files are optional.
  { file: 'andes_events.json', parse: schemaParser('andes events', andesEventsSchema), requiredBy: [] },
  { file: 'composition.json', parse: parseComposition, requiredBy: ['resources'] },
  { file: 'economy_series.json', parse: parseEconomySeries, requiredBy: ['economy'] },
  { file: 'forecast_output.json', parse: parseForecastOutput, requiredBy: ['forecast', 'sandbox'] },
  { file: 'population.json', parse: schemaParser('population', populationSchema), requiredBy: [] },
  { file: 'production_projections.json', parse: parseProductionProjections, requiredBy: [] },
  { file: 'projects.json', parse: parseProjects, requiredBy: ['resources'] },
  // written by scripts/build_references.py and read by the standalone References page, not by a scene
  { file: 'references.json', parse: parseReferences, requiredBy: [] },
  { file: 'resource_production.json', parse: parseResourceProduction, requiredBy: ['resources'] }
];
