import { describe, expect, it } from 'vitest';
import { showsStory } from '../../src/story/visibility';
import { SECTIONS } from '../../src/types/scene';

describe('where the story caption (the draft pop-up) shows', () => {
  it('shows only over the dashboard', () => {
    expect(SECTIONS.filter(showsStory)).toEqual(['dashboard']);
  });

  it('never shows over the Andes (human request: no text pop-up in their side panel), the simulator, the Recorrido or Data', () => {
    for (const section of ['andes', 'simulator', 'tour', 'data'] as const) expect(showsStory(section)).toBe(false);
  });
});
