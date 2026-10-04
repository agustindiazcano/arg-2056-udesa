// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fromTo, to, kill } = vi.hoisted(() => {
  const kill = vi.fn();
  return { kill, fromTo: vi.fn(() => ({ kill })), to: vi.fn(() => ({ kill })) };
});
vi.mock('gsap', () => ({ gsap: { fromTo, to } }));

import { CountUp } from '../../src/motion/CountUp';
import { SceneTransition } from '../../src/motion/SceneTransition';
import { COUNTER, SCENE_TRANSITION, SERIES_DRAW_MS } from '../../src/motion/timings';

function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  vi.clearAllMocks();
  setReducedMotion(false);
});
afterEach(cleanup);

describe('timings (design.md section 5)', () => {
  it('a scene change is 400 ms of fade and a 24 px rise, ease-out cubic', () => {
    expect(SCENE_TRANSITION).toEqual({ duration: 0.4, y: 24, ease: 'power3.out' });
  });
  it('series and counters take 600 ms', () => {
    expect(SERIES_DRAW_MS).toBe(600);
    expect(COUNTER).toEqual({ duration: 0.6, ease: 'power3.out' });
  });
});

describe('SceneTransition', () => {
  it('fades and raises the scene when it mounts and again when the key changes', () => {
    const { rerender } = render(
      <SceneTransition sceneKey="andes">
        <p>uno</p>
      </SceneTransition>
    );
    expect(screen.getByText('uno')).toBeTruthy();
    expect(fromTo).toHaveBeenCalledTimes(1);
    const calls = fromTo.mock.calls as unknown as Array<[Element, Record<string, unknown>, Record<string, unknown>]>;
    expect(calls[0]![0]).toBeInstanceOf(HTMLElement);
    expect(calls[0]![1]).toEqual({ opacity: 0, y: 24 });
    expect(calls[0]![2]).toMatchObject({ opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });

    rerender(
      <SceneTransition sceneKey="economy">
        <p>dos</p>
      </SceneTransition>
    );
    expect(fromTo).toHaveBeenCalledTimes(2);
  });

  it('does not animate again when only the children change', () => {
    const { rerender } = render(
      <SceneTransition sceneKey="andes">
        <p>uno</p>
      </SceneTransition>
    );
    rerender(
      <SceneTransition sceneKey="andes">
        <p>otro</p>
      </SceneTransition>
    );
    expect(fromTo).toHaveBeenCalledTimes(1);
  });

  it('kills the tween on unmount', () => {
    const { unmount } = render(
      <SceneTransition sceneKey="andes">
        <p>uno</p>
      </SceneTransition>
    );
    unmount();
    expect(kill).toHaveBeenCalled();
  });

  it('does not animate under reduced motion', () => {
    setReducedMotion(true);
    render(
      <SceneTransition sceneKey="andes">
        <p>uno</p>
      </SceneTransition>
    );
    expect(screen.getByText('uno')).toBeTruthy();
    expect(fromTo).not.toHaveBeenCalled();
  });
});

describe('CountUp', () => {
  const format = (n: number) => `${Math.round(n)} u`;

  it('counts from zero to the value in 600 ms when it mounts, and ends on the exact text', () => {
    render(<CountUp value={110} format={format} />);
    expect(to).toHaveBeenCalledTimes(1);
    const [target, vars] = to.mock.calls[0] as unknown as [{ n: number }, Record<string, unknown> & { onUpdate: () => void; onComplete: () => void }];
    expect(vars).toMatchObject({ n: 110, duration: 0.6, ease: 'power3.out' });
    expect(screen.getByText('0 u')).toBeTruthy();
    target.n = 55;
    act(() => vars.onUpdate());
    expect(screen.getByText('55 u')).toBeTruthy();
    act(() => vars.onComplete());
    expect(screen.getByText('110 u')).toBeTruthy();
  });

  it('snaps to a new value without counting again', () => {
    const { rerender } = render(<CountUp value={110} format={format} />);
    rerender(<CountUp value={150} format={format} />);
    expect(to).toHaveBeenCalledTimes(1);
    expect(screen.getByText('150 u')).toBeTruthy();
  });

  it('shows the fallback and never counts when there is no value', () => {
    render(<CountUp value={null} format={format} fallback="sin datos" />);
    expect(screen.getByText('sin datos')).toBeTruthy();
    expect(to).not.toHaveBeenCalled();
  });

  it('shows the final text at once under reduced motion', () => {
    setReducedMotion(true);
    render(<CountUp value={110} format={format} />);
    expect(screen.getByText('110 u')).toBeTruthy();
    expect(to).not.toHaveBeenCalled();
  });

  it('kills the tween on unmount', () => {
    const { unmount } = render(<CountUp value={110} format={format} />);
    unmount();
    expect(kill).toHaveBeenCalled();
  });
});

describe('tiles count up on mount', () => {
  it('the economy value tile counts up and ends on the exact number', async () => {
    const { StatTiles } = await import('../../src/scenes/economy/StatTiles');
    const records = [
      { country: 'ARG', year: 1900, indicator: 'gdp_per_capita_usd', value: 110, unit: 'u', source: 'S', retrieved_at: '2026-10-02' },
      { country: 'BRA', year: 1900, indicator: 'gdp_per_capita_usd', value: 50, unit: 'u', source: 'S', retrieved_at: '2026-10-02' }
    ] as unknown as Parameters<typeof StatTiles>[0]['records'];
    render(<StatTiles records={records} indicator="gdp_per_capita_usd" year={1900} home="ARG" countries={['ARG', 'BRA']} unit="u" />);
    const call = to.mock.calls[0] as unknown as [unknown, { n: number; onComplete: () => void }];
    expect(call[1].n).toBe(110);
    act(() => call[1].onComplete());
    expect(screen.getByTestId('tile-value').textContent).toContain('110 u');
  });
});
