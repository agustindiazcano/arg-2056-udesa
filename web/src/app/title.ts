import { SCENE_LABELS } from '../scenes/registry';
import type { Scene } from '../types/scene';

import { APP_TITLE } from '../content/appTitle';

export { APP_TITLE };

/** The document title for a scene: "<scene label> | <app title>". */
export function documentTitle(scene: Scene): string {
  return `${SCENE_LABELS[scene]} | ${APP_TITLE}`;
}
