// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { useReducedMotion } from '../../src/runtime/useReducedMotion';
import { EChart } from '../../src/charts/EChart';

const { mockInit, mockSetOption } = vi.hoisted(() => {
  const mockSetOption = vi.fn();
  const mockInit = vi.fn(() => ({ setOption: mockSetOption, resize: vi.fn(), dispose: vi.fn(), on: vi.fn() }));
  return { mockInit, mockSetOption };
});
vi.mock('../../src/charts/echarts.js', () => ({ init: mockInit }));

const QUERY = '(prefers-reduced-motion: reduce)';

/** A controllable matchMedia: `set(true)` flips the answer and notifies the listeners, like the OS setting does. */
function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const asked: string[] = [];
  vi.stubGlobal('matchMedia', (query: string) => {
    asked.push(query);
    return {
      get matches() {
        return query === QUERY && matches;
      },
      media: query,
      addEventListener: (_type: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_type: string, fn: () => void) => listeners.delete(fn)
    };
  });
  return {
    asked,
    listeners,
    set(value: boolean) {
      matches = value;
      act(() => listeners.forEach((fn) => fn()));
    }
  };
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Probe() {
  return <span data-testid="rm">{String(useReducedMotion())}</span>;
}

describe('useReducedMotion', () => {
  it('is true when the user prefers reduced motion and asks for exactly that query', () => {
    const media = stubMatchMedia(true);
    render(<Probe />);
    expect(screen.getByTestId('rm').textContent).toBe('true');
    expect(new Set(media.asked)).toEqual(new Set([QUERY]));
  });

  it('is false when the user has no preference', () => {
    stubMatchMedia(false);
    render(<Probe />);
    expect(screen.getByTestId('rm').textContent).toBe('false');
  });

  it('follows the media query when it changes, in both directions', () => {
    const media = stubMatchMedia(false);
    render(<Probe />);
    media.set(true);
    expect(screen.getByTestId('rm').textContent).toBe('true');
    media.set(false);
    expect(screen.getByTestId('rm').textContent).toBe('false');
  });

  it('stops listening on unmount', () => {
    const media = stubMatchMedia(false);
    const { unmount } = render(<Probe />);
    expect(media.listeners.size).toBe(1);
    unmount();
    expect(media.listeners.size).toBe(0);
  });

  it('is false, without throwing, where matchMedia does not exist (jsdom, server rendering)', () => {
    vi.stubGlobal('matchMedia', undefined);
    render(<Probe />);
    expect(screen.getByTestId('rm').textContent).toBe('false');
  });
});

describe('EChart and reduced motion', () => {
  it('passes animation: false to a copy of the option when reduced motion is on, and leaves the option alone', () => {
    stubMatchMedia(true);
    const option = { animation: true, title: { text: 'T' } };
    render(<EChart option={option} />);
    expect(mockSetOption).toHaveBeenCalledWith({ animation: false, title: { text: 'T' } }, true);
    expect(option.animation).toBe(true);
  });

  it('adds animation: false even when the builder did not set animation', () => {
    stubMatchMedia(true);
    render(<EChart option={{ title: { text: 'T' } }} />);
    expect(mockSetOption).toHaveBeenCalledWith({ title: { text: 'T' }, animation: false }, true);
  });

  it('draws the series in over 600 ms when reduced motion is off, on a copy that keeps the builder option intact', () => {
    stubMatchMedia(false);
    const option = { animation: false, title: { text: 'T' } };
    render(<EChart option={option} />);
    expect(mockSetOption).toHaveBeenCalledTimes(1);
    expect(mockSetOption.mock.calls[0]![0]).toMatchObject({
      animation: true,
      animationDuration: 600,
      animationDurationUpdate: 0,
      title: { text: 'T' }
    });
    expect(option).toEqual({ animation: false, title: { text: 'T' } });
  });

  it('applies the preference when it changes while the chart is shown, without re-creating the chart', () => {
    const media = stubMatchMedia(false);
    render(<EChart option={{ title: { text: 'T' } }} />);
    media.set(true);
    expect(mockSetOption).toHaveBeenLastCalledWith({ title: { text: 'T' }, animation: false }, true);
    expect(mockInit).toHaveBeenCalledTimes(1);
  });
});

describe('global stylesheet', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/tokens.css'), 'utf8');

  it('has exactly one prefers-reduced-motion block, and it switches off transitions and animations everywhere', () => {
    const blocks = css.match(/@media \(prefers-reduced-motion: reduce\)/g) ?? [];
    expect(blocks).toHaveLength(1);
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(block).toMatch(/\*,\s*\*::before,\s*\*::after/);
    expect(block).toMatch(/transition: none !important/);
    expect(block).toMatch(/animation: none !important/);
  });
});
