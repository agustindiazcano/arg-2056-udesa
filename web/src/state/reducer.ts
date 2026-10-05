import type { KeyAction } from '../types/keys';
import { nextScene, prevScene } from '../types/scene';
import type { Scene, Section } from '../types/scene';
import type { Scenario } from '../types/scenario';
import type { ProvinceId } from '../types/province';
import { YEAR_MAX } from '../types/year';
import { STEPS } from '../content/steps';
import { applyFocus } from '../story/focus';
import type { StepsByScene } from '../story/types';

export interface State {
  scene: Scene;
  /** where the viewer is: the Andes, the data dashboard or the tour; the Andes scene and the Andes section go together */
  section: Section;
  yearFloat: number;
  scenario: Scenario;
  speed: number;
  playing: boolean;
  mode: '2d' | '3d';
  province: ProvinceId | null;
  provinceFilterOpen: boolean;
  aiOverlay: 'off' | 'on';
  /** the current story step of every scene; entering a scene restarts it at 0 */
  stepIndex: Record<Scene, number>;
}

export const INITIAL_STEP_INDEX: Readonly<Record<Scene, number>> = {
  andes: 0,
  economy: 0,
  resources: 0,
  forecast: 0,
  'ai-revolution': 0,
  sandbox: 0
};

export type UiAction =
  | { type: 'setScene'; scene: Scene }
  | { type: 'setSection'; section: Section }
  | { type: 'selectProvince'; province: ProvinceId | null }
  | { type: 'setYear'; year: number }
  | { type: 'setAiOverlay'; aiOverlay: 'off' | 'on' }
  | { type: 'stepSet'; index: number };

export type Action = KeyAction | UiAction;

export const SPEEDS: readonly number[] = [0.25, 0.5, 1, 2, 4, 8];
const YEARS_PER_SECOND = 2;

/** Shows the scene, restarts its story at step 1 and applies that step's focus, all in one state. */
function enterScene(state: State, scene: Scene, steps: StepsByScene): State {
  const section: Section = scene === 'andes' ? 'andes' : state.section === 'andes' ? 'dashboard' : state.section;
  const entered: State = { ...state, scene, section, stepIndex: { ...state.stepIndex, [scene]: 0 } };
  const first = steps[scene][0];
  return first ? applyFocus(entered, first.focus) : entered;
}

/** Moves the current scene to a step that is known to exist and applies its focus, all in one state. */
function goToStep(state: State, index: number, steps: StepsByScene): State {
  const step = steps[state.scene][index];
  if (!step) return state;
  return applyFocus({ ...state, stepIndex: { ...state.stepIndex, [state.scene]: index } }, step.focus);
}

/** `steps` is injectable so tests can use a fixture; the app always reads the static STEPS. */
export function reduce(state: State, action: Action, steps: StepsByScene = STEPS): State {
  switch (action.type) {
    case 'nextScene': {
      const ns = nextScene(state.scene);
      return ns === state.scene ? state : enterScene(state, ns, steps);
    }
    case 'prevScene': {
      const ps = prevScene(state.scene);
      return ps === state.scene ? state : enterScene(state, ps, steps);
    }
    case 'stepNext': {
      const current = state.stepIndex[state.scene];
      // at the last step this is a no-op, so a stray clicker press does not undo the viewer's exploration
      return current >= steps[state.scene].length - 1 ? state : goToStep(state, current + 1, steps);
    }
    case 'stepPrev': {
      const current = state.stepIndex[state.scene];
      return current <= 0 ? state : goToStep(state, current - 1, steps);
    }
    case 'stepFirst':
      return goToStep(state, 0, steps);
    case 'stepSet': {
      const count = steps[state.scene].length;
      if (!Number.isInteger(action.index) || action.index < 0 || count === 0) return state;
      return goToStep(state, Math.min(action.index, count - 1), steps);
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
      return action.scene === state.scene ? { ...state, scene: action.scene } : enterScene(state, action.scene, steps);
    case 'setSection': {
      if (action.section === 'andes') return state.scene === 'andes' ? { ...state, section: 'andes' } : enterScene(state, 'andes', steps);
      // the dashboard and the tour show the data scenes: from the Andes they start at the first one
      const entered = state.scene === 'andes' ? enterScene(state, 'economy', steps) : state;
      return { ...entered, section: action.section };
    }
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
