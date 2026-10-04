import { SCENE_LABELS } from '../scenes/registry';
import type { Scene } from '../types/scene';

/** The app title. index.html carries the same text for the first paint; a test keeps them equal. */
export const APP_TITLE = 'Argentina 2056';

/** The document title for a scene: "<scene label> | <app title>". */
export function documentTitle(scene: Scene): string {
  return `${SCENE_LABELS[scene]} | ${APP_TITLE}`;
}
