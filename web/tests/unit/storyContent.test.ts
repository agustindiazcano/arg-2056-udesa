import { describe, it, expect } from 'vitest';
import { STEPS } from '../../src/content/steps';
import { validateSteps } from '../../src/story/validate';
import { SPEEDS } from '../../src/state/reducer';
import { SCENES } from '../../src/types/scene';
import { PROVINCES } from '../../src/types/province';
import { YEAR_MAX, YEAR_MIN } from '../../src/types/year';

describe('STEPS draft content', () => {
  it('passes validateSteps with the real limits', () => {
    const problems = validateSteps(STEPS, {
      minYear: YEAR_MIN,
      maxYear: YEAR_MAX,
      provinceIds: PROVINCES.map((p) => p.id),
      speeds: SPEEDS
    });
    expect(problems).toEqual([]);
  });

  it('has three real drafts in every scene, still flagged so the release gate waits for the human to sign them', () => {
    for (const scene of SCENES) {
      const steps = STEPS[scene];
      expect(steps.map((s) => s.id)).toEqual(['step-1', 'step-2', 'step-3']);
      expect(new Set(steps.map((s) => s.title)).size).toBe(3);
      for (const s of steps) {
        expect(s.title.length).toBeGreaterThan(3);
        expect(s.title).not.toMatch(/provisori|placeholder/i);
        expect(s.text.length).toBeGreaterThan(40);
        expect(s.text).not.toMatch(/Texto provisorio/);
        expect(s.placeholder).toBe(true); // the gate fails until the human reviews and signs the text
        expect(s.source_ids).toEqual([]);
      }
    }
  });

  it('claims no figure: the drafts describe what the scene shows, with no percent, currency or large count (years are fine)', () => {
    for (const scene of SCENES) {
      for (const s of STEPS[scene]) expect(s.text).not.toMatch(/%|USD|US\$|millones|\d{5,}/);
    }
  });

  it('economy visits 1880, 1950 and 2025', () => {
    expect(STEPS.economy.map((s) => s.focus)).toEqual([{ year: 1880 }, { year: 1950 }, { year: 2025 }]);
  });

  it('forecast walks the three scenarios and plays a range in the last step', () => {
    const f = STEPS.forecast.map((s) => s.focus);
    expect(f.map((x) => x.scenario)).toEqual(['pessimistic', 'expected', 'optimistic']);
    expect(f[0]?.play).toBeUndefined();
    expect(f[1]?.play).toBeUndefined();
    expect(f[2]?.play).toEqual({ fromYear: 2026, toYear: 2056 });
  });

  it('ai-revolution turns the overlay on in exactly one step', () => {
    const on = STEPS['ai-revolution'].filter((s) => s.focus.aiOverlay === true);
    expect(on).toHaveLength(1);
  });

  it('andes, resources and sandbox have empty focus (nothing to drive yet)', () => {
    for (const scene of ['andes', 'resources', 'sandbox'] as const) {
      expect(STEPS[scene].map((s) => s.focus)).toEqual([{}, {}, {}]);
    }
  });
});
