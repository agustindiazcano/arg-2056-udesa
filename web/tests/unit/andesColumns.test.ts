import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseAndesEvents } from '../../src/scenes/andes/data';
import type { AndesEvent } from '../../src/scenes/andes/data';
import { campaignEndDay, columnColor, positionOfColumn, splitColumns } from '../../src/scenes/andes/columns';
import { buildRoute } from '../../src/scenes/andes/timeline';

const events = parseAndesEvents(JSON.parse(readFileSync(new URL('../../../data/mock/andes_events.json', import.meta.url), 'utf8')) as unknown);

const ev = (id: string, day: number, lon: number, lat: number, column?: string): AndesEvent => ({
  id,
  name: id,
  day_of_campaign: day,
  date: '1817-01-19',
  date_precision: 'day',
  lat,
  lon,
  elevation_m: 1000,
  forces: [],
  source: 's',
  retrieved_at: '2026-10-09',
  ...(column ? { column_id: column, column_name: `Columna ${column}` } : {})
});

describe('splitColumns', () => {
  const split = splitColumns([ev('m1', 0, -69, -32), ev('c1', -3, -68, -31, 'a'), ev('m2', 5, -70, -32), ev('c2', 4, -69, -30, 'a'), ev('d1', 0, -69, -35, 'b')]);

  it('keeps the events without a column as the main one, in the order they came', () => {
    expect(split.main.map((e) => e.id)).toEqual(['m1', 'm2']);
  });

  it('groups the others by column, with a route each (ordered by day, with its name)', () => {
    expect(split.columns.map((c) => c.id)).toEqual(['a', 'b']);
    const a = split.columns[0]!;
    expect(a.name).toBe('Columna a');
    expect(a.route.points.map((p) => p.id)).toEqual(['c1', 'c2']);
  });
});

describe('campaignEndDay', () => {
  it('is the last day of any column, so the clock does not stop before the last one arrives', () => {
    const { main, columns } = splitColumns([ev('m1', 0, -69, -32), ev('m2', 5, -70, -32), ev('c1', -3, -68, -31, 'a'), ev('c2', 9, -69, -30, 'a')]);
    expect(campaignEndDay(buildRoute(main), columns)).toBe(9);
  });

  it('is the main one when no column goes on later', () => {
    const { main, columns } = splitColumns([ev('m1', 0, -69, -32), ev('m2', 12, -70, -32), ev('c1', -3, -68, -31, 'a'), ev('c2', 9, -69, -30, 'a')]);
    expect(campaignEndDay(buildRoute(main), columns)).toBe(12);
  });
});

describe('positionOfColumn', () => {
  const { columns } = splitColumns([ev('c1', -4, -68, -31, 'a'), ev('c2', 6, -70, -31, 'a')]);
  const a = columns[0]!;

  it('is at the first place until the column leaves and at the last one after it arrives', () => {
    expect(positionOfColumn(a, -10)).toMatchObject({ lon: -68, lat: -31 });
    expect(positionOfColumn(a, 40)).toMatchObject({ lon: -70, lat: -31 });
  });

  it('is on the way in between', () => {
    expect(positionOfColumn(a, 1)!.lon).toBeCloseTo(-69, 6);
  });
});

describe('the real data of the crossing', () => {
  const { main, columns } = splitColumns(events);

  it('has the main column and the five others, each marching toward the west', () => {
    expect(main.length).toBeGreaterThanOrEqual(10);
    expect(columns.map((c) => c.id).sort()).toEqual(['cabot', 'freire', 'las-heras', 'lemos', 'zelada']);
    for (const c of columns) expect(c.route.points.length).toBeGreaterThanOrEqual(3);
  });

  it('meets the artillery and logistics column with the main one at the same place and day before the battle', () => {
    const heras = columns.find((c) => c.id === 'las-heras')!;
    const curimon = main.find((e) => e.name.startsWith('Curimón'))!;
    const there = heras.route.points.find((p) => p.name.startsWith('Curimón'))!;
    expect([there.lon, there.lat, there.day_of_campaign]).toEqual([curimon.lon, curimon.lat, curimon.day_of_campaign]);
    expect(curimon.day_of_campaign).toBeLessThan(main[main.length - 1]!.day_of_campaign);
  });

  it('runs the clock to the arrival of the last column', () => {
    expect(campaignEndDay(buildRoute(main), columns)).toBeGreaterThanOrEqual(main[main.length - 1]!.day_of_campaign);
  });
});

describe('columnColor', () => {
  it('gives each column its own color and a fallback to the others', () => {
    expect(columnColor('las-heras')).not.toBe(columnColor('cabot'));
    expect(columnColor('unknown')).toMatch(/^#/);
  });
});
