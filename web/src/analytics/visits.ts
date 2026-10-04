/** The archive written by scripts/sync_visits.py: page views and visitors per day and country. */
export interface VisitCounts {
  pageviews: number;
  visitors: number;
}

export interface VisitsArchive {
  source: string;
  retrieved_at: string | null;
  note?: string;
  days: Record<string, Record<string, VisitCounts>>;
}

export interface CountryRow extends VisitCounts {
  /** 2-letter code, or "unknown" */
  code: string;
  name: string;
  /** the flag emoji, or '' when there is none */
  flag: string;
}

export interface VisitsSummary extends VisitCounts {
  countries: CountryRow[];
  days: number;
  firstDay: string | null;
  lastDay: string | null;
}

const UNKNOWN = 'unknown';
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function count(value: unknown, day: string, code: string, key: keyof VisitCounts): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`visits archive: ${day} ${code} has no valid ${key}`);
  }
  return value;
}

/** Validates the parsed JSON of the archive. Throws an Error that names the first problem. */
export function parseVisits(json: unknown): VisitsArchive {
  if (typeof json !== 'object' || json === null) throw new Error('visits archive: not an object');
  const raw = json as Record<string, unknown>;
  if (typeof raw.days !== 'object' || raw.days === null) throw new Error('visits archive: days is missing');
  const days: VisitsArchive['days'] = {};
  for (const [day, countries] of Object.entries(raw.days)) {
    if (!DAY.test(day) || typeof countries !== 'object' || countries === null) throw new Error(`visits archive: bad day "${day}"`);
    days[day] = {};
    for (const [code, entry] of Object.entries(countries)) {
      const e = (entry ?? {}) as Record<string, unknown>;
      days[day][code] = { pageviews: count(e.pageviews, day, code, 'pageviews'), visitors: count(e.visitors, day, code, 'visitors') };
    }
  }
  return {
    source: String(raw.source ?? ''),
    retrieved_at: typeof raw.retrieved_at === 'string' ? raw.retrieved_at : null,
    note: typeof raw.note === 'string' ? raw.note : undefined,
    days
  };
}

/**
 * The flag of a country as an emoji: the two letters as regional indicator symbols. Browsers on Windows draw these two
 * symbols as the letters (e.g. "AR"); the other systems draw the flag. '' for anything that is not a 2-letter code.
 */
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  return [...code.toUpperCase()].map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65)).join('');
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

/** The English name of the country; "Unknown" for the bucket the archive keeps for visits without a country. */
export function countryName(code: string): string {
  if (code === UNKNOWN) return 'Unknown';
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Totals over every archived day, and the countries by visitors (then page views, then name). */
export function summarize(archive: VisitsArchive): VisitsSummary {
  const byCountry = new Map<string, VisitCounts>();
  let visitors = 0;
  let pageviews = 0;
  for (const countries of Object.values(archive.days)) {
    for (const [code, c] of Object.entries(countries)) {
      const total = byCountry.get(code) ?? { pageviews: 0, visitors: 0 };
      total.pageviews += c.pageviews;
      total.visitors += c.visitors;
      byCountry.set(code, total);
      visitors += c.visitors;
      pageviews += c.pageviews;
    }
  }
  const countries = [...byCountry].map(([code, c]) => ({ code, name: countryName(code), flag: flagEmoji(code), ...c }));
  countries.sort((a, b) => b.visitors - a.visitors || b.pageviews - a.pageviews || a.name.localeCompare(b.name));
  const dayKeys = Object.keys(archive.days).sort();
  return {
    visitors,
    pageviews,
    countries,
    days: dayKeys.length,
    firstDay: dayKeys[0] ?? null,
    lastDay: dayKeys[dayKeys.length - 1] ?? null
  };
}
