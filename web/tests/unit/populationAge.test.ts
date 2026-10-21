import { describe, expect, it } from 'vitest';
import {
  parseFertilitySchedule,
  parseLifeTable,
  parseMigrationSchedule,
  parsePopulationByAge,
  type FertilityScheduleRecord,
  type LifeTableRecord,
  type MigrationScheduleRecord,
  type PopulationByAgeRecord,
} from '../../src/types/populationAge';

const validPopulationByAge: PopulationByAgeRecord[] = [
  {
    geo: 'AR',
    year: 2000,
    age: 0,
    sex: 'both',
    persons: 700000,
    source: 'MOCK',
    retrieved_at: '2026-10-02',
  },
];

const validFertilitySchedule: FertilityScheduleRecord[] = [
  {
    geo: 'AR',
    year: 2000,
    age: 20,
    shape_f: 0.05,
    female_share: 0.49,
    tfr: 2.3,
    source: 'MOCK',
    retrieved_at: '2026-10-02',
  },
];

const validLifeTable: LifeTableRecord[] = [
  {
    geo: 'AR',
    year: 2000,
    age: 0,
    survival: 0.985,
    e0: 74.2,
    source: 'MOCK',
    retrieved_at: '2026-10-02',
  },
];

const validMigrationSchedule: MigrationScheduleRecord[] = [
  {
    geo: 'AR',
    year: 2000,
    age: 20,
    shape_m: 0.03,
    net_migrants: 5000,
    source: 'MOCK',
    retrieved_at: '2026-10-02',
  },
];

describe('populationAge parsers', () => {
  describe('parsePopulationByAge', () => {
    it('accepts valid records', () => {
      expect(parsePopulationByAge(validPopulationByAge)).toEqual(validPopulationByAge);
    });

    it('rejects invalid records with validator message', () => {
      const invalid = [{ geo: 'INVALID' }];
      expect(() => parsePopulationByAge(invalid)).toThrow(/Invalid population by age data:/);
    });
  });

  describe('parseFertilitySchedule', () => {
    it('accepts valid records', () => {
      expect(parseFertilitySchedule(validFertilitySchedule)).toEqual(validFertilitySchedule);
    });

    it('rejects invalid records with validator message', () => {
      const invalid = [{ geo: 'AR', age: -1 }];
      expect(() => parseFertilitySchedule(invalid)).toThrow(/Invalid fertility schedule data:/);
    });
  });

  describe('parseLifeTable', () => {
    it('accepts valid records', () => {
      expect(parseLifeTable(validLifeTable)).toEqual(validLifeTable);
    });

    it('rejects invalid records with validator message', () => {
      const invalid = [{ survival: 1.5 }];
      expect(() => parseLifeTable(invalid)).toThrow(/Invalid life table data:/);
    });
  });

  describe('parseMigrationSchedule', () => {
    it('accepts valid records', () => {
      expect(parseMigrationSchedule(validMigrationSchedule)).toEqual(validMigrationSchedule);
    });

    it('rejects invalid records with validator message', () => {
      const invalid = [{ age: 105 }];
      expect(() => parseMigrationSchedule(invalid)).toThrow(/Invalid migration schedule data:/);
    });
  });
});
