import type { Section } from '../types/scene.js';

/** The sections that show the story caption. The Andes (their drafts are off the side panel for now), the simulator, the Recorrido and Data show none. */
const STORY_SECTIONS: ReadonlySet<Section> = new Set<Section>(['dashboard']);

export const showsStory = (section: Section): boolean => STORY_SECTIONS.has(section);
