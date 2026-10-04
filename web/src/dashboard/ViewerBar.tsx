import React from 'react';
import { Segmented } from '../ui/Segmented';
import { useStore } from '../state/store';
import { useDashPrefs } from './prefs';
import type { Layout } from './prefs';

const LAYOUTS: ReadonlyArray<{ value: `${Layout}`; label: string }> = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '4', label: '4' }
];

const VIEWS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
] as const;

const MODES = [
  { value: 'tour', label: 'Recorrido' },
  { value: 'explore', label: 'Explorar' }
] as const;

/** Above the viewer: how many views at once, and Recorrido (the story) or Explorar (free). */
export function ViewerBar() {
  const layout = useDashPrefs((s) => s.layout);
  const explore = useDashPrefs((s) => s.explore);
  const setLayout = useDashPrefs((s) => s.setLayout);
  const setExplore = useDashPrefs((s) => s.setExplore);
  const mode = useStore((s) => s.mode);
  const dispatch = useStore((s) => s.dispatch);

  return (
    <div className="viewer-bar">
      <Segmented
        label="Vista"
        options={VIEWS}
        value={mode}
        onChange={(value) => {
          if (value !== mode) dispatch({ type: 'toggle3D' });
        }}
      />
      <Segmented
        label="Paneles a la vez"
        options={LAYOUTS}
        value={`${layout}` as `${Layout}`}
        onChange={(value) => setLayout(Number(value) as Layout)}
      />
      <Segmented
        label="Modo"
        options={MODES}
        value={explore ? 'explore' : 'tour'}
        onChange={(value) => setExplore(value === 'explore')}
      />
    </div>
  );
}
