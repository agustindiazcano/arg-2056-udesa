// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTicker } from '../../src/state/useTicker';
import { useStore } from '../../src/state/store';

describe('useTicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => setTimeout(() => cb(performance.now()), 16.6) as unknown as number);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => clearTimeout(id as unknown as number));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('runs tick on each animation frame while playing', () => {
    useStore.setState({ playing: true });
    const tickSpy = vi.spyOn(useStore.getState(), 'tick');
    
    renderHook(() => useTicker());
    
    expect(tickSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(34); // ~2 frames
    
    expect(tickSpy).toHaveBeenCalled();
  });

  it('cancels on unmount', () => {
    useStore.setState({ playing: true });
    const { unmount } = renderHook(() => useTicker());
    
    unmount();
    const tickSpy = vi.spyOn(useStore.getState(), 'tick');
    vi.advanceTimersByTime(34);
    
    expect(tickSpy).not.toHaveBeenCalled();
  });
});
