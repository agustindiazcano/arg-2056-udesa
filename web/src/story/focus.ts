import type { Scenario } from '../types/scenario';
import type { Step, StepFocus } from './types';

/** The slice of the store state that a step can read and drive. The full `State` satisfies it structurally. */
export interface FocusFields {
  yearFloat: number;
  speed: number;
  playing: boolean;
  scenario: Scenario;
  province: string | null;
  aiOverlay: 'off' | 'on';
}

/** A year counts as "at the step" when it is strictly less than half a year away. */
const YEAR_TOLERANCE = 0.5;

/**
 * Applies a step focus. Only the fields the focus names change; an empty focus returns the same object.
 * `year` pauses, `play` starts playing (and sets the speed only when it gives one).
 */
export function applyFocus<T extends FocusFields>(state: T, focus: StepFocus): T {
  let next: T = state;
  if (focus.year !== undefined) {
    next = { ...next, yearFloat: focus.year, playing: false };
  }
  if (focus.play !== undefined) {
    next = { ...next, yearFloat: focus.play.fromYear, playing: true };
    if (focus.play.speed !== undefined) next = { ...next, speed: focus.play.speed };
  }
  if (focus.scenario !== undefined) next = { ...next, scenario: focus.scenario };
  if (focus.province !== undefined) next = { ...next, province: focus.province };
  if (focus.aiOverlay !== undefined) next = { ...next, aiOverlay: focus.aiOverlay ? 'on' : 'off' };
  return next;
}

/** True when the state no longer matches the step. Compares only the fields the focus names. */
export function stepDeviates(state: FocusFields, step: Step): boolean {
  const { focus } = step;
  if (focus.year !== undefined && !(Math.abs(state.yearFloat - focus.year) < YEAR_TOLERANCE)) return true;
  if (focus.play !== undefined && (state.yearFloat < focus.play.fromYear || state.yearFloat > focus.play.toYear)) {
    return true;
  }
  if (focus.scenario !== undefined && state.scenario !== focus.scenario) return true;
  if (focus.province !== undefined && state.province !== focus.province) return true;
  if (focus.aiOverlay !== undefined && (state.aiOverlay === 'on') !== focus.aiOverlay) return true;
  return false;
}
