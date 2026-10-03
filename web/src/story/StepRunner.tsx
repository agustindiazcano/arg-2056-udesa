import { useEffect } from 'react';
import { useStore } from '../state/store';
import { STEPS } from '../content/steps';

/**
 * Renders nothing. While the current step has a `play` range and playback is on, it pauses at the end year as soon
 * as the playhead reaches or passes it. It never starts or resumes playback, and it does nothing once the viewer
 * has paused, so it can not fight the viewer.
 */
export function StepRunner(): null {
  const scene = useStore((s) => s.scene);
  const index = useStore((s) => s.stepIndex[s.scene]);
  const yearFloat = useStore((s) => s.yearFloat);
  const playing = useStore((s) => s.playing);
  const dispatch = useStore((s) => s.dispatch);

  const play = STEPS[scene][index]?.focus.play;

  useEffect(() => {
    if (!play || !playing || yearFloat < play.toYear) return;
    dispatch({ type: 'setYear', year: play.toYear });
    // togglePlay flips, so check the live state: never turn playback back on
    if (useStore.getState().playing) dispatch({ type: 'togglePlay' });
  }, [play, playing, yearFloat, dispatch]);

  return null;
}
