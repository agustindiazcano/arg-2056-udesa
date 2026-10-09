import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { battleFacts, forceText, parseAndesEvents, precisionLabel, rangeText } from '../../src/scenes/andes/data';

const mock = JSON.parse(readFileSync(new URL('../../../data/mock/andes_events.json', import.meta.url), 'utf8')) as unknown;

describe('parseAndesEvents', () => {
  it('parses the mock file', () => {
    const events = parseAndesEvents(mock);
    expect(events.filter((e) => !e.column_id)).toHaveLength(13);
    expect(events.filter((e) => e.column_id).length).toBeGreaterThan(20);
    expect(events[0]!.id).toBe('andes-01');
  });

  it('throws with the reason when the data is invalid', () => {
    expect(() => parseAndesEvents([{ id: 'x' }])).toThrow(/andes events/i);
    expect(() => parseAndesEvents({})).toThrow();
  });

  it('rejects a count that is null with no note', () => {
    const bad = [
      {
        id: 'a',
        name: 'A',
        day_of_campaign: 0,
        date: '1817-01-19',
        date_precision: 'day',
        lat: -33,
        lon: -69,
        elevation_m: null,
        forces: [{ side: 'S', men: null }],
        source: 'T',
        retrieved_at: '2026-01-01'
      }
    ];
    expect(() => parseAndesEvents(bad)).toThrow();
  });
});

describe('forceText', () => {
  it('shows the count with the side', () => {
    expect(forceText({ side: 'Columna', men: 3500 })).toBe('Columna: 3.500');
  });

  it('shows the note, never 0, when the count is not known', () => {
    const text = forceText({ side: 'Opuestas', men: null, note: 'Sin datos' });
    expect(text).toBe('Opuestas: sin dato (Sin datos)');
    expect(text).not.toMatch(/\b0\b/);
  });
});

describe('precisionLabel', () => {
  it('says how sure the date is', () => {
    expect(precisionLabel('day')).toBe('fecha exacta');
    expect(precisionLabel('month')).toBe('mes');
    expect(precisionLabel('year')).toBe('año');
    expect(precisionLabel('approximate')).toBe('fecha aproximada');
  });
});

describe('rangeText', () => {
  it('writes the estimate range, and nothing when there is none', () => {
    expect(rangeText({ min: 3000, max: 4500 })).toBe('entre 3.000 y 4.500');
    expect(rangeText(undefined)).toBeNull();
  });
});

describe('battleFacts', () => {
  const [first, third] = [parseAndesEvents(mock)[0]!, { ...parseAndesEvents(mock)[2]!, elevation_m: null }];

  it('lists the date, the place, the altitude and the forces of an event', () => {
    const facts = battleFacts(first);
    expect(facts.find((f) => f.label === 'Fecha')!.value).toMatch(/19 de enero de 1817/);
    expect(facts.find((f) => f.label === 'Altitud')!.value).toBe('706 m');
    expect(facts.find((f) => f.label === 'Lugar')!.value).toMatch(/32,8470° S/);
  });

  it('says the altitude is unknown, never 0 m, when it is null', () => {
    const alt = battleFacts(third).find((f) => f.label === 'Altitud')!;
    expect(alt.value).toBe('sin dato');
    expect(alt.value).not.toMatch(/^0/);
  });
});
