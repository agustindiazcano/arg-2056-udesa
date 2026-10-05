export const SCENES = ['andes', 'economy', 'resources', 'forecast', 'ai-revolution', 'sandbox'] as const;
export type Scene = typeof SCENES[number];

export function nextScene(s: Scene): Scene {
  const idx = SCENES.indexOf(s);
  if (idx < SCENES.length - 1) return SCENES[idx + 1] as Scene;
  return s;
}

export function prevScene(s: Scene): Scene {
  const idx = SCENES.indexOf(s);
  if (idx > 0) return SCENES[idx - 1] as Scene;
  return s;
}

/** The three ways to see the story: the crossing of the Andes, the data dashboard (the five data scenes) and the guided tour. */
export const SECTIONS = ['andes', 'dashboard', 'tour'] as const;
export type Section = typeof SECTIONS[number];

/** The data scenes: the ones the dashboard and the tour show. The Andes is a scene of its own. */
export const DATA_SCENES = SCENES.filter((s): s is Exclude<Scene, 'andes'> => s !== 'andes');
