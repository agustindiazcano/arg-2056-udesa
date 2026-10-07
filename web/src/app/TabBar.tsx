import React from 'react';
import { useStore } from '../state/store';
import { DATA_SCENES, SECTIONS } from '../types/scene';
import { SCENE_LABELS } from '../scenes/registry';
import { SECTION_LABELS, visibleSections } from '../content/sectionLabels';

/** The sections (the Data Dashboard is hidden: it is deprecated): the first row of the header, next to the brand. */
export function SectionTabs() {
  const section = useStore((s) => s.section);
  const dispatch = useStore((s) => s.dispatch);
  return (
    <nav aria-label="Escenas">
      <div role="tablist" className="tabs">
        {visibleSections(SECTIONS).map((s) => (
          <button key={s} type="button" role="tab" className="tab" aria-selected={section === s} onClick={() => dispatch({ type: 'setSection', section: s })}>
            {SECTION_LABELS[s]}
          </button>
        ))}
      </div>
    </nav>
  );
}

/** The five data scenes, only in the Data Dashboard: they go in the second row of the header. */
export function SceneTabs() {
  const scene = useStore((s) => s.scene);
  const section = useStore((s) => s.section);
  const dispatch = useStore((s) => s.dispatch);
  if (section !== 'dashboard') return null;
  return (
    <nav aria-label="Data Dashboard">
      <div role="tablist" className="tabs tabs--scenes">
        {DATA_SCENES.map((s) => (
          <button key={s} type="button" role="tab" className="tab" aria-selected={scene === s} onClick={() => dispatch({ type: 'setScene', scene: s })}>
            {SCENE_LABELS[s]}
          </button>
        ))}
      </div>
    </nav>
  );
}

/** Both rows of tabs, one after the other. */
export function TabBar() {
  return (
    <>
      <SectionTabs />
      <SceneTabs />
    </>
  );
}
