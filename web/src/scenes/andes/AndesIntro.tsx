import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../../runtime/useReducedMotion';
import './andesIntro.css';

/** The least time the loading screen stays, so the title can be read even when the map is ready at once. */
export const INTRO_MIN_MS = 2200;
/** The most it waits for the map: after this it leaves anyway (a slow network must not hold the scene). */
export const INTRO_MAX_MS = 15000;
/** How long it takes to leave (the clouds part and it fades); the same number is in `andesIntro.css`. */
export const INTRO_FADE_MS = 1300;

const CLOUDS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

interface AndesIntroProps {
  /** the map has its first image */
  ready: boolean;
}

/**
 * The screen the Andes open with: clouds drifting over a sky, and "Los Andes · 1817". It covers the loading of the map (and of the chunk
 * that draws it) and leaves when the map is ready: the clouds part to both sides and it fades. It lets the clicks through and is hidden from
 * the screen readers (the scene under it has the content). With reduced motion the clouds do not drift and it leaves quickly.
 */
export function AndesIntro({ ready }: AndesIntroProps) {
  const reduced = useReducedMotion();
  const [minPassed, setMinPassed] = useState(false);
  const [maxPassed, setMaxPassed] = useState(false);
  const [gone, setGone] = useState(false);
  const leaving = (ready && minPassed) || maxPassed;

  useEffect(() => {
    const min = window.setTimeout(() => setMinPassed(true), reduced ? 900 : INTRO_MIN_MS);
    const max = window.setTimeout(() => setMaxPassed(true), INTRO_MAX_MS);
    return () => {
      window.clearTimeout(min);
      window.clearTimeout(max);
    };
  }, [reduced]);

  useEffect(() => {
    if (!leaving) return undefined;
    const t = window.setTimeout(() => setGone(true), reduced ? 300 : INTRO_FADE_MS);
    return () => window.clearTimeout(t);
  }, [leaving, reduced]);

  if (gone) return null;
  return (
    <div className={`andes-intro${leaving ? ' is-leaving' : ''}${reduced ? ' is-still' : ''}`} data-testid="andes-intro" aria-hidden="true">
      {CLOUDS.map((c) => (
        <span key={c} className={`andes-cloud andes-cloud-${c}`} />
      ))}
      <p className="andes-intro-title">Los Andes · 1817</p>
    </div>
  );
}
