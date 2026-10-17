// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DRILL_MS,
  cameraAnimation,
  drillViewKey,
  useDrillTransition
} from '../../src/charts/drillTransition';

function Probe({ viewKey, reduced, onRender }: { viewKey: string; reduced: boolean; onRender: (v: boolean) => void }) {
  onRender(useDrillTransition(viewKey, reduced));
  return null;
}

describe('drillViewKey', () => {
  it('is the country view without a selection', () => {
    expect(drillViewKey(null, false)).toBe('country');
  });

  it('stays the country view while the departments of the selected province load', () => {
    expect(drillViewKey('AR-A', false)).toBe('country');
  });

  it('is a department view of the province once its departments are drawn', () => {
    expect(drillViewKey('AR-A', true)).toBe('dept:AR-A');
    expect(drillViewKey('AR-B', true)).not.toBe(drillViewKey('AR-A', true));
  });
});

describe('cameraAnimation', () => {
  it('interpolates the camera over the drill duration with an ease when motion is on', () => {
    expect(cameraAnimation(false)).toEqual({ animationDurationUpdate: DRILL_MS, animationEasingUpdate: 'cubicInOut' });
  });

  it('moves the camera at once with reduced motion', () => {
    expect(cameraAnimation(true).animationDurationUpdate).toBe(0);
  });

  it('keeps the drill short', () => {
    expect(DRILL_MS).toBeGreaterThan(0);
    expect(DRILL_MS).toBeLessThanOrEqual(600);
  });
});

describe('useDrillTransition', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('does not animate on the first render', () => {
    const seen: boolean[] = [];
    render(<Probe viewKey="country" reduced={false} onRender={(v) => seen.push(v)} />);
    expect(seen.every((v) => !v)).toBe(true);
  });

  it('turns on once when the view changes and off after the drill duration', () => {
    const seen: boolean[] = [];
    const onRender = (v: boolean) => seen.push(v);
    const { rerender } = render(<Probe viewKey="country" reduced={false} onRender={onRender} />);
    seen.length = 0;
    rerender(<Probe viewKey="dept:AR-A" reduced={false} onRender={onRender} />);
    expect(seen.at(-1)).toBe(true);
    const rises = seen.filter((v, i) => v && !seen[i - 1]).length;
    expect(rises).toBe(1);

    act(() => vi.advanceTimersByTime(DRILL_MS - 1));
    expect(seen.at(-1)).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(seen.at(-1)).toBe(false);
  });

  it('does not turn on again when the component re-renders with the same view', () => {
    const seen: boolean[] = [];
    const onRender = (v: boolean) => seen.push(v);
    const { rerender } = render(<Probe viewKey="country" reduced={false} onRender={onRender} />);
    rerender(<Probe viewKey="country" reduced={false} onRender={onRender} />);
    rerender(<Probe viewKey="country" reduced={false} onRender={onRender} />);
    expect(seen.some((v) => v)).toBe(false);
  });

  it('never animates with reduced motion', () => {
    const seen: boolean[] = [];
    const onRender = (v: boolean) => seen.push(v);
    const { rerender } = render(<Probe viewKey="country" reduced onRender={onRender} />);
    rerender(<Probe viewKey="dept:AR-A" reduced onRender={onRender} />);
    rerender(<Probe viewKey="country" reduced onRender={onRender} />);
    expect(seen.some((v) => v)).toBe(false);
  });

  it('turns off if reduced motion is switched on mid-drill', () => {
    const seen: boolean[] = [];
    const onRender = (v: boolean) => seen.push(v);
    const { rerender } = render(<Probe viewKey="country" reduced={false} onRender={onRender} />);
    rerender(<Probe viewKey="dept:AR-A" reduced={false} onRender={onRender} />);
    expect(seen.at(-1)).toBe(true);
    rerender(<Probe viewKey="dept:AR-A" reduced onRender={onRender} />);
    expect(seen.at(-1)).toBe(false);
  });

  it('clears its timer on unmount', () => {
    const { rerender, unmount } = render(<Probe viewKey="country" reduced={false} onRender={() => undefined} />);
    rerender(<Probe viewKey="dept:AR-A" reduced={false} onRender={() => undefined} />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
