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
