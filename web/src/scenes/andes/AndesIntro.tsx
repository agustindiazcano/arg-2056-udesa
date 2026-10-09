import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../../runtime/useReducedMotion';
import './andesIntro.css';

/** The least time the loading screen stays, so the title can be read even when the map is ready at once. */
export const INTRO_MIN_MS = 2200;
/** The most it waits for the map: after this it leaves anyway (a slow network must not hold the scene). */
export const INTRO_MAX_MS = 15000;
/** How long it takes to leave (the clouds part and it fades); the same number is in `andesIntro.css`. */
export const INTRO_FADE_MS = 1300;

/**
 * One layer of clouds: an SVG rectangle filled with fractal noise (`feTurbulence`) that a color matrix turns into white with an alpha that
 * is only there where the noise is high, so the clouds have the soft, irregular edges of real ones and no two layers look alike.
 * `base` is the size of the noise (smaller = bigger clouds), `gain` and `cut` how much of the sky they cover.
 */
function CloudLayer({ id, seed, base, gain, cut, className }: { id: string; seed: number; base: string; gain: number; cut: number; className: string }) {
  return (
    <svg className={`andes-cloud-layer ${className}`} width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={base} numOctaves={5} seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${gain} 0 0 0 ${cut}`} />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

interface AndesIntroProps {
  /** the map has its first image */
  ready: boolean;
}

/**
 * The screen the Andes open with: a sky with three layers of clouds drifting at their own pace, "Cruce de los Andes" and under it "1817". It
 * covers the loading of the map (and of the chunk that draws it) and leaves when the map is ready: the clouds part to both sides and it
 * fades. It lets the clicks through and is hidden from the screen readers (the scene under it has the content). With reduced motion the
 * clouds do not drift and it leaves quickly.
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
      <CloudLayer id="andes-cloud-back" seed={4} base="0.0045 0.011" gain={2.6} cut={-1.05} className="andes-cloud-back" />
      <CloudLayer id="andes-cloud-mid" seed={11} base="0.006 0.014" gain={3.2} cut={-1.5} className="andes-cloud-mid" />
      <CloudLayer id="andes-cloud-front" seed={27} base="0.0035 0.009" gain={3.6} cut={-1.8} className="andes-cloud-front" />
      <div className="andes-intro-text">
        <p className="andes-intro-title">Cruce de los Andes</p>
        <p className="andes-intro-year">1817</p>
      </div>
    </div>
  );
}
