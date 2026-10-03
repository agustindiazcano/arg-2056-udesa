import { describe, it, expect } from 'vitest';
import { reduce, tick, INITIAL_STEP_INDEX, type State } from '../../src/state/reducer';
import { useStore } from '../../src/state/store';
import { STEPS } from '../../src/content/steps';
import type { Step, StepFocus, StepsByScene } from '../../src/story/types';
import { SCENES } from '../../src/types/scene';
import type { Scene } from '../../src/types/scene';
import { parseYear } from '../../src/types/year';

function step(id: string, focus: StepFocus = {}): Step {
  return { id, title: id, text: 'x', focus, source_ids: [], placeholder: true };
}

// economy exercises every kind of focus, in this order; the other scenes are short on purpose
const FX: StepsByScene = {
  andes: [step('a1'), step('a2')],
  economy: [
    step('e1', { year: parseYear(1880) }),
    step('e2', { play: { fromYear: parseYear(1990), toYear: parseYear(2000), speed: 4 } }),
    step('e3', { scenario: 'pessimistic' }),
    step('e4', { province: 'AR-X' }),
    step('e5', { aiOverlay: true }),
    step('e6')
  ],
  resources: [step('r1')],
  forecast: [step('f1', { scenario: 'optimistic' }), step('f2')],
  'ai-revolution': [step('i1')],
  sandbox: [step('x1')]
};

const ZEROS: Record<Scene, number> = {
  andes: 0,
  economy: 0,
  resources: 0,
  forecast: 0,
  'ai-revolution': 0,
  sandbox: 0
};

const base: State = Object.freeze({
  scene: 'economy',
  yearFloat: 2026,
  scenario: 'expected',
  speed: 1,
  playing: true,
  mode: '3d',
  province: null,
  provinceFilterOpen: false,
  aiOverlay: 'off',
  stepIndex: Object.freeze({ ...ZEROS })
});

function at(index: number, over: Partial<State> = {}): State {
  return { ...base, ...over, stepIndex: { ...ZEROS, economy: index } };
}

describe('initial step index', () => {
  it('is 0 for every scene', () => {
    expect(INITIAL_STEP_INDEX).toEqual(ZEROS);
    expect(useStore.getInitialState().stepIndex).toEqual(ZEROS);
  });
});

describe('stepNext', () => {
  it('moves to a play step and applies its focus atomically', () => {
    expect(reduce(at(0), { type: 'stepNext' }, FX)).toEqual(
      at(1, { yearFloat: 1990, playing: true, speed: 4 })
    );
  });

  it('moves to a scenario step', () => {
    expect(reduce(at(1), { type: 'stepNext' }, FX)).toEqual(at(2, { scenario: 'pessimistic' }));
  });

  it('moves to a province step', () => {
    expect(reduce(at(2), { type: 'stepNext' }, FX)).toEqual(at(3, { province: 'AR-X' }));
  });

  it('moves to an AI step', () => {
    expect(reduce(at(3), { type: 'stepNext' }, FX)).toEqual(at(4, { aiOverlay: 'on' }));
  });

  it('moves to an empty-focus step changing only the index', () => {
    expect(reduce(at(4), { type: 'stepNext' }, FX)).toEqual(at(5));
  });

  it('at the last step it is a no-op: the very same state, the focus is not re-applied', () => {
    const last = at(5, { yearFloat: 1999 });
    expect(reduce(last, { type: 'stepNext' }, FX)).toBe(last);
  });

  it('only changes the index of the current scene', () => {
    const state: State = { ...base, stepIndex: { ...ZEROS, andes: 1, economy: 1, forecast: 1 } };
    const next = reduce(state, { type: 'stepNext' }, FX);
    expect(next.stepIndex).toEqual({ ...ZEROS, andes: 1, economy: 2, forecast: 1 });
  });

  it('does not mutate its input', () => {
    const frozen = Object.freeze({ ...base, stepIndex: Object.freeze({ ...ZEROS }) });
    expect(() => reduce(frozen, { type: 'stepNext' }, FX)).not.toThrow();
    expect(frozen.stepIndex.economy).toBe(0);
  });

  it('does nothing for a scene with no steps', () => {
    const empty: StepsByScene = { ...FX, economy: [] };
    expect(reduce(base, { type: 'stepNext' }, empty)).toBe(base);
    expect(reduce(base, { type: 'stepFirst' }, empty)).toBe(base);
    expect(reduce(base, { type: 'stepSet', index: 0 }, empty)).toBe(base);
  });
});

describe('stepPrev', () => {
  it('moves back and applies the focus of the previous step', () => {
    expect(reduce(at(3), { type: 'stepPrev' }, FX)).toEqual(at(2, { scenario: 'pessimistic' }));
    expect(reduce(at(1), { type: 'stepPrev' }, FX)).toEqual(at(0, { yearFloat: 1880, playing: false }));
  });

  it('at the first step it is a no-op: the very same state', () => {
    const first = at(0, { yearFloat: 1999 });
    expect(reduce(first, { type: 'stepPrev' }, FX)).toBe(first);
  });

  it('only changes the index of the current scene', () => {
    const state: State = { ...base, stepIndex: { ...ZEROS, andes: 1, economy: 2 } };
    expect(reduce(state, { type: 'stepPrev' }, FX).stepIndex).toEqual({ ...ZEROS, andes: 1, economy: 1 });
  });
});

