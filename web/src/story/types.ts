import type { Scene } from '../types/scene';
import type { Scenario } from '../types/scenario';
import type { Year } from '../types/year';

/** One of the allowed playback speeds of the shell (see `SPEEDS` in `state/reducer.ts`). */
export type Speed = number;

/**
 * What a step does to the shared state when it is entered. Only the fields it names change.
 * `year` and `play` are mutually exclusive in one step.
 */
export interface StepFocus {
  /** jump the playhead to this year and pause */
  year?: Year;
  /** start playing from `fromYear` and pause at `toYear` */
  play?: { fromYear: Year; toYear: Year; speed?: Speed };
  scenario?: Scenario;
  /** an AR-X province id, or null to clear the selection */
  province?: string | null;
  aiOverlay?: boolean;
}

export interface Step {
  /** unique within the scene, ^[a-z0-9-]+$ */
  id: string;
  title: string;
  text: string;
  focus: StepFocus;
  /** ids in the references registry; may be empty */
  source_ids: readonly string[];
  placeholder: boolean;
}

export type StepsByScene = Readonly<Record<Scene, readonly Step[]>>;
