import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { projectPopulation } from '../../src/model-ts/population';

const PARITY_FILE = path.join(__dirname, '../../../model/parity/population_parity.json');

describe('Population Model Parity', () => {
  it('should match python golden vectors', () => {
    const data = JSON.parse(fs.readFileSync(PARITY_FILE, 'utf-8'));
    
    const nT0: number[] = data.n_t0;
    const survival: number[][] = data.survival;
    const fertility: number[][] = data.fertility;
    const migration: number[][] = data.migration;
    const expected: number[][] = data.expected;

    const actual = projectPopulation(nT0, survival, fertility, migration);

    expect(actual.length).toBe(expected.length);
    
    // Check elements within a relative tolerance
    for (let t = 0; t < expected.length; t++) {
      expect(actual[t]!.length).toBe(expected[t]!.length);
      for (let a = 0; a < expected[t]!.length; a++) {
        // use toBeCloseTo for float comparisons
        const diff = Math.abs(actual[t]![a]! - expected[t]![a]!);
        // Allow tiny tolerance due to JS float math vs numpy float math
        expect(diff).toBeLessThan(1e-7 * Math.max(1, Math.abs(expected[t]![a]!)));
      }
    }
  });
});
