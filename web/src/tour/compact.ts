import { useSyncExternalStore } from 'react';

/** A short laptop screen. Narrow screens (900 px or less) keep their own stacked layout. */
export const COMPACT_QUERY = '(max-height: 820px) and (min-width: 901px)';

/** The same rule as `COMPACT_QUERY`, for code that has the size and no `matchMedia`. */
export function isCompact(width: number, height: number): boolean {
  return height <= 820 && width >= 901;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;
  const media = window.matchMedia(COMPACT_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function snapshot(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(COMPACT_QUERY).matches;
}

/** True on a short laptop screen; the Recorrido then shows one chart big and the others behind small buttons. */
export function useCompact(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
