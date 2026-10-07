import { describe, expect, it, vi } from 'vitest';
import { prefetchCharts } from '../../src/app/prefetch';

describe('prefetchCharts', () => {
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
