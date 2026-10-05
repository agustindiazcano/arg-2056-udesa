import React from 'react';
import { useStore } from '../state/store';
import { DATA_SCENES, SECTIONS } from '../types/scene';
import { SCENE_LABELS } from '../scenes/registry';
import { SECTION_LABELS } from '../content/sectionLabels';

/** The three sections; the five data scenes show next to them only in the Data Dashboard. */
export function TabBar() {
  const scene = useStore((s) => s.scene);
  const section = useStore((s) => s.section);
  const dispatch = useStore((s) => s.dispatch);

  return (
    <>
      <nav aria-label="Escenas">
        <div role="tablist" className="tabs">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              className="tab"
              aria-selected={section === s}
              onClick={() => dispatch({ type: 'setSection', section: s })}
            >
              {SECTION_LABELS[s]}
            </button>
          ))}
        </div>
      </nav>
      {section === 'dashboard' && (
        <nav aria-label="Data Dashboard">
          <div role="tablist" className="tabs tabs--scenes">
            {DATA_SCENES.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                className="tab"
                aria-selected={scene === s}
                onClick={() => dispatch({ type: 'setScene', scene: s })}
              >
                {SCENE_LABELS[s]}
              </button>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
