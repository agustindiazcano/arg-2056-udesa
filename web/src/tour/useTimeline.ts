import { useCallback, useEffect, useRef, useState } from 'react';
import { FOLLOW_TOTAL_MS } from '../charts3d/followAnim.js';
import type { TimelineClock } from '../charts3d/types.js';

/**
 * The clock of an animation that the visitor can drag: milliseconds since it began, updated on every animation frame, from 0 to
 * `FOLLOW_TOTAL_MS`; a run starts again from 0 when `run` changes. `seek` stops the clock at a moment (the visitor drags the
 * timeline). The same time is in `clock`, a plain object that the 3D charts read on every frame without a React render.
 */
export function useTimeline(run: number, reduced: boolean): { elapsed: number; clock: TimelineClock; seek: (ms: number) => void } {
  const clock = useRef<TimelineClock>({ current: reduced ? FOLLOW_TOTAL_MS : 0 });
  const [elapsed, setElapsed] = useState(clock.current.current);
  const frame = useRef(0);

  const set = useCallback((ms: number) => {
    clock.current.current = ms;
    setElapsed(ms);
  }, []);

  useEffect(() => {
    if (reduced) {
      set(FOLLOW_TOTAL_MS);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const ms = Math.min(FOLLOW_TOTAL_MS, now - start);
      set(ms);
      if (ms < FOLLOW_TOTAL_MS) frame.current = requestAnimationFrame(tick);
    };
    set(0);
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [run, reduced, set]);

  const seek = useCallback(
    (ms: number) => {
      cancelAnimationFrame(frame.current);
      set(Math.min(FOLLOW_TOTAL_MS, Math.max(0, ms)));
    },
    [set]
  );

  return { elapsed, clock: clock.current, seek };
}
