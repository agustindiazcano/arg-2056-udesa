export const YEAR_MIN = 1810;
export const YEAR_MAX = 2056;

export type Year = number & { readonly __brand: 'Year' };

export function parseYear(n: unknown): Year {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < YEAR_MIN || n > YEAR_MAX) {
    throw new RangeError(`Year must be an integer between ${YEAR_MIN} and ${YEAR_MAX}`);
  }
  return n as Year;
}
