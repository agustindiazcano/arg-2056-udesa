import React from 'react';
import { useStore } from '../state/store';
import { DATA_SCENES, SECTIONS } from '../types/scene';
import { SCENE_LABELS } from '../scenes/registry';
import { SECTION_LABELS, visibleSections } from '../content/sectionLabels';
import { TourMenu } from './TourMenu';

/** The sections (the Data Dashboard is hidden: it is deprecated): the first row of the header, next to the brand. */
export function SectionTabs() {
  const section = useStore((s) => s.section);
  const dispatch = useStore((s) => s.dispatch);
  return (
    <nav aria-label="Escenas">
      <div role="tablist" className="tabs">
        {visibleSections(SECTIONS).filter((s) => s !== 'data').map((s) =>
          s === 'tour' ? (
            <TourMenu key={s} />
          ) : (
            <button key={s} type="button" role="tab" className="tab" aria-selected={section === s} onClick={() => dispatch({ type: 'setSection', section: s })}>
              {SECTION_LABELS[s]}
            </button>
          )
        )}
      </div>
    </nav>
  );
}

/** The Data button, at the top right of the header: the tables behind every number, with their sources. */
export function DataButton() {
  const section = useStore((s) => s.section);
  const dispatch = useStore((s) => s.dispatch);
  return (
    <button type="button" className="tab data-button" aria-pressed={section === 'data'} onClick={() => dispatch({ type: 'setSection', section: 'data' })}>
      <DatabaseIcon />
      {SECTION_LABELS.data}
    </button>
  );
}

/** The cylinder that stands for a database, next to the Data tab. */
function DatabaseIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <ellipse cx="8" cy="3.5" rx="5.5" ry="2" />
      <path d="M2.5 3.5v9c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2v-9" />
      <path d="M2.5 8c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2" />
    </svg>
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
