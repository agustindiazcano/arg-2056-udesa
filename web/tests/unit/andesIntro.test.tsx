// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AndesIntro, INTRO_FADE_MS, INTRO_MAX_MS, INTRO_MIN_MS } from '../../src/scenes/andes/AndesIntro';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AndesIntro', () => {
  it('shows the title and the year under it over clouds while the map loads, hidden from the screen readers', () => {
    render(<AndesIntro ready={false} />);
    const intro = screen.getByTestId('andes-intro');
    expect(intro.getAttribute('aria-hidden')).toBe('true');
    expect(intro.textContent).toContain('Cruce de los Andes');
    expect(screen.getByText('1817')).toBeTruthy();
    expect(intro.querySelectorAll('.andes-cloud-layer').length).toBeGreaterThanOrEqual(3);
  });

  it('stays while the map is not ready, as long as the map takes', () => {
    render(<AndesIntro ready={false} />);
    act(() => void vi.advanceTimersByTime(INTRO_MAX_MS - 500));
    expect(screen.getByTestId('andes-intro').className).not.toContain('is-leaving');
  });

  it('leaves anyway when the map takes too long, so a slow network does not hold the scene', () => {
    render(<AndesIntro ready={false} />);
    act(() => void vi.advanceTimersByTime(INTRO_MAX_MS + 100));
    expect(screen.getByTestId('andes-intro').className).toContain('is-leaving');
  });

  it('stays its minimum time even when the map is ready at once, then leaves and is removed', () => {
    render(<AndesIntro ready />);
    act(() => void vi.advanceTimersByTime(INTRO_MIN_MS - 100));
    expect(screen.getByTestId('andes-intro').className).not.toContain('is-leaving');
    act(() => void vi.advanceTimersByTime(200));
    expect(screen.getByTestId('andes-intro').className).toContain('is-leaving');
    act(() => void vi.advanceTimersByTime(INTRO_FADE_MS + 50));
    expect(screen.queryByTestId('andes-intro')).toBeNull();
  });

  it('leaves at once when skipped, even when the map is not ready, and tells the scene it was skipped', () => {
    const onDone = vi.fn();
    const { rerender } = render(<AndesIntro ready={false} onDone={onDone} />);
    rerender(<AndesIntro ready={false} skip onDone={onDone} />);
    expect(screen.getByTestId('andes-intro').className).toContain('is-leaving');
    act(() => void vi.advanceTimersByTime(INTRO_FADE_MS + 50));
    expect(screen.queryByTestId('andes-intro')).toBeNull();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(true);
  });

  it('tells the scene the intro was not skipped when it left by itself', () => {
    const onDone = vi.fn();
    render(<AndesIntro ready onDone={onDone} />);
    act(() => void vi.advanceTimersByTime(INTRO_MIN_MS + 100));
    act(() => void vi.advanceTimersByTime(INTRO_FADE_MS + 50));
    expect(onDone).toHaveBeenCalledWith(false);
  });

});
