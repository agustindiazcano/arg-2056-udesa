import { describe, it, expect } from 'vitest';
import { SCENE_COMPONENTS, SCENE_LABELS } from '../../src/scenes/registry';
import { SCENES } from '../../src/types/scene';

describe('registry', () => {
  it('has a component and label for every scene', () => {
    for (const scene of SCENES) {
      expect(SCENE_COMPONENTS[scene]).toBeDefined();
      expect(typeof SCENE_LABELS[scene]).toBe('string');
    }
  });
});
