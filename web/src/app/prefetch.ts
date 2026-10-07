/** The chunks that draw the charts: the Recorrido (with ECharts), the 3D views of the Recorrido and of the Data Dashboard (with Three.js). */
export const CHART_LOADERS: Array<() => Promise<unknown>> = [
  () => import('../tour/TourStep'),
  () => import('../tour3d/TourChart3D'),
  () => import('../three/Chart3D')
];

type Schedule = (run: () => void) => void;

const whenIdle: Schedule = (run) => {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(() => run(), { timeout: 2000 });
  else setTimeout(run, 200);
};

const saveDataRequested = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

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
