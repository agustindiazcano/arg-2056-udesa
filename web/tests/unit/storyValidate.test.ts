import { describe, it, expect } from 'vitest';
import { validateSteps, type ValidationContext } from '../../src/story/validate';
import type { Step, StepsByScene } from '../../src/story/types';
import { SCENES } from '../../src/types/scene';
import type { Scene } from '../../src/types/scene';
import { parseYear, type Year } from '../../src/types/year';

// out-of-range years can not come from parseYear, which throws; the brand is asserted on purpose
const rawYear = (n: number): Year => n as Year;

const context: ValidationContext = {
  minYear: 1810,
  maxYear: 2056,
  provinceIds: ['AR-A', 'AR-X'],
  speeds: [0.5, 1, 2]
};

function ok(id: string): Step {
  return { id, title: 'Title', text: 'Text', focus: {}, source_ids: [], placeholder: false };
}

function build(overrides: Partial<Record<Scene, readonly Step[]>> = {}): StepsByScene {
  const out = {} as Record<Scene, readonly Step[]>;
  for (const scene of SCENES) out[scene] = overrides[scene] ?? [ok('step-1')];
  return out;
}

describe('validateSteps', () => {
  it('valid input gives an empty list', () => {
    expect(validateSteps(build(), context)).toEqual([]);
  });

  it('a valid input that uses every focus field gives an empty list', () => {
    const rich: Step = {
      ...ok('rich'),
      focus: { scenario: 'expected', province: 'AR-X', aiOverlay: true, year: parseYear(1880) },
      source_ids: ['a:1', 'b:2']
    };
    const play: Step = {
      ...ok('play'),
      focus: { play: { fromYear: parseYear(1990), toYear: parseYear(2000), speed: 2 } }
    };
    const cleared: Step = { ...ok('cleared'), focus: { province: null } };
    expect(validateSteps(build({ economy: [rich, play, cleared] }), context)).toEqual([]);
  });

  it('reports a scene with no steps', () => {
    expect(validateSteps(build({ forecast: [] }), context)).toEqual(['forecast: has no steps']);
  });

  it('reports a duplicate id within a scene, but allows the same id in two scenes', () => {
    expect(validateSteps(build({ economy: [ok('a'), ok('a')] }), context)).toEqual([
      'economy: duplicate step id "a"'
    ]);
    expect(validateSteps(build({ economy: [ok('step-1')], forecast: [ok('step-1')] }), context)).toEqual([]);
  });

  it('reports an id that does not match ^[a-z0-9-]+$', () => {
    expect(validateSteps(build({ andes: [ok('Bad_Id')] }), context)).toEqual([
      'andes/Bad_Id: id must match ^[a-z0-9-]+$'
    ]);
    expect(validateSteps(build({ andes: [ok('')] }), context)).toEqual(['andes/: id must match ^[a-z0-9-]+$']);
  });

  it('reports an empty or blank title and text', () => {
    expect(validateSteps(build({ andes: [{ ...ok('a'), title: '' }] }), context)).toEqual([
      'andes/a: title is empty'
    ]);
    expect(validateSteps(build({ andes: [{ ...ok('a'), title: '   ' }] }), context)).toEqual([
      'andes/a: title is empty'
    ]);
    expect(validateSteps(build({ andes: [{ ...ok('a'), text: '' }] }), context)).toEqual(['andes/a: text is empty']);
  });

  it('reports year together with play', () => {
    const bad: Step = {
      ...ok('a'),
      focus: { year: parseYear(1900), play: { fromYear: parseYear(1900), toYear: parseYear(1910) } }
    };
    expect(validateSteps(build({ economy: [bad] }), context)).toEqual([
      'economy/a: year and play are mutually exclusive'
    ]);
  });

  it('reports a year out of range at both ends, and accepts the limits', () => {
    const low: Step = { ...ok('a'), focus: { year: rawYear(1809) } };
    const high: Step = { ...ok('b'), focus: { year: rawYear(2057) } };
    const edgeLow: Step = { ...ok('c'), focus: { year: rawYear(1810) } };
    const edgeHigh: Step = { ...ok('d'), focus: { year: rawYear(2056) } };
    expect(validateSteps(build({ economy: [low, high, edgeLow, edgeHigh] }), context)).toEqual([
      'economy/a: year 1809 is outside 1810-2056',
      'economy/b: year 2057 is outside 1810-2056'
    ]);
  });

  it('reports a play range whose start is not before its end', () => {
    const equal: Step = { ...ok('a'), focus: { play: { fromYear: rawYear(1900), toYear: rawYear(1900) } } };
    const reversed: Step = { ...ok('b'), focus: { play: { fromYear: rawYear(1950), toYear: rawYear(1900) } } };
    expect(validateSteps(build({ economy: [equal, reversed] }), context)).toEqual([
      'economy/a: play.fromYear must be before play.toYear',
      'economy/b: play.fromYear must be before play.toYear'
    ]);
  });

  it('reports play years out of range', () => {
    const bad: Step = { ...ok('a'), focus: { play: { fromYear: rawYear(1800), toYear: rawYear(2060) } } };
    expect(validateSteps(build({ economy: [bad] }), context)).toEqual([
      'economy/a: play.fromYear 1800 is outside 1810-2056',
      'economy/a: play.toYear 2060 is outside 1810-2056'
    ]);
  });

  it('reports a speed that is not in the allowed list', () => {
    const bad: Step = { ...ok('a'), focus: { play: { fromYear: parseYear(1900), toYear: parseYear(1910), speed: 3 } } };
    expect(validateSteps(build({ economy: [bad] }), context)).toEqual([
      'economy/a: play.speed 3 is not one of 0.5, 1, 2'
    ]);
  });

  it('reports an unknown province but accepts null', () => {
    const bad: Step = { ...ok('a'), focus: { province: 'AR-ZZ' } };
    const cleared: Step = { ...ok('b'), focus: { province: null } };
    expect(validateSteps(build({ forecast: [bad, cleared] }), context)).toEqual([
      'forecast/a: province "AR-ZZ" is not a known province id'
    ]);
  });

  it('reports duplicate source ids', () => {
    const bad: Step = { ...ok('a'), source_ids: ['x:1', 'y:2', 'x:1'] };
    expect(validateSteps(build({ forecast: [bad] }), context)).toEqual([
      'forecast/a: source_ids has duplicate "x:1"'
    ]);
  });

  it('collects several problems in scene order then step order', () => {
    const problems = validateSteps(
      build({ andes: [{ ...ok('a'), title: '' }], sandbox: [], economy: [{ ...ok('b'), text: '' }] }),
      context
    );
    expect(problems).toEqual(['andes/a: title is empty', 'economy/b: text is empty', 'sandbox: has no steps']);
  });
});
