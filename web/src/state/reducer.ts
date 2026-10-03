import type { KeyAction } from '../types/keys';
import { nextScene, prevScene } from '../types/scene';
import type { Scene } from '../types/scene';
import type { Scenario } from '../types/scenario';
import type { ProvinceId } from '../types/province';
import { YEAR_MAX } from '../types/year';

export interface State {
  scene: Scene;
  yearFloat: number;
  scenario: Scenario;
  speed: number;
  playing: boolean;
  mode: '2d' | '3d';
  province: ProvinceId | null;
  provinceFilterOpen: boolean;
  aiOverlay: 'off' | 'on';
}

export type UiAction =
  | { type: 'setScene'; scene: Scene }
  | { type: 'selectProvince'; province: ProvinceId | null }
  | { type: 'setYear'; year: number }
  | { type: 'setAiOverlay'; aiOverlay: 'off' | 'on' };

export type Action = KeyAction | UiAction;

export const SPEEDS: readonly number[] = [0.25, 0.5, 1, 2, 4, 8];
const YEARS_PER_SECOND = 2;

export function reduce(state: State, action: Action): State {
  switch (action.type) {
    case 'nextScene': {
      const ns = nextScene(state.scene);
      return ns === state.scene ? state : { ...state, scene: ns };
    }
    case 'prevScene': {
      const ps = prevScene(state.scene);
      return ps === state.scene ? state : { ...state, scene: ps };
    }
    case 'togglePlay':
      return { ...state, playing: !state.playing };
    case 'speedUp': {
      const idx = SPEEDS.indexOf(state.speed);
      if (idx !== -1 && idx < SPEEDS.length - 1) {
        return { ...state, speed: SPEEDS[idx + 1] as number };
      }
      return state;
    }
    case 'speedDown': {
      const idx = SPEEDS.indexOf(state.speed);
      if (idx > 0) {
        return { ...state, speed: SPEEDS[idx - 1] as number };
      }
      return state;
    }
    case 'setScenario':
      return { ...state, scenario: action.scenario };
    case 'toggle3D':
      return { ...state, mode: state.mode === '3d' ? '2d' : '3d' };
    case 'openProvinceFilter':
      return { ...state, provinceFilterOpen: !state.provinceFilterOpen };
    case 'back':
      if (state.provinceFilterOpen) {
        return { ...state, provinceFilterOpen: false };
      }
      if (state.province !== null) {
        return { ...state, province: null };
      }
      return state;

    // UiActions
    case 'setScene':
      return { ...state, scene: action.scene };
    case 'selectProvince':
      return { ...state, province: action.province, provinceFilterOpen: false };
    case 'setYear':
      return { ...state, yearFloat: action.year };
    case 'setAiOverlay':
      return { ...state, aiOverlay: action.aiOverlay };
      
    default:
      return state;
  }
}

export function tick(state: State, dtSeconds: number): State {
  if (!state.playing) return state;
  if (dtSeconds < 0 || Number.isNaN(dtSeconds)) return state;

  let newYear = state.yearFloat + state.speed * YEARS_PER_SECOND * dtSeconds;
  let playing: boolean = state.playing;

  if (newYear >= YEAR_MAX) {
    newYear = YEAR_MAX;
    playing = false;
  }

  return {
    ...state,
    yearFloat: newYear,
    playing
  };
}
