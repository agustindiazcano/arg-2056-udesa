export const APP_LOCALE = 'en-US'; // Default for v1 placeholders, can be updated later

export function formatValue(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return '-';
  
  const options: Intl.NumberFormatOptions = {
    maximumFractionDigits: 1
  };
  
  if (Math.abs(value) >= 10000) {
    options.notation = 'compact';
    options.compactDisplay = 'short';
  }
  
  const formatted = new Intl.NumberFormat(APP_LOCALE, options).format(value);
  return `${formatted} ${unit}`;
}

/** 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", 11 -> "11th", 21 -> "21st". */
export function ordinal(n: number): string {
  const lastTwo = n % 100;
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? 'th' : (suffixes[n % 10] ?? 'th');
  return `${n}${suffix}`;
}
