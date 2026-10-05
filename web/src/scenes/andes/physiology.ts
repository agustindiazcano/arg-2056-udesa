/**
 * What the blood carries at altitude, as a rough estimate for the screen. This is NOT a measurement of the men of 1817, and it
 * changes a lot from one person to another (fitness, acclimatization, how long they have been up): it is the usual shape of
 * the resting oxygen saturation of the blood (SpO2) with height, about 98% up to 1,000 m, 2 points less for every 1,000 m up to
 * 3,000 m, and 4 points less for every 1,000 m above that.
 */
const SEA_LEVEL = 98;
const FROM_M = 1000;
const BREAK_M = 3000;
const LOSS_LOW = 2;
const LOSS_HIGH = 4;
const FLOOR = 70;

/** The estimated SpO2 in percent at this altitude, 70 to 98, or null when the altitude is not known. */
export function spo2Estimate(altitudeM: number | null): number | null {
  if (altitudeM === null) return null;
  const low = Math.max(0, Math.min(altitudeM, BREAK_M) - FROM_M) / 1000;
  const high = Math.max(0, altitudeM - BREAK_M) / 1000;
  return Math.min(SEA_LEVEL, Math.max(FLOOR, SEA_LEVEL - LOSS_LOW * low - LOSS_HIGH * high));
}
