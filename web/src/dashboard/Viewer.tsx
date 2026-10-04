import React from 'react';
import type { DashView } from './types';

/** The selected views, big. One fills the viewer; two or four split it. */
export function Viewer({ views }: { views: DashView[] }) {
  return (
    <section aria-label="Visor" className={`viewer viewer--${views.length >= 3 ? 4 : views.length}`}>
      {views.map((v) => (
        <div key={v.id} className="viewer-pane" data-view={v.id}>
          {v.content}
        </div>
      ))}
    </section>
  );
}
