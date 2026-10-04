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

/** 144.44 -> "144,4%"; `signed` forces the plus sign on gaps ("+144,4%"). */
export function formatPercent(value: number, opts: { signed?: boolean } = {}): string {
  const text = new Intl.NumberFormat(APP_LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  return `${opts.signed && value >= 0 ? '+' : ''}${text}%`;
}

/** An ISO date ("2026-10-04") as "4 de octubre de 2026"; anything that is not a date comes back unchanged. */
export function formatDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(APP_LOCALE, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}
