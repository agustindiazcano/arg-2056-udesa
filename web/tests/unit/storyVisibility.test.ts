import { describe, expect, it } from 'vitest';
import { showsStory } from '../../src/story/visibility';
import { SECTIONS } from '../../src/types/scene';

describe('where the story caption (the draft pop-up) shows', () => {
  it('shows only over the Andes and the dashboard, the sections that have scenes', () => {
    expect(SECTIONS.filter(showsStory)).toEqual(['andes', 'dashboard']);
  });

  it('never shows over the simulator, the Recorrido or Data', () => {
    for (const section of ['simulator', 'tour', 'data'] as const) expect(showsStory(section)).toBe(false);
  });
});
