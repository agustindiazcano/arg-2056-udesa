import { useCallback, useEffect, useRef, useState } from 'react';
import { FOLLOW_TOTAL_MS } from '../charts3d/followAnim.js';
import type { TimelineClock } from '../charts3d/types.js';

/**
 * The clock of an animation that the visitor can drag: milliseconds since it began, updated on every animation frame, from 0 to
 * `FOLLOW_TOTAL_MS`; a run starts again from 0 when `run` changes. `seek` stops the clock at a moment (the visitor drags the
 * timeline); `pause` and `play` stop it and run it on from where it stands. The same time is in `clock`, a plain object that the 3D charts read on every frame without a React render.
 */
export function useTimeline(
  run: number,
  reduced: boolean,
  speed = 1,
  initialPlaying = true
): { elapsed: number; clock: TimelineClock; seek: (ms: number) => void; playing: boolean; play: () => void; pause: () => void } {
  const clock = useRef<TimelineClock>({ current: reduced ? FOLLOW_TOTAL_MS : 0 });
  const [elapsed, setElapsed] = useState(clock.current.current);
  const [playing, setPlaying] = useState(!reduced && initialPlaying);
  const isFirstRun = useRef(true);

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const set = useCallback((ms: number) => {
    clock.current.current = ms;
    setElapsed(ms);
  }, []);

  // a new run (or reduced motion) puts the clock at its start, or at its end under reduced motion; this effect comes first so the loop below reads it
  useEffect(() => {
    if (reduced) {
      set(FOLLOW_TOTAL_MS);
      setPlaying(false);
      return;
    }
    set(0);
    if (isFirstRun.current) {
      isFirstRun.current = false;
      setPlaying(initialPlaying);
    } else {
      setPlaying(true);
    }
  }, [run, reduced, set, initialPlaying]);

  // while playing, the clock runs on from where it stands
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      // the speed can change while it plays: advance by the time since the last frame times the speed of now
      const ms = Math.min(FOLLOW_TOTAL_MS, clock.current.current + (now - last) * speedRef.current);
      last = now;
      set(ms);
      if (ms < FOLLOW_TOTAL_MS) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, run, set]);

  const seek = useCallback(
    (ms: number) => {
      setPlaying(false);
      set(Math.min(FOLLOW_TOTAL_MS, Math.max(0, ms)));
    },
    [set]
  );
  const pause = useCallback(() => setPlaying(false), []);
  // at the end, play starts again from the beginning
  const play = useCallback(() => {
    if (clock.current.current >= FOLLOW_TOTAL_MS) set(0);
    setPlaying(true);
  }, [set]);

  return { elapsed, clock: clock.current, seek, playing, play, pause };
}
