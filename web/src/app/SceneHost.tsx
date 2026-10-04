import React, { Suspense } from 'react';
import { SCENE_COMPONENTS } from '../scenes/registry';
import type { Scene } from '../types/scene';

/** Shows the scene, or a visible "Loading scene" status while its code chunk loads. */
export function SceneHost({ scene }: { scene: Scene }) {
  const CurrentScene = SCENE_COMPONENTS[scene];
  return (
    <Suspense fallback={<p role="status" aria-live="polite" className="fallback">Cargando escena</p>}>
      <CurrentScene />
    </Suspense>
  );
}
