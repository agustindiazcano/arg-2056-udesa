/** Distribute red uniforms evenly among detailed infantry, rounded to the nearest soldier. */
export function detailedInfantryModel(index: number): 'soldier-red' | 'soldier-blue' {
  return Math.round((index + 1) * 0.3) > Math.round(index * 0.3) ? 'soldier-red' : 'soldier-blue';
}
