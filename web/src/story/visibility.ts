import type { Section } from '../types/scene.js';

/** The sections that have scenes with story steps. The simulator, the Recorrido and Data have their own text and show no caption. */
const STORY_SECTIONS: ReadonlySet<Section> = new Set<Section>(['andes', 'dashboard']);

export const showsStory = (section: Section): boolean => STORY_SECTIONS.has(section);