describe('stepFirst', () => {
  it('goes to index 0 and applies its focus', () => {
    expect(reduce(at(3), { type: 'stepFirst' }, FX)).toEqual(at(0, { yearFloat: 1880, playing: false }));
  });

  it('on the first step it re-applies the focus (a restart)', () => {
    expect(reduce(at(0, { yearFloat: 1999 }), { type: 'stepFirst' }, FX)).toEqual(
      at(0, { yearFloat: 1880, playing: false })
    );
  });
});

describe('stepSet', () => {
  it('sets a valid index and applies its focus', () => {
    expect(reduce(at(0), { type: 'stepSet', index: 3 }, FX)).toEqual(at(3, { province: 'AR-X' }));
  });

  it('with the current index it re-applies the focus (return to step)', () => {
    expect(reduce(at(2, { scenario: 'optimistic' }), { type: 'stepSet', index: 2 }, FX)).toEqual(
      at(2, { scenario: 'pessimistic' })
    );
  });

  it('clamps an index past the end to the last step', () => {
    expect(reduce(at(0), { type: 'stepSet', index: 99 }, FX)).toEqual(at(5));
  });

  it('ignores a negative index: the very same state', () => {
    const s = at(2);
    expect(reduce(s, { type: 'stepSet', index: -1 }, FX)).toBe(s);
  });

  it('ignores a non-integer index: the very same state', () => {
    const s = at(2);
    expect(reduce(s, { type: 'stepSet', index: 1.5 }, FX)).toBe(s);
    expect(reduce(s, { type: 'stepSet', index: Number.NaN }, FX)).toBe(s);
    expect(reduce(s, { type: 'stepSet', index: Number.POSITIVE_INFINITY }, FX)).toBe(s);
  });
});

describe('entering a scene', () => {
  const visited: State = { ...base, scene: 'andes', stepIndex: { ...ZEROS, andes: 1, economy: 3, forecast: 1 } };

  it('setScene resets the entered scene to step 1, applies its focus and leaves the other scenes alone', () => {
    const next = reduce(visited, { type: 'setScene', scene: 'forecast' }, FX);
    expect(next).toEqual({
      ...visited,
      scene: 'forecast',
      scenario: 'optimistic',
      stepIndex: { ...ZEROS, andes: 1, economy: 3, forecast: 0 }
    });
  });

  it('nextScene and prevScene do the same (arrow keys and the Next scene button)', () => {
    expect(reduce(visited, { type: 'nextScene' }, FX)).toEqual({
      ...visited,
      scene: 'economy',
      yearFloat: 1880,
      playing: false,
      stepIndex: { ...ZEROS, andes: 1, economy: 0, forecast: 1 }
    });
    const fromResources: State = { ...visited, scene: 'resources' };
    expect(reduce(fromResources, { type: 'prevScene' }, FX)).toEqual({
      ...fromResources,
      scene: 'economy',
      yearFloat: 1880,
      playing: false,
      stepIndex: { ...ZEROS, andes: 1, economy: 0, forecast: 1 }
    });
  });

  it('entering a scene whose first step has an empty focus changes only scene and index', () => {
    const state: State = { ...base, scene: 'economy', stepIndex: { ...ZEROS, economy: 2, resources: 0 } };
    const next = reduce(state, { type: 'nextScene' }, FX);
    expect(next).toEqual({ ...state, scene: 'resources' });
  });

  it('nextScene and prevScene at the ends still return the very same state', () => {
    const last: State = { ...base, scene: 'sandbox' };
    expect(reduce(last, { type: 'nextScene' }, FX)).toBe(last);
    const first: State = { ...base, scene: 'andes' };
    expect(reduce(first, { type: 'prevScene' }, FX)).toBe(first);
  });

  it('setScene to the scene already shown keeps its step', () => {
    const state: State = { ...base, stepIndex: { ...ZEROS, economy: 3 } };
    const next = reduce(state, { type: 'setScene', scene: 'economy' }, FX);
    expect(next.scene).toBe('economy');
    expect(next.stepIndex).toEqual({ ...ZEROS, economy: 3 });
    expect(next.province).toBe(null);
  });
});

describe('default steps', () => {
  it('without a steps argument the reducer reads the placeholder STEPS', () => {
    const state: State = { ...base, scene: 'forecast', playing: false, stepIndex: { ...ZEROS } };
    const next = reduce(state, { type: 'stepNext' });
    expect(next.stepIndex.forecast).toBe(1);
    expect(next.scenario).toBe(STEPS.forecast[1]?.focus.scenario);
  });

  it('every scene is reachable and starts at step 1', () => {
    for (const scene of SCENES) {
      const from: State = { ...base, scene: 'andes' };
      const next = reduce(from, { type: 'setScene', scene });
      expect(next.stepIndex[scene]).toBe(0);
    }
  });

  it('tick leaves the step index alone', () => {
    const next = tick(at(3), 1);
    expect(next.stepIndex).toEqual({ ...ZEROS, economy: 3 });
  });
});
