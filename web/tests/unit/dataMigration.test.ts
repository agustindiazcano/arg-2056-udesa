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

  // Slide 6 ("Qué miran los inversores", made-up 0-10 scores with no source) was removed by the human on 2026-10-14.
  // Slide 11 (shares of the exports) was merged into slide 4 (Exports) on the same day: its table lives there now.
  // Tables whose cells were corrected on purpose on 2026-10-14 (task/revalidate-sources): Taca Taca capex 3.583 -> 4.232 (NI 43-101) and
  // the RIGI approval of Bajo del Choique-La Invernada. Their columns are still compared; their rows are checked in the tests of the new data.
  const CORRECTED = ['rigi-mining', 'rigi-oil-gas'];
  const REMOVED = ['6'];
  const MOVED: Record<string, string> = { '11': '4' };
  const kept = fixture.filter((s) => !REMOVED.includes(s.id));
  const remaining = kept.filter((s) => !(s.id in MOVED));

  it('keeps every slide of main except the removed and the merged ones', () => {
    // the order of the slides changed on 2026-10-15 (14 goes after 1): the same slides, not the same order
    expect(slides.map((s) => s.id).sort()).toEqual(remaining.map((s) => s.id).sort());
  });

  it.each(kept.map((s) => [s.id, s] as const))('slide %s keeps its tables cell by cell', (_id, old) => {
    const now = slides.find((s) => s.id === (MOVED[old.id] ?? old.id))!;
    for (const ref of old.refs) expect(now.refs, ref).toContain(ref);
    for (const t of old.tables) {
      const n = now.tables.find((x) => x.id === t.id);
      expect(n, `table ${t.id} of slide ${old.id}`).toBeDefined();
      // the rule of 70 slide was retitled on purpose on 2026-10-15 (human order): the title of its first table follows it
      if (t.id !== 'chart-5') expect(n!.title, t.id).toBe(t.title);
      expect(n!.columns, t.id).toEqual(t.columns);
      // the fixture is JSON, where -0 is written as 0 (same number): compare through the same serialization
      if (CORRECTED.includes(t.id)) continue;
      expect(JSON.parse(JSON.stringify(n!.rows)), t.id).toEqual(t.rows);
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
      const info = STEP_INFO[step];
      if (!info) continue; // chart-11 lives in the Exports slide now and has no panel of its own
      const data = info.data;
      if (data === 'prueba') expect(q, `chart-${step}`).toBe('placeholder');
      if (data === 'real') expect(q, `chart-${step}`).not.toBe('placeholder');
      if (data === 'parcial') expect(q, `chart-${step}`).toBe('partial');
    }
  });

  it('marks as placeholder the tables that are made up and as real the ones that are not', () => {
    const q = (id: string) => slides.flatMap((s) => s.tables).find((t) => t.id === id)!.quality;
    for (const id of ['provinces', 'provinces-value', 'chart-3', 'chart-10', 'chart-13', 'factors']) expect(q(id), id).toBe('placeholder');
    for (const id of ['gdp-real', 'hydrocarbons-provinces', 'complexes', 'oil-gas-national', 'agro-production', 'reserves', 'external-oecd']) expect(q(id), id).toBe('real');
  });
});
