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
  if (aLen > 1) {
    nNext[aLen - 1] =
      nT[aLen - 2]! * survival[aLen - 2]! +
      nT[aLen - 1]! * survival[aLen - 1]! +
      migration[aLen - 1]!;
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
  const nAll: number[][] = [nT0.slice()]; // slice to copy

  for (let t = 0; t < tYears; t++) {
    const nextStep = stepPopulation(
      nAll[t]!,
      survival[t]!,
      fertility[t]!,
      migration[t]!
    );
    nAll.push(nextStep);
  }

  return nAll;
}
