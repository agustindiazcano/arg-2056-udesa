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
