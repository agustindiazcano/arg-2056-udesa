import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSlots } from '../dashboard/slots';
import { gsap } from 'gsap';
import { useStore } from '../state/store';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { STORY_STEP } from '../motion/timings';
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
function usePanelHeightVariable(ref: React.RefObject<HTMLElement | null>, docked: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (docked) return;
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
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const shownIndex = useRef(index);
  const slot = useSlots((s) => s.narrative);
  usePanelHeightVariable(panelRef, slot !== null);

  // the text fades in each time the step changes (not on mount, not under reduced motion)
  useEffect(() => {
    if (shownIndex.current === index) return;
    shownIndex.current = index;
    const body = bodyRef.current;
    if (!body || reducedMotion) return;
    const tween = gsap.fromTo(
      body,
      { opacity: 0, y: STORY_STEP.y },
      { opacity: 1, y: 0, duration: STORY_STEP.duration, ease: STORY_STEP.ease, clearProps: 'opacity,transform' }
    );
    return () => {
      tween.kill();
    };
  }, [index, reducedMotion]);

  const list = steps[scene];
  const step = list[index];
  const isLast = index >= list.length - 1;
  const hasNextScene = nextScene(scene) !== scene;
  const deviates = step
    ? stepDeviates({ yearFloat, speed, playing, scenario, province, aiOverlay }, step)
    : false;

  const panel = (
    <div role="region" aria-label="Historia" className={slot ? 'story story--docked' : 'story'} ref={panelRef}>
      {/* announces the title when the step changes; stays mounted while the panel is collapsed */}
      <div aria-live="polite" className="story-live">
        {step?.title ?? ''}
      </div>

      {hidden || !step ? (
        <button type="button" aria-pressed={true} onClick={() => setHidden(false)}>
          Mostrar textos
        </button>
      ) : (
        <>
          <div className="story-body" ref={bodyRef}>
          <div className="story-head">
            <span className="story-count">{`Paso ${index + 1} de ${list.length}`}</span>
            <button type="button" aria-pressed={false} onClick={() => setHidden(true)}>
              Ocultar textos
            </button>
          </div>

          <h2 className="story-title">
            {step.title}
            {step.placeholder ? <span className="story-tag">Borrador</span> : null}
          </h2>
          <p className="story-text">{step.text}</p>

          {step.source_ids.length > 0 ? (
            <p className="story-sources">
              <span>Fuentes: </span>
              {step.source_ids.map((id, i) => (
                <React.Fragment key={id}>
                  {i > 0 ? ', ' : null}
                  {registryIds?.has(id) ? <a href={`references.html#${id}`}>{id}</a> : <span>{id}</span>}
                </React.Fragment>
              ))}
            </p>
          ) : null}
          </div>

          <div className="story-controls">
            <button type="button" disabled={index <= 0} onClick={() => dispatch({ type: 'stepPrev' })}>
              Anterior
            </button>

            <div className="story-dots">
              {list.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className="story-dot"
                  aria-label={`Ir al paso ${i + 1}: ${s.title}`}
                  aria-current={i === index ? 'step' : undefined}
                  onClick={() => dispatch({ type: 'stepSet', index: i })}
                />
              ))}
            </div>

            {isLast ? (
              <button type="button" disabled={!hasNextScene} onClick={() => dispatch({ type: 'nextScene' })}>
                Escena siguiente
              </button>
            ) : (
              <button type="button" onClick={() => dispatch({ type: 'stepNext' })}>
                Siguiente
              </button>
            )}

            {deviates ? (
              <button type="button" onClick={() => dispatch({ type: 'stepSet', index })}>
                Volver al paso
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );

  return slot ? createPortal(panel, slot) : panel;
}
