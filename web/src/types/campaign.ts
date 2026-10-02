export type DayOfCampaign = number & { readonly __brand: 'DayOfCampaign' };

export function parseDayOfCampaign(n: unknown): DayOfCampaign {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 365) {
    throw new RangeError('DayOfCampaign must be an integer between 0 and 365');
  }
  return n as DayOfCampaign;
}
