import { errorsText, validator } from '../validation/validators';

export interface PopulationByAgeRecord {
  geo: string;
  year: number;
  age: number;
  sex: 'both';
  persons: number | null;
  source: string;
  retrieved_at: string;
  note?: string;
}

export interface FertilityScheduleRecord {
  geo: string;
  year: number;
  age: number;
  shape_f: number | null;
  female_share: number | null;
  tfr: number | null;
  source: string;
  retrieved_at: string;
  note?: string;
}

export interface LifeTableRecord {
  geo: string;
  year: number;
  age: number;
  survival: number | null;
  e0: number | null;
  source: string;
  retrieved_at: string;
  note?: string;
}

export interface MigrationScheduleRecord {
  geo: string;
  year: number;
  age: number;
  shape_m: number | null;
  net_migrants: number | null;
  source: string;
  retrieved_at: string;
  note?: string;
}

const validatePopulationByAge = validator<PopulationByAgeRecord[]>('populationByAge');
const validateFertilitySchedule = validator<FertilityScheduleRecord[]>('fertilitySchedule');
const validateLifeTable = validator<LifeTableRecord[]>('lifeTable');
const validateMigrationSchedule = validator<MigrationScheduleRecord[]>('migrationSchedule');

export function parsePopulationByAge(json: unknown): PopulationByAgeRecord[] {
  if (validatePopulationByAge(json)) return json;
  throw new Error(`Invalid population by age data: ${errorsText(validatePopulationByAge.errors)}`);
}

export function parseFertilitySchedule(json: unknown): FertilityScheduleRecord[] {
  if (validateFertilitySchedule(json)) return json;
  throw new Error(`Invalid fertility schedule data: ${errorsText(validateFertilitySchedule.errors)}`);
}

export function parseLifeTable(json: unknown): LifeTableRecord[] {
  if (validateLifeTable(json)) return json;
  throw new Error(`Invalid life table data: ${errorsText(validateLifeTable.errors)}`);
}

export function parseMigrationSchedule(json: unknown): MigrationScheduleRecord[] {
  if (validateMigrationSchedule(json)) return json;
  throw new Error(`Invalid migration schedule data: ${errorsText(validateMigrationSchedule.errors)}`);
}
