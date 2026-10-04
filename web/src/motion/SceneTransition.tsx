import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { SCENE_TRANSITION } from './timings';

/** Fades and raises its children when `sceneKey` changes (and when it mounts); nothing under reduced motion. */
export function SceneTransition({ sceneKey, children }: { sceneKey: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: SCENE_TRANSITION.y },
      { opacity: 1, y: 0, duration: SCENE_TRANSITION.duration, ease: SCENE_TRANSITION.ease, clearProps: 'opacity,transform' }
    );
    return () => {
      tween.kill();
    };
  }, [sceneKey, reduced]);

  return (
    <div ref={ref} className="scene-transition">
      {children}
    </div>
  );
}
