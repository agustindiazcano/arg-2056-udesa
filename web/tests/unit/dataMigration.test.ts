import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/dataTables.main.json';
import { buildSlides } from '../../src/datasets/slides';
import { TABLE_META } from '../../src/datasets/quality';
import { STEP_INFO } from '../../src/tour/stepInfo';
import { validateMeta } from '../../src/data/series';

// The fixture was generated from `main` before the series schema existed (tests/fixtures/dataTables.main.json).
// A migration may add values to the Data page, never change or remove them.
describe('the Data page after the series migration', () => {
  const slides = buildSlides();

  it('keeps every slide of main', () => {
    expect(slides.map((s) => s.id)).toEqual(fixture.map((s) => s.id));
  });

  it.each(fixture.map((s) => [s.id, s] as const))('slide %s keeps its tables cell by cell', (_id, old) => {
    const now = slides.find((s) => s.id === old.id)!;
    expect(now.refs).toEqual(old.refs);
    expect(now.tables.map((t) => t.id)).toEqual(old.tables.map((t) => t.id));
    for (const t of old.tables) {
      const n = now.tables.find((x) => x.id === t.id)!;
      expect(n.title, t.id).toBe(t.title);
      expect(n.columns, t.id).toEqual(t.columns);
      // the fixture is JSON, where -0 is written as 0 (same number): compare through the same serialization
      expect(JSON.parse(JSON.stringify(n.rows)), t.id).toEqual(t.rows);
    }
  });

  it('gives every table a quality, a source and a retrieval date', () => {
    for (const s of slides) {
      for (const t of s.tables) {
        expect(t.quality, `${s.id}/${t.id}`).toBeDefined();
        expect(validateMeta({ quality: t.quality!, source: t.source ?? '', retrieved_at: t.retrievedAt ?? null }), `${s.id}/${t.id}`).toEqual([]);
      }
    }
  });

  it('has no entry in the registry for a table that does not exist', () => {
    const ids = new Set(slides.flatMap((s) => s.tables.map((t) => t.id)));
    for (const id of Object.keys(TABLE_META)) expect(ids.has(id), id).toBe(true);
  });

  it('agrees with the state of each slide in the side panel', () => {
    const quality = new Map(slides.flatMap((s) => s.tables.map((t) => [t.id, t.quality] as const)));
    for (let step = 0; step <= 13; step += 1) {
      const q = quality.get(`chart-${step}`);
      if (q === undefined) continue;
      const data = STEP_INFO[step]!.data;
      if (data === 'prueba') expect(q, `chart-${step}`).toBe('placeholder');
      if (data === 'real') expect(q, `chart-${step}`).not.toBe('placeholder');
      if (data === 'parcial') expect(q, `chart-${step}`).toBe('partial');
    }
  });

  it('marks as placeholder the tables that are made up and as real the ones that are not', () => {
    const q = (id: string) => slides.flatMap((s) => s.tables).find((t) => t.id === id)!.quality;
    for (const id of ['provinces', 'provinces-value', 'chart-3', 'chart-6', 'chart-10', 'chart-13', 'factors']) expect(q(id), id).toBe('placeholder');
    for (const id of ['gdp-real', 'hydrocarbons-provinces', 'complexes', 'oil-gas-national', 'agro-production', 'reserves', 'external-oecd']) expect(q(id), id).toBe('real');
  });
});
