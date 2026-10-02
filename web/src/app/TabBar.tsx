import React from 'react';
import { useStore } from '../state/store';
import { SCENES } from '../types/scene';
import { SCENE_LABELS } from '../scenes/registry';

export function TabBar() {
  const scene = useStore((s) => s.scene);
  const dispatch = useStore((s) => s.dispatch);

  return (
    <div role="tablist">
      {SCENES.map((s) => (
        <button
          key={s}
          role="tab"
          aria-selected={scene === s}
          onClick={() => dispatch({ type: 'setScene', scene: s })}
        >
          {SCENE_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
