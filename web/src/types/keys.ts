import type { Scenario } from './scenario.js';

export type KeyAction =
  | { type: 'nextScene' } | { type: 'prevScene' }
  | { type: 'togglePlay' }
  | { type: 'speedUp' } | { type: 'speedDown' }
  | { type: 'setScenario'; scenario: Scenario }
  | { type: 'toggle3D' }
  | { type: 'openProvinceFilter' }
  | { type: 'back' };

export const KEY_MAP: Readonly<Record<string, KeyAction>> = {
  'ArrowRight': { type: 'nextScene' },
  'ArrowLeft': { type: 'prevScene' },
  ' ': { type: 'togglePlay' },
  '+': { type: 'speedUp' },
  '=': { type: 'speedUp' },
  '-': { type: 'speedDown' },
  '1': { type: 'setScenario', scenario: 'pessimistic' },
  '2': { type: 'setScenario', scenario: 'expected' },
  '3': { type: 'setScenario', scenario: 'optimistic' },
  'd': { type: 'toggle3D' },
  'p': { type: 'openProvinceFilter' },
  'Escape': { type: 'back' }
};

export function resolveKey(key: string): KeyAction | undefined {
  if (key.length === 1) {
    key = key.toLowerCase();
  }
  return KEY_MAP[key];
}
