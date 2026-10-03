// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { useStore } from '../../src/state/store';
import { INITIAL_STEP_INDEX } from '../../src/state/reducer';

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
  useStore.setState({
    scene: 'andes',
    yearFloat: 2026,
    scenario: 'expected',
    playing: false,
    province: null,
    aiOverlay: 'off',
    stepIndex: { ...INITIAL_STEP_INDEX }
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function press(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}

describe('App shell with the story layer', () => {
  it('mounts the caption panel', () => {
    render(<App />);
    expect(screen.getByRole('region', { name: 'Story' })).toBeTruthy();
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
  });

  it('PageDown and PageUp move the step in each of the six scenes (assert the store)', () => {
    render(<App />);
    for (const scene of ['andes', 'economy', 'resources', 'forecast', 'ai-revolution', 'sandbox'] as const) {
      act(() => useStore.getState().dispatch({ type: 'setScene', scene }));
      expect(useStore.getState().stepIndex[scene]).toBe(0);
      press('PageDown');
      expect(useStore.getState().stepIndex[scene]).toBe(1);
      press('PageDown');
      expect(useStore.getState().stepIndex[scene]).toBe(2);
      press('PageDown'); // clamped
      expect(useStore.getState().stepIndex[scene]).toBe(2);
      press('PageUp');
      expect(useStore.getState().stepIndex[scene]).toBe(1);
      press('Home');
      expect(useStore.getState().stepIndex[scene]).toBe(0);
    }
  });

  it('the arrow keys still change scene, and the new scene starts at its step 1', () => {
    render(<App />);
    press('PageDown');
    press('ArrowRight');
    expect(useStore.getState().scene).toBe('economy');
    expect(useStore.getState().stepIndex.economy).toBe(0);
    expect(useStore.getState().yearFloat).toBe(1880);
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
  });

  it('the caption panel is not part of the references entry', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../../src/references/main.tsx', import.meta.url), 'utf8')
    );
    expect(source).not.toMatch(/story|StoryCaption|StepRunner/);
  });
});
