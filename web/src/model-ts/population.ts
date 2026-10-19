function isFiniteArray(arr: number[]): boolean {
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i]!)) {
      return false;
    }
  }
  return true;
}

function validateStepInputs(
  nT: number[],
  survival: number[],
  fertility: number[],
  migration: number[]
): void {
  const aLen = nT.length;
  if (aLen < 2) {
    throw new Error(`step_population needs at least 2 age groups, got ${aLen}`);
  }

  if (survival.length !== aLen) {
    throw new Error(`step_population: survival has length ${survival.length}, expected ${aLen}`);
  }
  if (fertility.length !== aLen) {
    throw new Error(`step_population: fertility has length ${fertility.length}, expected ${aLen}`);
  }
  if (migration.length !== aLen) {
    throw new Error(`step_population: migration has length ${migration.length}, expected ${aLen}`);
  }

  if (!isFiniteArray(nT)) {
    throw new Error('step_population: n_t contains a value that is not finite');
  }
  if (!isFiniteArray(survival)) {
    throw new Error('step_population: survival contains a value that is not finite');
  }
  if (!isFiniteArray(fertility)) {
    throw new Error('step_population: fertility contains a value that is not finite');
  }
  if (!isFiniteArray(migration)) {
    throw new Error('step_population: migration contains a value that is not finite');
  }

  for (let i = 0; i < aLen; i++) {
    const s = survival[i]!;
    if (s < 0 || s > 1) {
      throw new Error('step_population: survival must be between 0 and 1');
    }
  }

  for (let i = 0; i < aLen; i++) {
    if (fertility[i]! < 0) {
      throw new Error('step_population: fertility must not be negative');
    }
  }

  for (let i = 0; i < aLen; i++) {
    if (nT[i]! < 0) {
      throw new Error('step_population: n_t must not be negative');
    }
  }
}

function validateMatrixShape(
  name: string,
  mat: number[][],
  tYears: number,
  aLen: number
): void {
  if (mat.length !== tYears) {
    const cols = mat.length > 0 ? mat[0]!.length : 0;
    throw new Error(
      `project_population: ${name} must have shape (${tYears}, ${aLen}), got (${mat.length}, ${cols})`
    );
  }
  for (let i = 0; i < mat.length; i++) {
    if (mat[i]!.length !== aLen) {
      throw new Error(
        `project_population: ${name} must have shape (${tYears}, ${aLen}), got (${mat.length}, ${mat[i]!.length})`
      );
    }
  }
}

/**
 * Steps the cohort population model forward by one year.
 *
 * @param nT - Population by age group at time t. Array of length A.
 * @param survival - Survival rate from age a to a+1. Array of length A.
 * @param fertility - Births per person of age a. Array of length A.
 * @param migration - Net migration added to age a. Array of length A.
 * @returns Population by age group at time t+1. Array of length A.
 */
export function stepPopulation(
  nT: number[],
  survival: number[],
  fertility: number[],
  migration: number[]
): number[] {
  validateStepInputs(nT, survival, fertility, migration);

  const aLen = nT.length;
  const nNext = new Array<number>(aLen).fill(0);

  // Age 0: births from all ages
  let births = 0;
  for (let i = 0; i < aLen; i++) {
    births += nT[i]! * fertility[i]!;
  }
  nNext[0] = births + migration[0]!;

  // Age 1 to A-2: previous age survivors + migration
  for (let i = 1; i < aLen - 1; i++) {
    nNext[i] = nT[i - 1]! * survival[i - 1]! + migration[i]!;
  }

  // Age A-1 (open interval)
  nNext[aLen - 1] =
    nT[aLen - 2]! * survival[aLen - 2]! +
    nT[aLen - 1]! * survival[aLen - 1]! +
    migration[aLen - 1]!;

  for (let i = 0; i < aLen; i++) {
    const val = nNext[i]!;
    if (val < 0) {
      throw new Error(`step_population: negative population in age group ${i}: ${val}`);
    }
  }

  return nNext;
}

/**
 * Projects the population forward for T years.
 *
 * @param nT0 - Initial population. Array of length A.
 * @param survival - Survival rate matrix. T arrays of length A.
 * @param fertility - Fertility rate matrix. T arrays of length A.
 * @param migration - Net migration matrix. T arrays of length A.
 * @returns Population trajectory. (T+1) arrays of length A.
 */
export function projectPopulation(
  nT0: number[],
  survival: number[][],
  fertility: number[][],
  migration: number[][]
): number[][] {
  const tYears = survival.length;
  const aLen = nT0.length;

  validateMatrixShape('survival', survival, tYears, aLen);
  validateMatrixShape('fertility', fertility, tYears, aLen);
  validateMatrixShape('migration', migration, tYears, aLen);

  const nAll: number[][] = [nT0.slice()]; // slice to copy

  for (let t = 0; t < tYears; t++) {
    try {
      const nextStep = stepPopulation(
        nAll[t]!,
        survival[t]!,
        fertility[t]!,
        migration[t]!
      );
      nAll.push(nextStep);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`project_population: year ${t}: ${msg}`);
    }
  }

  return nAll;
}
