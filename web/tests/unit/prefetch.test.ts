import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CHART_LOADERS,
  CHUNK_RELOAD_KEY,
  RELOAD_SECTION_KEY,
  consumeReloadSection,
  installPreloadErrorHandler,
  prefetchCharts,
  recoverChunkLoadError
} from '../../src/app/prefetch';

afterEach(() => {
  try {
    window.sessionStorage?.clear();
  } catch {
    // ignore in plain node
  }
  vi.unstubAllGlobals();
});

describe('prefetchCharts', () => {
  it('includes TourStep, TourChart3D, Chart3D, Simulator, and DataPage in CHART_LOADERS so DataPage is prefetched before a deploy can invalidate its hash', () => {
    expect(CHART_LOADERS).toHaveLength(5);
  });

  it('loads every chunk of the charts, one at a time, each when the browser is idle', async () => {
    const order: string[] = [];
    const loaders = ['tour', 'three', 'dashboard'].map((name) => () => {
      order.push(`start ${name}`);
      return Promise.resolve().then(() => order.push(`end ${name}`));
    });
    const queue: Array<() => void> = [];
    const done = prefetchCharts(loaders, (run) => queue.push(run));
    expect(order).toEqual([]); // nothing runs before the browser is idle
    let finished = false;
    void done.then(() => (finished = true));
    while (!finished) {
      queue.shift()?.();
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(order).toEqual(['start tour', 'end tour', 'start three', 'end three', 'start dashboard', 'end dashboard']);
  });

  it('works where there is no navigator (a plain Node, as in the CI)', async () => {
    vi.stubGlobal('navigator', undefined);
    const loader = vi.fn(() => Promise.resolve());
    await prefetchCharts([loader], (run) => run());
    expect(loader).toHaveBeenCalledOnce();
  });

  it('does nothing when the visitor asked to save data', async () => {
    const loader = vi.fn(() => Promise.resolve());
    await prefetchCharts([loader], (run) => run(), { saveData: true });
    expect(loader).not.toHaveBeenCalled();
  });

  it('a chunk that fails does not stop the others (the real load will try again)', async () => {
    const ok = vi.fn(() => Promise.resolve());
    await prefetchCharts([() => Promise.reject(new Error('offline')), ok], (run) => run());
    expect(ok).toHaveBeenCalledOnce();
  });
});

describe('stale chunk 404 recovery (recoverChunkLoadError & consumeReloadSection)', () => {
  const makeStorage = () => {
    const store = new Map<string, string>();
    return {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      }
    };
  };

  it('reloads once and saves the target section on first chunk load failure, then prevents infinite reload loops', () => {
    const storage = makeStorage();
    vi.stubGlobal('window', { sessionStorage: storage, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const reload = vi.fn();

    expect(recoverChunkLoadError('data', reload)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
    expect(storage.getItem(RELOAD_SECTION_KEY)).toBe('data');
    expect(storage.getItem(CHUNK_RELOAD_KEY)).toBe('1');

    // If the chunk still fails immediately after reload, do not reload in a loop
    expect(recoverChunkLoadError('data', reload)).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('consumeReloadSection returns and clears the saved section after reload', () => {
    const storage = makeStorage();
    storage.setItem(RELOAD_SECTION_KEY, 'data');
    storage.setItem(CHUNK_RELOAD_KEY, '1');
    vi.stubGlobal('window', { sessionStorage: storage });

    expect(consumeReloadSection()).toBe('data');
    expect(storage.getItem(RELOAD_SECTION_KEY)).toBeNull();
    expect(storage.getItem(CHUNK_RELOAD_KEY)).toBeNull();
    expect(consumeReloadSection()).toBeNull();
  });

  it('installPreloadErrorHandler intercepts vite:preloadError and triggers a reload for the active section', () => {
    const storage = makeStorage();
    const listeners = new Map<string, EventListener>();
    vi.stubGlobal('window', {
      sessionStorage: storage,
      addEventListener: (type: string, fn: EventListener) => listeners.set(type, fn),
      removeEventListener: (type: string) => listeners.delete(type)
    });
    const reload = vi.fn();
    const cleanup = installPreloadErrorHandler(() => 'data', reload);
    const handler = listeners.get('vite:preloadError');
    expect(handler).toBeTypeOf('function');

    const evt = new Event('vite:preloadError', { cancelable: true });
    handler!(evt);
    expect(evt.defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
    expect(storage.getItem(RELOAD_SECTION_KEY)).toBe('data');

    cleanup();
    expect(listeners.has('vite:preloadError')).toBe(false);
  });
});

