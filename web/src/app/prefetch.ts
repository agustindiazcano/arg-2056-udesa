/** The chunks that draw the charts and sections: the Recorrido (with ECharts), the 3D views of the Recorrido and of the Data Dashboard (with Three.js), the Simulator, and the Data page. */
export const CHART_LOADERS: Array<() => Promise<unknown>> = [
  () => import('../tour/TourStep'),
  () => import('../tour3d/TourChart3D'),
  () => import('../three/Chart3D'),
  () => import('../tour/Simulator'),
  () => import('../datasets/DataPage')
];

/** SessionStorage keys used to recover once from a stale hashed chunk 404 after a new deployment. */
export const CHUNK_RELOAD_KEY = 'arg2056.chunkReload';
export const RELOAD_SECTION_KEY = 'arg2056.reloadSection';

/**
 * Recovers once from a failed dynamic chunk import (e.g. HTTP 404 on an old hashed asset after a deploy)
 * by saving the requested section in sessionStorage and reloading the page to fetch the latest index.html.
 * Returns true if a reload was triggered, or false if a reload was already attempted in this session.
 */
export function recoverChunkLoadError(
  section: string,
  reload: () => void = () => window.location.reload()
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') {
      window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return false;
    }
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    window.sessionStorage.setItem(RELOAD_SECTION_KEY, section);
    reload();
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads and clears the section saved before a stale-chunk reload so the user lands directly on the section they clicked.
 */
export function consumeReloadSection(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.sessionStorage.getItem(RELOAD_SECTION_KEY);
    if (!saved) return null;
    window.sessionStorage.removeItem(RELOAD_SECTION_KEY);
    window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    return saved;
  } catch {
    return null;
  }
}

/**
 * Listens for Vite's `vite:preloadError` event (fired when a dynamic import's sub-chunk such as `simModel-*.js` returns 404)
 * and triggers a one-time reload into the active section.
 */
export function installPreloadErrorHandler(
  getSection: () => string,
  reload: () => void = () => window.location.reload()
): () => void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => {};
  const handler = (event: Event) => {
    event.preventDefault();
    recoverChunkLoadError(getSection(), reload);
  };
  window.addEventListener('vite:preloadError', handler);
  return () => window.removeEventListener('vite:preloadError', handler);
}

type Schedule = (run: () => void) => void;

const whenIdle: Schedule = (run) => {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(() => run(), { timeout: 2000 });
  else setTimeout(run, 200);
};

const saveDataRequested = () => typeof navigator !== 'undefined' && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

/**
 * Downloads the chunks of the charts in the background, one at a time and each when the browser is idle, so that the first
 * visit to a chart finds them already loaded instead of waiting for them. A failure is ignored (the real load tries again),
 * and nothing is downloaded when the visitor asked to save data.
 */
export async function prefetchCharts(loaders: Array<() => Promise<unknown>> = CHART_LOADERS, schedule: Schedule = whenIdle, opts: { saveData?: boolean } = {}): Promise<void> {
  if (opts.saveData ?? saveDataRequested()) return;
  for (const load of loaders) {
    await new Promise<void>((resolve) => {
      schedule(() => {
        load().then(
          () => resolve(),
          () => resolve()
        );
      });
    });
  }
}

