import { SCENES } from '../types/scene';
import type { Step, StepsByScene } from './types';

export interface ValidationContext {
  minYear: number;
  maxYear: number;
  provinceIds: readonly string[];
  speeds: readonly number[];
}

const ID_PATTERN = /^[a-z0-9-]+$/;

function stepProblems(step: Step, context: ValidationContext): string[] {
  const { minYear, maxYear, provinceIds, speeds } = context;
  const problems: string[] = [];
  const { focus } = step;
  const outside = (year: number) => year < minYear || year > maxYear;
  const range = `${minYear}-${maxYear}`;

  if (!ID_PATTERN.test(step.id)) problems.push('id must match ^[a-z0-9-]+$');
  if (step.title.trim() === '') problems.push('title is empty');
  if (step.text.trim() === '') problems.push('text is empty');
  if (focus.year !== undefined && focus.play !== undefined) problems.push('year and play are mutually exclusive');
  if (focus.year !== undefined && outside(focus.year)) problems.push(`year ${focus.year} is outside ${range}`);
  if (focus.play !== undefined) {
    const { fromYear, toYear, speed } = focus.play;
    if (fromYear >= toYear) problems.push('play.fromYear must be before play.toYear');
    if (outside(fromYear)) problems.push(`play.fromYear ${fromYear} is outside ${range}`);
    if (outside(toYear)) problems.push(`play.toYear ${toYear} is outside ${range}`);
    if (speed !== undefined && !speeds.includes(speed)) {
      problems.push(`play.speed ${speed} is not one of ${speeds.join(', ')}`);
    }
  }
  if (focus.province !== undefined && focus.province !== null && !provinceIds.includes(focus.province)) {
    problems.push(`province "${focus.province}" is not a known province id`);
  }
  const seen = new Set<string>();
  const reported = new Set<string>();
  for (const id of step.source_ids) {
    if (seen.has(id) && !reported.has(id)) {
      problems.push(`source_ids has duplicate "${id}"`);
      reported.add(id);
    }
    seen.add(id);
  }
  return problems;
}

/** Returns a list of problems with the story steps; an empty list means they are valid. */
export function validateSteps(stepsByScene: StepsByScene, context: ValidationContext): string[] {
  const problems: string[] = [];
  for (const scene of SCENES) {
    const steps = stepsByScene[scene];
    if (steps.length === 0) {
      problems.push(`${scene}: has no steps`);
      continue;
    }
    const ids = new Set<string>();
    for (const step of steps) {
      if (ids.has(step.id)) problems.push(`${scene}: duplicate step id "${step.id}"`);
      ids.add(step.id);
      for (const problem of stepProblems(step, context)) problems.push(`${scene}/${step.id}: ${problem}`);
    }
  }
  return problems;
}
