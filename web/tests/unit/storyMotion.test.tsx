// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fromTo, kill } = vi.hoisted(() => {
  const kill = vi.fn();
  return { kill, fromTo: vi.fn(() => ({ kill })) };
});
vi.mock('gsap', () => ({ gsap: { fromTo, to: vi.fn(() => ({ kill })) } }));

import { StoryCaption } from '../../src/story/StoryCaption';
import { useStore } from '../../src/state/store';
import { INITIAL_STEP_INDEX } from '../../src/state/reducer';

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
  useStore.setState({ scene: 'economy', stepIndex: { ...INITIAL_STEP_INDEX }, playing: false });
});
afterEach(cleanup);

describe('StoryCaption motion', () => {
  it('does not animate when it mounts, and fades the text in each time the step changes', () => {
    render(<StoryCaption />);
    expect(fromTo).not.toHaveBeenCalled();
    act(() => useStore.getState().dispatch({ type: 'stepNext' }));
    expect(fromTo).toHaveBeenCalledTimes(1);
    const call = fromTo.mock.calls[0] as unknown as [Element, Record<string, unknown>, Record<string, unknown>];
    expect(call[1]).toEqual({ opacity: 0, y: 12 });
    expect(call[2]).toMatchObject({ opacity: 1, y: 0, duration: 0.3 });
  });

  it('does not animate under reduced motion', () => {
    setReducedMotion(true);
    render(<StoryCaption />);
    act(() => useStore.getState().dispatch({ type: 'stepNext' }));
    expect(fromTo).not.toHaveBeenCalled();
  });
});
