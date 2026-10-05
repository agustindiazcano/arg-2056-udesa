import React, { Suspense, lazy, useState } from 'react';
import { App } from './App';
import { useStore } from '../state/store';
import type { Section } from '../types/scene';
import { YEAR_MIN } from '../types/year';

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
  if (started) {
    return (
      <App
        onHome={() => {
          useStore.setState({ playing: false });
          setStarted(false);
        }}
      />
    );
  }
  return (
    <Suspense fallback={null}>
      <Intro
        onStart={(section: Section) => {
          // the crossing always starts at 0 %, also when the intro is opened again in the middle of it
          if (section === 'andes') useStore.setState({ yearFloat: YEAR_MIN, playing: false });
          useStore.getState().dispatch({ type: 'setSection', section });
          setStarted(true);
        }}
      />
    </Suspense>
  );
}
