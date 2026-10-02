import { describe, it, expect } from 'vitest';
import { reduce, tick, State } from '../../src/state/reducer';
import { YEAR_MAX } from '../../src/types/year';

describe('Reducer', () => {
  const initialState: State = Object.freeze({
    scene: 'andes',
    yearFloat: 2026,
    scenario: 'expected',
    speed: 1,
    playing: false,
    mode: '3d',
    province: null,
    provinceFilterOpen: false,
    aiOverlay: 'off'
  });

  describe('KeyActions', () => {
    it('nextScene moves clamped', () => {
      let state = reduce(initialState, { type: 'nextScene' });
      expect(state.scene).toBe('economy');
      
      // Fast forward to end
      state = reduce(state, { type: 'nextScene' }); // resources
      state = reduce(state, { type: 'nextScene' }); // forecast
      state = reduce(state, { type: 'nextScene' }); // ai-revolution
      state = reduce(state, { type: 'nextScene' }); // sandbox
      const endState = reduce(state, { type: 'nextScene' });
      expect(endState.scene).toBe('sandbox'); // clamped
      expect(endState).toBe(state); // If clamped, does it return same state or new object? The instructions say never mutates, but returning same object if no change is good practice. I'll just check scene is clamped.
    });

    it('prevScene moves clamped', () => {
      let state = reduce(initialState, { type: 'prevScene' });
      expect(state.scene).toBe('andes'); // already at start

      state = { ...initialState, scene: 'resources' };
      state = reduce(state, { type: 'prevScene' });
      expect(state.scene).toBe('economy');
    });

    it('togglePlay flips playing', () => {
      let state = reduce(initialState, { type: 'togglePlay' });
      expect(state.playing).toBe(true);
      state = reduce(state, { type: 'togglePlay' });
      expect(state.playing).toBe(false);
    });

    it('speedUp and speedDown clamp at both ends and step exactly', () => {
      // SPEEDS = [0.25, 0.5, 1, 2, 4, 8]
      let state = reduce(initialState, { type: 'speedDown' }); // 1 -> 0.5
      expect(state.speed).toBe(0.5);
      state = reduce(state, { type: 'speedDown' }); // 0.5 -> 0.25
      expect(state.speed).toBe(0.25);
      state = reduce(state, { type: 'speedDown' }); // clamped at 0.25
      expect(state.speed).toBe(0.25);

      state = reduce(state, { type: 'speedUp' }); // 0.5
      state = reduce(state, { type: 'speedUp' }); // 1
      state = reduce(state, { type: 'speedUp' }); // 2
      state = reduce(state, { type: 'speedUp' }); // 4
      state = reduce(state, { type: 'speedUp' }); // 8
      expect(state.speed).toBe(8);
      state = reduce(state, { type: 'speedUp' }); // clamped at 8
      expect(state.speed).toBe(8);
    });

    it('setScenario sets scenario', () => {
      const state = reduce(initialState, { type: 'setScenario', scenario: 'optimistic' });
      expect(state.scenario).toBe('optimistic');
    });

    it('toggle3D flips mode', () => {
      const state = reduce(initialState, { type: 'toggle3D' });
      expect(state.mode).toBe('2d');
      const state2 = reduce(state, { type: 'toggle3D' });
      expect(state2.mode).toBe('3d');
    });

    it('openProvinceFilter toggles provinceFilterOpen', () => {
      const state = reduce(initialState, { type: 'openProvinceFilter' });
      expect(state.provinceFilterOpen).toBe(true);
      const state2 = reduce(state, { type: 'openProvinceFilter' });
      expect(state2.provinceFilterOpen).toBe(false);
    });

    it('back closes filter if open, clears province otherwise', () => {
      // Priority 1: close filter
      let state: State = { ...initialState, provinceFilterOpen: true, province: 'AR-B' };
      state = reduce(state, { type: 'back' });
      expect(state.provinceFilterOpen).toBe(false);
      expect(state.province).toBe('AR-B');

      // Priority 2: clear province
      state = reduce(state, { type: 'back' });
      expect(state.provinceFilterOpen).toBe(false);
      expect(state.province).toBeNull();

      // Priority 3: no change
      const state3 = reduce(state, { type: 'back' });
      expect(state3).toEqual(state);
    });
  });

  describe('UiActions', () => {
    it('setScene sets scene', () => {
      const state = reduce(initialState, { type: 'setScene', scene: 'sandbox' });
      expect(state.scene).toBe('sandbox');
    });

    it('selectProvince sets id and closes filter', () => {
      const state = { ...initialState, provinceFilterOpen: true };
      const next = reduce(state, { type: 'selectProvince', province: 'AR-X' as const });
      expect(next.province).toBe('AR-X');
      expect(next.provinceFilterOpen).toBe(false);
    });

    it('setYear sets yearFloat directly', () => {
      const state = reduce(initialState, { type: 'setYear', year: 1999 });
      expect(state.yearFloat).toBe(1999);
    });

    it('setAiOverlay sets aiOverlay', () => {
      const state = reduce(initialState, { type: 'setAiOverlay', aiOverlay: 'on' });
      expect(state.aiOverlay).toBe('on');
    });
  });

  describe('tick', () => {
    it('returns same state if not playing', () => {
      const next = tick(initialState, 1.0);
      expect(next).toBe(initialState); // Same object reference expected since immutable and no changes
    });

    it('advances yearFloat if playing', () => {
      const state = { ...initialState, playing: true, yearFloat: 2000, speed: 1 };
      // speed 1 * YEARS_PER_SECOND(2) * dt(0.5) = 1.0 year advance
      const next = tick(state, 0.5);
      expect(next.yearFloat).toBe(2001);
      expect(next.playing).toBe(true);
    });

    it('clamps at YEAR_MAX and stops playing', () => {
      const state = { ...initialState, playing: true, yearFloat: YEAR_MAX - 1, speed: 1 };
      const next = tick(state, 10.0); // Would advance 20 years
      expect(next.yearFloat).toBe(YEAR_MAX);
      expect(next.playing).toBe(false);
    });

    it('does nothing when paused or ignores negative/NaN dt', () => {
      const state = { ...initialState, playing: true, yearFloat: 2000, speed: 1 };
      const nextNegative = tick(state, -1.0);
      expect(nextNegative).toBe(state); // reference equality expected

      const nextNaN = tick(state, NaN);
      expect(nextNaN).toBe(state);
    });
  });
});
