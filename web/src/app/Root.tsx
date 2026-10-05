import React, { Suspense, lazy, useState } from 'react';
import { App } from './App';
import { useStore } from '../state/store';
import type { Section } from '../types/scene';

// The intro carries the province outlines: its own chunk, so the app does not pay for it
const Intro = lazy(() => import('../intro/Intro').then((m) => ({ default: m.Intro })));

/** `?intro=0` in the address, or the key set in localStorage (the e2e fixture sets it), skips the intro. */
export const SKIP_INTRO_KEY = 'arg2056.skipIntro';

function skipIntro(): boolean {
  if (new URLSearchParams(window.location.search).get('intro') === '0') return true;
  try {
    return window.localStorage.getItem(SKIP_INTRO_KEY) === '1';
  } catch {
    return false; // storage blocked: show the intro
  }
}

/** The first screen is the intro; "Comenzar" opens the app in the Andes, and each button under it in its own section. */
export function Root() {
  const [started, setStarted] = useState(skipIntro);
  if (started) return <App />;
  return (
    <Suspense fallback={null}>
      <Intro
        onStart={(section: Section) => {
          useStore.getState().dispatch({ type: 'setSection', section });
          setStarted(true);
        }}
      />
    </Suspense>
  );
}
