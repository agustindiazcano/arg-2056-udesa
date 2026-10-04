// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// The real scenes load charts and maps; the shell wiring is what is under test here.
vi.mock('../../src/scenes/registry', () => {
  const Stub = () => <div>scene stub</div>;
  const names = ['andes', 'economy', 'resources', 'forecast', 'ai-revolution', 'sandbox'] as const;
  return {
    SCENE_COMPONENTS: Object.fromEntries(names.map((n) => [n, Stub])),
    SCENE_LABELS: Object.fromEntries(names.map((n) => [n, n]))
  };
});

import { App } from '../../src/app/App';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  window.history.pushState({}, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('App with the capability provider', () => {
  it('shows the quality debug line with ?debug=1, using the ?quality= override', () => {
    window.history.pushState({}, '', '/?debug=1&quality=low');
    render(<App />);
    expect(screen.getByText('quality: low')).toBeTruthy();
  });

  it('shows no debug line without ?debug=1', () => {
    window.history.pushState({}, '', '/?quality=low');
    render(<App />);
    expect(screen.queryByText(/^quality:/)).toBeNull();
  });
});
