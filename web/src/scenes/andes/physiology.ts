/**
 * What the body can do at altitude, as a rough estimate for the screen. This is NOT a measurement of the men of 1817: it is the
 * known shape of the loss of maximal oxygen uptake (VO2 max) with height, about 7% per 1,000 m from 300 m and faster above
 * 3,000 m (11% per 1,000 m), as a share of the capacity at sea level.
 */
const FROM_M = 300;
const BREAK_M = 3000;
const LOSS_LOW = 0.07;
const LOSS_HIGH = 0.11;
const FLOOR = 0.2;

/** The share of the sea-level VO2 max left at this altitude, 0.2 to 1, or null when the altitude is not known. */
export function vo2MaxShare(altitudeM: number | null): number | null {
  if (altitudeM === null) return null;
  const low = Math.max(0, Math.min(altitudeM, BREAK_M) - FROM_M) / 1000;
  const high = Math.max(0, altitudeM - BREAK_M) / 1000;
  return Math.min(1, Math.max(FLOOR, 1 - LOSS_LOW * low - LOSS_HIGH * high));
}
