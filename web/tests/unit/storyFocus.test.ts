import { describe, it, expect } from 'vitest';
import { applyFocus, stepDeviates, type FocusFields } from '../../src/story/focus';
import type { Step, StepFocus } from '../../src/story/types';
import { parseYear } from '../../src/types/year';

const base: FocusFields = Object.freeze({
  yearFloat: 2026,
  speed: 2,
  playing: false,
  scenario: 'expected',
  province: null,
  aiOverlay: 'off'
});

function step(focus: StepFocus): Step {
  return { id: 's', title: 't', text: 'x', focus, source_ids: [], placeholder: true };
}

describe('applyFocus', () => {
  it('an empty focus returns the very same state', () => {
    expect(applyFocus(base, {})).toBe(base);
  });

  it('a year focus sets yearFloat and pauses, nothing else', () => {
    const playing = { ...base, playing: true };
    expect(applyFocus(playing, { year: parseYear(1880) })).toEqual({ ...base, yearFloat: 1880, playing: false });
  });

  it('a play focus sets the start year and starts playing, keeping the speed when none is given', () => {
    const next = applyFocus(base, { play: { fromYear: parseYear(2026), toYear: parseYear(2056) } });
    expect(next).toEqual({ ...base, yearFloat: 2026, playing: true });
    expect(next.speed).toBe(2);
  });

  it('a play focus sets the speed when it gives one', () => {
    const next = applyFocus(base, { play: { fromYear: parseYear(1990), toYear: parseYear(2000), speed: 4 } });
    expect(next).toEqual({ ...base, yearFloat: 1990, playing: true, speed: 4 });
  });

  it('scenario, province and aiOverlay set only their own field', () => {
    expect(applyFocus(base, { scenario: 'pessimistic' })).toEqual({ ...base, scenario: 'pessimistic' });
    expect(applyFocus(base, { province: 'AR-X' })).toEqual({ ...base, province: 'AR-X' });
    expect(applyFocus({ ...base, province: 'AR-X' }, { province: null })).toEqual(base);
    expect(applyFocus(base, { aiOverlay: true })).toEqual({ ...base, aiOverlay: 'on' });
    expect(applyFocus({ ...base, aiOverlay: 'on' }, { aiOverlay: false })).toEqual(base);
  });

  it('does not touch fields the focus does not name, and does not mutate its input', () => {
    const playing = Object.freeze({ ...base, playing: true, speed: 8, province: 'AR-M' as const });
    const next = applyFocus(playing, { scenario: 'optimistic' });
    expect(next).toEqual({ ...playing, scenario: 'optimistic' });
  });

  it('combines several named fields in one focus', () => {
    const next = applyFocus(base, { year: parseYear(1950), scenario: 'optimistic', province: 'AR-C', aiOverlay: true });
    expect(next).toEqual({
      ...base,
      yearFloat: 1950,
      playing: false,
      scenario: 'optimistic',
      province: 'AR-C',
      aiOverlay: 'on'
    });
  });
});

describe('stepDeviates', () => {
  it('an empty focus never deviates', () => {
    expect(stepDeviates(base, step({}))).toBe(false);
    expect(stepDeviates({ ...base, playing: true, yearFloat: 1900 }, step({}))).toBe(false);
  });

  it('compares scenario by equality', () => {
    expect(stepDeviates(base, step({ scenario: 'expected' }))).toBe(false);
    expect(stepDeviates(base, step({ scenario: 'optimistic' }))).toBe(true);
  });

  it('compares province by equality, including null', () => {
    expect(stepDeviates(base, step({ province: null }))).toBe(false);
    expect(stepDeviates(base, step({ province: 'AR-X' }))).toBe(true);
    expect(stepDeviates({ ...base, province: 'AR-X' }, step({ province: 'AR-X' }))).toBe(false);
    expect(stepDeviates({ ...base, province: 'AR-X' }, step({ province: null }))).toBe(true);
  });

  it('compares the AI overlay by equality', () => {
    expect(stepDeviates(base, step({ aiOverlay: false }))).toBe(false);
    expect(stepDeviates(base, step({ aiOverlay: true }))).toBe(true);
    expect(stepDeviates({ ...base, aiOverlay: 'on' }, step({ aiOverlay: true }))).toBe(false);
  });

  it('a year matches within strictly less than 0.5', () => {
    const s = step({ year: parseYear(1950) });
    expect(stepDeviates({ ...base, yearFloat: 1950 }, s)).toBe(false);
    expect(stepDeviates({ ...base, yearFloat: 1950.49 }, s)).toBe(false);
    expect(stepDeviates({ ...base, yearFloat: 1949.51 }, s)).toBe(false);
    expect(stepDeviates({ ...base, yearFloat: 1950.5 }, s)).toBe(true);
    expect(stepDeviates({ ...base, yearFloat: 1949.5 }, s)).toBe(true);
  });

  it('a play range matches inclusively at both ends', () => {
    const s = step({ play: { fromYear: parseYear(2026), toYear: parseYear(2056) } });
    expect(stepDeviates({ ...base, yearFloat: 2026 }, s)).toBe(false);
    expect(stepDeviates({ ...base, yearFloat: 2040 }, s)).toBe(false);
    expect(stepDeviates({ ...base, yearFloat: 2056 }, s)).toBe(false);
    expect(stepDeviates({ ...base, yearFloat: 2025.9 }, s)).toBe(true);
    expect(stepDeviates({ ...base, yearFloat: 2056.1 }, s)).toBe(true);
  });

  it('a play range ignores the playing flag and the speed', () => {
    const s = step({ play: { fromYear: parseYear(2026), toYear: parseYear(2056), speed: 4 } });
    expect(stepDeviates({ ...base, yearFloat: 2030, playing: false, speed: 1 }, s)).toBe(false);
  });

  it('deviates when any one named field differs', () => {
    const s = step({ scenario: 'expected', province: null, aiOverlay: false, year: parseYear(2026) });
    expect(stepDeviates(base, s)).toBe(false);
    expect(stepDeviates({ ...base, yearFloat: 2030 }, s)).toBe(true);
    expect(stepDeviates({ ...base, aiOverlay: 'on' }, s)).toBe(true);
  });
});
