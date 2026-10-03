import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { STEPS } from '../content/steps';
import { stepDeviates } from './focus';
import type { StepsByScene } from './types';
import { nextScene } from '../types/scene';
import './story.css';

export interface StoryCaptionProps {
  /** what to display; the reducer always reads the static STEPS, so only tests pass another list */
  steps?: StepsByScene;
  /** ids of the loaded references registry; ids outside it (or any id, when null) are shown as plain text */
  registryIds?: ReadonlySet<string> | null;
}

const PANEL_HEIGHT_VAR = '--story-panel-height';

/** Keeps `--story-panel-height` equal to the height of the panel so the scenes can leave room for it. */
function usePanelHeightVariable(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    const root = document.documentElement;
    if (!el) return;
    const update = () => root.style.setProperty(PANEL_HEIGHT_VAR, `${el.offsetHeight}px`);
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(el);
    return () => {
      observer?.disconnect();
      root.style.removeProperty(PANEL_HEIGHT_VAR);
    };
  });
}

export function StoryCaption({ steps = STEPS, registryIds = null }: StoryCaptionProps) {
  const scene = useStore((s) => s.scene);
  const index = useStore((s) => s.stepIndex[s.scene]);
  const yearFloat = useStore((s) => s.yearFloat);
  const speed = useStore((s) => s.speed);
  const playing = useStore((s) => s.playing);
  const scenario = useStore((s) => s.scenario);
  const province = useStore((s) => s.province);
  const aiOverlay = useStore((s) => s.aiOverlay);
  const dispatch = useStore((s) => s.dispatch);
  const [hidden, setHidden] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  usePanelHeightVariable(panelRef);

  const list = steps[scene];
  const step = list[index];
  const isLast = index >= list.length - 1;
  const hasNextScene = nextScene(scene) !== scene;
  const deviates = step
    ? stepDeviates({ yearFloat, speed, playing, scenario, province, aiOverlay }, step)
    : false;

  return (
    <div role="region" aria-label="Story" className="story" ref={panelRef}>
      {/* announces the title when the step changes; stays mounted while the panel is collapsed */}
      <div aria-live="polite" className="story-live">
        {step?.title ?? ''}
      </div>

      {hidden || !step ? (
        <button type="button" aria-pressed={true} onClick={() => setHidden(false)}>
          Show captions
        </button>
      ) : (
        <>
          <div className="story-head">
            <span className="story-count">{`Step ${index + 1} of ${list.length}`}</span>
            <button type="button" aria-pressed={false} onClick={() => setHidden(true)}>
              Hide captions
            </button>
          </div>

          <h2 className="story-title">
            {step.title}
            {step.placeholder ? <span className="story-tag">Placeholder</span> : null}
          </h2>
          <p className="story-text">{step.text}</p>

          {step.source_ids.length > 0 ? (
            <p className="story-sources">
              <span>Sources: </span>
              {step.source_ids.map((id, i) => (
                <React.Fragment key={id}>
                  {i > 0 ? ', ' : null}
                  {registryIds?.has(id) ? <a href={`references.html#${id}`}>{id}</a> : <span>{id}</span>}
                </React.Fragment>
              ))}
            </p>
          ) : null}

          <div className="story-controls">
            <button type="button" disabled={index <= 0} onClick={() => dispatch({ type: 'stepPrev' })}>
              Previous
            </button>

            <div className="story-dots">
              {list.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className="story-dot"
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  aria-current={i === index ? 'step' : undefined}
                  onClick={() => dispatch({ type: 'stepSet', index: i })}
                />
              ))}
            </div>

            {isLast ? (
              <button type="button" disabled={!hasNextScene} onClick={() => dispatch({ type: 'nextScene' })}>
                Next scene
              </button>
            ) : (
              <button type="button" onClick={() => dispatch({ type: 'stepNext' })}>
                Next
              </button>
            )}

            {deviates ? (
              <button type="button" onClick={() => dispatch({ type: 'stepSet', index })}>
                Return to step
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
