import { useEffect, useRef, useState } from 'react';
import type { ProvinceId } from '../types/province.js';

/** Length of a country / province / department drill, in milliseconds: short, so the map never feels slow. */
export const DRILL_MS = 450;

/**
 * Which map the user is looking at. The country view stays until the departments of the selected province are
 * actually drawn, so the drill fires when the picture changes, not when the request starts.
 */
export function drillViewKey(selectedId: ProvinceId | string | null, departmentsDrawn: boolean): string {
  return selectedId && departmentsDrawn ? `dept:${selectedId}` : 'country';
}

/** ECharts options merged with a camera move (zoom / center) so it interpolates; instant under reduced motion. */
export function cameraAnimation(reduced: boolean): { animationDurationUpdate: number; animationEasingUpdate: 'cubicInOut' } {
  return { animationDurationUpdate: reduced ? 0 : DRILL_MS, animationEasingUpdate: 'cubicInOut' };
}

/**
 * True for `DRILL_MS` after the view key changes (never on the first render, never with reduced motion).
 * Driven by state changes only; the timer is cleared on unmount and on the next change.
 */
export function useDrillTransition(viewKey: string, reduced: boolean): boolean {
  const [active, setActive] = useState(false);
  const previous = useRef(viewKey);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useEffect(() => {
    if (previous.current === viewKey) return;
    previous.current = viewKey;
    if (reducedRef.current) {
      setActive(false);
      return;
    }
    setActive(true);
    const timer = setTimeout(() => setActive(false), DRILL_MS);
    return () => clearTimeout(timer);
  }, [viewKey]);

  return active && !reduced;
}
