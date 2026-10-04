export const APP_LOCALE = 'es-AR';

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

/** 1 -> "1.º", 2 -> "2.º", 11 -> "11.º" (Spanish masculine ordinal). */
export function ordinal(n: number): string {
  return `${n}.º`;
}

/** The ticks of a value axis, short: 2500000000000 -> "2,5 B", 1500000 -> "1,5 M". */
export function formatAxisNumber(value: number): string {
  return new Intl.NumberFormat(APP_LOCALE, { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(value);
}

/** A number with a fixed count of decimals in es-AR: (1082.4, 1) -> "1.082,4", (14, 1) -> "14,0". */
export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat(APP_LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

/** A number with up to two decimals and none when it is whole: 7 -> "7", 5.5 -> "5,5". */
export function formatDecimal(value: number): string {
  return new Intl.NumberFormat(APP_LOCALE, { maximumFractionDigits: 2 }).format(value);
}

/** 144.44 -> "144,4%"; `signed` forces the plus sign on gaps ("+144,4%"). */
export function formatPercent(value: number, opts: { signed?: boolean } = {}): string {
  return `${opts.signed && value >= 0 ? '+' : ''}${formatNumber(value, 1)}%`;
}

/** An ISO date ("2026-10-04") as "4 de octubre de 2026"; anything that is not a date comes back unchanged. */
export function formatDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(APP_LOCALE, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}
