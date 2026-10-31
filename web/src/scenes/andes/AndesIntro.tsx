import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../runtime/useReducedMotion';
import { CharacterStage3D } from './CharacterStage3D';
import { ANDES_INTRO_MARCH_FORMATION } from './uniformModels';
import './andesIntro.css';

/** The least time the loading screen stays, so the march and title can be seen even when the map is ready at once. */
export const INTRO_MIN_MS = 1200;
/** The most it waits for the map: after this it leaves anyway (a slow network must not hold the scene). */
export const INTRO_MAX_MS = 8000;
/** How long it takes to leave (the clouds fade out); the same number is in `andesIntro.css`. */
export const INTRO_FADE_MS = 800;

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
  /** the reader skipped the intro: the screen leaves at once, whether the map is ready or not */
  skip?: boolean;
  /** called once, when the screen has left, with whether the reader skipped it (the camera tour starts then, unless it was skipped) */
  onDone?: (skipped: boolean) => void;
}

const BLUE_SOLDIER_COUNT = ANDES_INTRO_MARCH_FORMATION.filter((p) => p.model === 'soldier-blue').length;
const RED_SOLDIER_COUNT = ANDES_INTRO_MARCH_FORMATION.filter((p) => p.model === 'soldier-red').length;

/**
 * The screen the Andes open with: a sky with three layers of clouds drifting at their own pace,
 * San Martín walking in front with 5 soldiers behind him (3 blue and 2 red uniforms) right above "Cruce de los Andes" / "1817".
 */
export function AndesIntro({ ready, skip = false, onDone }: AndesIntroProps) {
  const reduced = useReducedMotion();
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [minPassed, setMinPassed] = useState(false);
  const [maxPassed, setMaxPassed] = useState(false);
  const [gone, setGone] = useState(false);
  const leaving = (ready && minPassed) || maxPassed || skip;

  useEffect(() => {
    const min = window.setTimeout(() => setMinPassed(true), reduced ? 600 : INTRO_MIN_MS);
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

  useEffect(() => {
    if (gone) doneRef.current?.(skip);
  }, [gone]);

  if (gone) return null;
  return (
    <div className={`andes-intro${leaving ? ' is-leaving' : ''}${reduced ? ' is-still' : ''}`} data-testid="andes-intro" aria-hidden="true">
      <CloudLayer id="andes-cloud-back" seed={4} base="0.0045 0.011" gain={2.6} cut={-1.05} className="andes-cloud-back" />
      <CloudLayer id="andes-cloud-mid" seed={11} base="0.006 0.014" gain={3.2} cut={-1.5} className="andes-cloud-mid" />
      <CloudLayer id="andes-cloud-front" seed={27} base="0.0035 0.009" gain={3.6} cut={-1.8} className="andes-cloud-front" />
      <div className="andes-intro-center">
        <div
          className="andes-intro-march"
          data-testid="andes-intro-march"
          data-leader="san-martin"
          data-blue-soldiers={String(BLUE_SOLDIER_COUNT)}
          data-red-soldiers={String(RED_SOLDIER_COUNT)}
        >
          <CharacterStage3D
            placements={ANDES_INTRO_MARCH_FORMATION}
            animationMode="walk"
            cameraPosition={[0, 1.4, 3.2]}
            cameraLookAt={[0, 0.92, 0]}
            cameraFov={48}
            marchBob
            className="andes-intro-march-stage"
          />
        </div>
        <div className="andes-intro-text">
          <p className="andes-intro-title">Cruce de los Andes</p>
          <p className="andes-intro-year">1817</p>
        </div>
      </div>
    </div>
  );
}
