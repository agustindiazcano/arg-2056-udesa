import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { projectPopulation, stepPopulation } from '../../src/model-ts/population';

const PARITY_FILE = path.join(__dirname, '../../../model/parity/population_parity.json');
const INVALID_FILE = path.join(__dirname, '../../../model/parity/population_invalid.json');

type JsonValue = number | string;
type JsonVector = JsonValue[];
type JsonMatrix = JsonValue[][];

interface StepInputs {
  n_t: JsonVector;
  survival: JsonVector;
  fertility: JsonVector;
  migration: JsonVector;
}

interface ProjectInputs {
  n_t0: JsonVector;
  survival: JsonMatrix;
  fertility: JsonMatrix;
  migration: JsonMatrix;
}

interface InvalidTestCase {
  name: string;
  func: 'step_population' | 'project_population';
  inputs: StepInputs | ProjectInputs;
  expected_error: string;
}

function parseVector(arr: JsonVector): number[] {
  return arr.map((x) => Number(x));
}

function parseMatrix(mat: JsonMatrix): number[][] {
  return mat.map((row) => row.map((x) => Number(x)));
}

function isStepInputs(inputs: StepInputs | ProjectInputs): inputs is StepInputs {
  return 'n_t' in inputs;
}

describe('Population Model Parity and Hardening', () => {
  it('should match python golden vectors', () => {
    const data = JSON.parse(fs.readFileSync(PARITY_FILE, 'utf-8'));

    const nT0: number[] = data.n_t0;
    const survival: number[][] = data.survival;
    const fertility: number[][] = data.fertility;
    const migration: number[][] = data.migration;
    const expected: number[][] = data.expected;

    const actual = projectPopulation(nT0, survival, fertility, migration);

    expect(actual.length).toBe(expected.length);

    for (let t = 0; t < expected.length; t++) {
      expect(actual[t]!.length).toBe(expected[t]!.length);
      for (let a = 0; a < expected[t]!.length; a++) {
        const diff = Math.abs(actual[t]![a]! - expected[t]![a]!);
        expect(diff).toBeLessThan(1e-7 * Math.max(1, Math.abs(expected[t]![a]!)));
      }
    }
  });

  it('F5: non-zero migration[0] hand-computed case', () => {
    // Arithmetic:
    // n_t = [10, 20, 30], survival = [0.5, 0.5, 0.5], fertility = [0, 0.1, 0.1], migration = [4, 0, 0]
    // births = sum(n_t * fertility) = 10*0 + 20*0.1 + 30*0.1 = 5
    // n_next[0] = births + migration[0] = 5 + 4 = 9
    // n_next[1] = 10 * 0.5 + 0 = 5
    // n_next[2] = 20 * 0.5 + 30 * 0.5 + 0 = 10 + 15 = 25
    const nT = [10.0, 20.0, 30.0];
    const survival = [0.5, 0.5, 0.5];
    const fertility = [0.0, 0.1, 0.1];
    const migration = [4.0, 0.0, 0.0];

    const actual = stepPopulation(nT, survival, fertility, migration);
    expect(actual).toEqual([9.0, 5.0, 25.0]);
  });

  it('F8: accepts A = 2, rejects A = 1 and A = 0 with exact error message', () => {
    // A = 2 accepted case:
    // n_t = [100.0, 50.0], survival = [0.8, 0.5], fertility = [0.0, 0.2], migration = [10.0, 5.0]
    // births = 100 * 0.0 + 50 * 0.2 = 10.0
    // n_next[0] = 10.0 + 10.0 = 20.0
    // n_next[1] (open interval) = 100 * 0.8 + 50 * 0.5 + 5.0 = 80.0 + 25.0 + 5.0 = 110.0
    const nT2 = [100.0, 50.0];
    const surv2 = [0.8, 0.5];
    const fert2 = [0.0, 0.2];
    const mig2 = [10.0, 5.0];
    const res2 = stepPopulation(nT2, surv2, fert2, mig2);
    expect(res2).toEqual([20.0, 110.0]);

    // A = 1 rejected
    expect(() => {
      stepPopulation([100.0], [0.8], [0.1], [0.0]);
    }).toThrowError('step_population needs at least 2 age groups, got 1');

    // A = 0 rejected
    expect(() => {
      stepPopulation([], [], [], []);
    }).toThrowError('step_population needs at least 2 age groups, got 0');
  });

  it('F9: rejects invalid inputs with exact error messages from population_invalid.json', () => {
    const rawData = fs.readFileSync(INVALID_FILE, 'utf-8');
    const cases: InvalidTestCase[] = JSON.parse(rawData);

    for (const testCase of cases) {
      if (testCase.func === 'step_population' && isStepInputs(testCase.inputs)) {
        const nT = parseVector(testCase.inputs.n_t);
        const survival = parseVector(testCase.inputs.survival);
        const fertility = parseVector(testCase.inputs.fertility);
        const migration = parseVector(testCase.inputs.migration);

        expect(() => {
          stepPopulation(nT, survival, fertility, migration);
        }, `Case '${testCase.name}' did not throw expected error`).toThrowError(
          testCase.expected_error
        );
      } else if (testCase.func === 'project_population' && !isStepInputs(testCase.inputs)) {
        const nT0 = parseVector(testCase.inputs.n_t0);
        const survival = parseMatrix(testCase.inputs.survival);
        const fertility = parseMatrix(testCase.inputs.fertility);
        const migration = parseMatrix(testCase.inputs.migration);

        expect(() => {
          projectPopulation(nT0, survival, fertility, migration);
        }, `Case '${testCase.name}' did not throw expected error`).toThrowError(
          testCase.expected_error
        );
      }
    }
  });

  it('hand-computed terms separately: births, ageing, open interval, migration', () => {
    // 1. Births term only
    // n_t = [100.0, 50.0, 20.0], fertility = [0.1, 0.2, 0.5]
    // births = 100*0.1 + 50*0.2 + 20*0.5 = 10 + 10 + 10 = 30.0
    // expected = [30.0, 0.0, 0.0]
    const resB = stepPopulation([100.0, 50.0, 20.0], [0.0, 0.0, 0.0], [0.1, 0.2, 0.5], [0.0, 0.0, 0.0]);
    expect(resB).toEqual([30.0, 0.0, 0.0]);

    // 2. Ageing term only (A = 4, ages 1 and 2)
    // age 1 = 40.0 * 0.5 = 20.0
    // age 2 = 60.0 * 0.25 = 15.0
    // expected = [0.0, 20.0, 15.0, 0.0]
    const resA = stepPopulation([40.0, 60.0, 80.0, 100.0], [0.5, 0.25, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0]);
    expect(resA).toEqual([0.0, 20.0, 15.0, 0.0]);

    // 3. Open interval term only (A = 3, age 2)
    // age 2 = 20 * 0.8 + 30 * 0.4 = 16.0 + 12.0 = 28.0
    // expected = [0.0, 0.0, 28.0]
    const resO = stepPopulation([10.0, 20.0, 30.0], [0.0, 0.8, 0.4], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]);
    expect(resO).toEqual([0.0, 0.0, 28.0]);

    // 4. Migration at each age
    // expected = [5.0, 7.0, 12.0]
    const resM = stepPopulation([10.0, 10.0, 10.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [5.0, 7.0, 12.0]);
    expect(resM).toEqual([5.0, 7.0, 12.0]);
  });

  it('conservation criterion C5: sum(n_next) = births + survivors + migration within 1e-9 relative', () => {
    const testCases = [
      {
        nT: [1000.0, 800.0, 600.0, 400.0, 200.0],
        survival: [0.98, 0.95, 0.90, 0.80, 0.60],
        fertility: [0.0, 0.05, 0.12, 0.02, 0.0],
        migration: [50.0, -10.0, 20.0, 5.0, 2.0],
      },
      {
        nT: [500.0, 500.0, 500.0],
        survival: [0.9, 0.85, 0.7],
        fertility: [0.02, 0.08, 0.01],
        migration: [15.0, 25.0, -5.0],
      },
      {
        nT: [25000.0, 20000.0, 15000.0, 10000.0],
        survival: [0.99, 0.98, 0.92, 0.50],
        fertility: [0.0, 0.15, 0.05, 0.0],
        migration: [120.0, -40.0, 85.0, -10.0],
      },
    ];

    for (const tc of testCases) {
      const nNext = stepPopulation(tc.nT, tc.survival, tc.fertility, tc.migration);

      let births = 0;
      for (let i = 0; i < tc.nT.length; i++) {
        births += tc.nT[i]! * tc.fertility[i]!;
      }

      let survivors = 0;
      for (let i = 0; i < tc.nT.length - 1; i++) {
        survivors += tc.nT[i]! * tc.survival[i]!;
      }
      const last = tc.nT.length - 1;
      survivors += tc.nT[last]! * tc.survival[last]!;

      let mig = 0;
      for (let i = 0; i < tc.migration.length; i++) {
        mig += tc.migration[i]!;
      }

      const expectedTotal = births + survivors + mig;
      const actualTotal = nNext.reduce((acc, v) => acc + v, 0);

      const relDiff = Math.abs(actualTotal - expectedTotal) / expectedTotal;
      expect(relDiff).toBeLessThan(1e-9);
    }
  });
});
