import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { countryName, flagEmoji, parseVisits, summarize } from '../../src/analytics/visits';

const archive = parseVisits({
  source: 'Vercel Web Analytics API',
  retrieved_at: '2026-10-10',
  note: 'n',
  days: {
    '2026-10-01': { AR: { pageviews: 10, visitors: 4 }, US: { pageviews: 3, visitors: 2 } },
    '2026-10-02': { AR: { pageviews: 5, visitors: 3 }, unknown: { pageviews: 1, visitors: 1 } },
    '2026-10-03': {}
  }
});

describe('flagEmoji', () => {
  it('builds the flag from the two letters as regional indicator symbols', () => {
    expect(flagEmoji('AR')).toBe('\u{1F1E6}\u{1F1F7}');
    expect(flagEmoji('us')).toBe('\u{1F1FA}\u{1F1F8}');
  });
  it('is empty for anything that is not a 2-letter code', () => {
    expect(flagEmoji('unknown')).toBe('');
    expect(flagEmoji('')).toBe('');
    expect(flagEmoji('A1')).toBe('');
  });
});

describe('countryName', () => {
  it('gives the English name of the region', () => {
    expect(countryName('AR')).toBe('Argentina');
    expect(countryName('US')).toBe('United States');
  });
  it('says Unknown for the unknown bucket and keeps an unrecognised code as it is', () => {
    expect(countryName('unknown')).toBe('Unknown');
    expect(countryName('ZZ')).toBe('Unknown Region');
  });
});

describe('summarize', () => {
  const s = summarize(archive);

  it('adds the daily visitors and page views of every day and country', () => {
    expect(s.visitors).toBe(10);
    expect(s.pageviews).toBe(19);
  });

  it('lists one row per country, the one with most visitors first', () => {
    expect(s.countries).toEqual([
      { code: 'AR', name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}', visitors: 7, pageviews: 15 },
      { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', visitors: 2, pageviews: 3 },
      { code: 'unknown', name: 'Unknown', flag: '', visitors: 1, pageviews: 1 }
    ]);
  });

  it('counts the archived days, including a day without visits, and gives the first and last', () => {
    expect(s.days).toBe(3);
    expect(s.firstDay).toBe('2026-10-01');
    expect(s.lastDay).toBe('2026-10-03');
  });

  it('breaks ties by page views and then by name', () => {
    const tied = summarize(
      parseVisits({
        source: 's',
        retrieved_at: null,
        days: { '2026-10-01': { BR: { pageviews: 1, visitors: 1 }, AR: { pageviews: 1, visitors: 1 }, CL: { pageviews: 9, visitors: 1 } } }
      })
    );
    expect(tied.countries.map((c) => c.code)).toEqual(['CL', 'AR', 'BR']);
  });

  it('an empty archive has zero totals, no countries and no dates', () => {
    expect(summarize(parseVisits({ source: 's', retrieved_at: null, days: {} }))).toEqual({
      visitors: 0,
      pageviews: 0,
      countries: [],
      days: 0,
      firstDay: null,
      lastDay: null
    });
  });
});

describe('parseVisits', () => {
  it('rejects what is not an archive, naming the problem', () => {
    expect(() => parseVisits(null)).toThrow('visits archive: not an object');
    expect(() => parseVisits({ source: 's', retrieved_at: null })).toThrow('visits archive: days is missing');
    expect(() => parseVisits({ source: 's', retrieved_at: null, days: { 'Oct 1': {} } })).toThrow('visits archive: bad day "Oct 1"');
    expect(() => parseVisits({ source: 's', retrieved_at: null, days: { '2026-10-01': { AR: { pageviews: 1 } } } })).toThrow(
      'visits archive: 2026-10-01 AR has no valid visitors'
    );
    expect(() => parseVisits({ source: 's', retrieved_at: null, days: { '2026-10-01': { AR: { pageviews: -1, visitors: 1 } } } })).toThrow(
      'visits archive: 2026-10-01 AR has no valid pageviews'
    );
  });
});

describe('the committed archive', () => {
  it('is valid', () => {
    const file = path.resolve(__dirname, '../../public/analytics/visits.json');
    expect(() => parseVisits(JSON.parse(fs.readFileSync(file, 'utf8')))).not.toThrow();
  });
});
