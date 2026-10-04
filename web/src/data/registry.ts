import { errorsText, validator } from '../validation/validators';
import type { SchemaName } from '../validation/schemaNames';
import type { Scene } from '../types/scene';
import { parseComposition } from '../types/composition';
import { parseEconomySeries } from '../types/economy';
import { parseForecastOutput } from '../types/forecast';
import { parseProductionProjections } from '../types/projections';
import { parseProjects } from '../types/projects';
import { parseReferences } from '../types/references';
import { parseAiEstimates, parseBaseRates, parseDatasetCatalog, parseExternalForecasts, parseForecastVintages } from '../types/research';
import { parseResourceProduction } from '../types/resourceProduction';
import { parseAndesEvents } from '../scenes/andes/data';

export interface Dataset {
  /** file name inside public/data */
  file: string;
  /** the parser the app uses for it; throws when the file is invalid */
  parse: (json: unknown) => unknown;
  /** scenes that fail without it. Empty means optional: it is only parsed when present. */
  requiredBy: readonly Scene[];
}

/** Parser from an existing JSON Schema, for the files whose scene (or reader) has no typed parser yet. */
function schemaParser(label: string, name: SchemaName): (json: unknown) => unknown {
  const validate = validator<unknown>(name);
  return (json) => {
    if (validate(json)) return json;
    throw new Error(`Invalid ${label} data: ${errorsText(validate.errors)}`);
  };
}

/** Every data file the app can load, with the parser it uses and the scenes that need it. */
export const DATASETS: readonly Dataset[] = [
  // The ai-revolution scene is a placeholder and loads nothing yet, so its file is optional.
  { file: 'ai_estimates.json', parse: parseAiEstimates, requiredBy: [] },
  { file: 'andes_events.json', parse: parseAndesEvents, requiredBy: ['andes'] },
  { file: 'base_rates.json', parse: parseBaseRates, requiredBy: [] },
  { file: 'composition.json', parse: parseComposition, requiredBy: ['resources'] },
  { file: 'dataset_catalog.json', parse: parseDatasetCatalog, requiredBy: [] },
  { file: 'economy_series.json', parse: parseEconomySeries, requiredBy: ['economy'] },
  { file: 'external_forecasts.json', parse: parseExternalForecasts, requiredBy: [] },
  { file: 'forecast_output.json', parse: parseForecastOutput, requiredBy: ['forecast', 'sandbox'] },
  { file: 'forecast_vintages.json', parse: parseForecastVintages, requiredBy: [] },
  { file: 'population.json', parse: schemaParser('population', 'population'), requiredBy: [] },
  { file: 'production_projections.json', parse: parseProductionProjections, requiredBy: [] },
  { file: 'projects.json', parse: parseProjects, requiredBy: ['resources'] },
  // written by scripts/build_references.py and read by the standalone References page, not by a scene
  { file: 'references.json', parse: parseReferences, requiredBy: [] },
  { file: 'resource_production.json', parse: parseResourceProduction, requiredBy: ['resources'] }
];
