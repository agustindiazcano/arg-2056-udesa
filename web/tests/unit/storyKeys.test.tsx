// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { KEY_MAP, resolveKey, type KeyAction } from '../../src/types/keys';
import { useKeyboard } from '../../src/state/useKeyboard';
import { useStore } from '../../src/state/store';

// The map as the shell brief defined it (AGENTS.md section 8 plus `=` as the second speed-up key).
// Written here on purpose, not read from the current file, so a change to an old entry fails this test.
const PREVIOUS_ENTRIES: Record<string, KeyAction> = {
  ArrowRight: { type: 'nextScene' },
  ArrowLeft: { type: 'prevScene' },
  ' ': { type: 'togglePlay' },
  '+': { type: 'speedUp' },
  '=': { type: 'speedUp' },
  '-': { type: 'speedDown' },
  '1': { type: 'setScenario', scenario: 'pessimistic' },
  '2': { type: 'setScenario', scenario: 'expected' },
  '3': { type: 'setScenario', scenario: 'optimistic' },
  d: { type: 'toggle3D' },
  p: { type: 'openProvinceFilter' },
  Escape: { type: 'back' }
};

const NEW_ENTRIES: Record<string, KeyAction> = {
  PageDown: { type: 'stepNext' },
  PageUp: { type: 'stepPrev' },
  Home: { type: 'stepFirst' }
};

describe('KEY_MAP', () => {
  it('keeps every previous entry unchanged', () => {
    for (const [key, action] of Object.entries(PREVIOUS_ENTRIES)) {
      expect(KEY_MAP[key], `key ${JSON.stringify(key)}`).toEqual(action);
    }
  });

  it('maps the three new keys to the three step actions', () => {
    for (const [key, action] of Object.entries(NEW_ENTRIES)) {
      expect(KEY_MAP[key], `key ${key}`).toEqual(action);
      expect(resolveKey(key)).toEqual(action);
    }
  });

  it('has no other entries', () => {
    expect(Object.keys(KEY_MAP).sort()).toEqual([...Object.keys(PREVIOUS_ENTRIES), ...Object.keys(NEW_ENTRIES)].sort());
  });
});

describe('useKeyboard with the step keys', () => {
  beforeEach(() => {
    useStore.setState({ playing: false, speed: 1, scene: 'andes' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it.each([
    ['PageDown', { type: 'stepNext' }],
    ['PageUp', { type: 'stepPrev' }],
    ['Home', { type: 'stepFirst' }]
  ])('%s dispatches %j and calls preventDefault', (key, action) => {
    const dispatchSpy = vi.spyOn(useStore.getState(), 'dispatch');
    const { unmount } = renderHook(() => useKeyboard());

    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(action);
    expect(preventDefaultSpy).toHaveBeenCalled();
    unmount();
  });

  it.each(['input', 'select', 'textarea'])('ignores the step keys when the target is a %s', (tag) => {
    const dispatchSpy = vi.spyOn(useStore.getState(), 'dispatch');
    const { unmount } = renderHook(() => useKeyboard());

    const el = document.createElement(tag);
    document.body.appendChild(el);
    el.focus();
    for (const key of ['PageDown', 'PageUp', 'Home']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      el.dispatchEvent(event);
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    }

    expect(dispatchSpy).not.toHaveBeenCalled();
    el.remove();
    unmount();
  });

  it('ignores the step keys inside a contenteditable element', () => {
    const dispatchSpy = vi.spyOn(useStore.getState(), 'dispatch');
    const { unmount } = renderHook(() => useKeyboard());

    const el = document.createElement('div');
    el.contentEditable = 'true';
    // jsdom does not implement isContentEditable, so the property the hook reads is defined by hand
    Object.defineProperty(el, 'isContentEditable', { value: true });
    document.body.appendChild(el);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));

    expect(dispatchSpy).not.toHaveBeenCalled();
    el.remove();
    unmount();
  });

  it('the step keys still work when a button has the focus', () => {
    const dispatchSpy = vi.spyOn(useStore.getState(), 'dispatch');
    const { unmount } = renderHook(() => useKeyboard());

    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));

    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'stepNext' });
    button.remove();
    unmount();
  });

  it('PageDown changes the store through the reducer (assert state, not pixels)', () => {
    const { unmount } = renderHook(() => useKeyboard());
    useStore.setState({ scene: 'economy', stepIndex: { andes: 0, economy: 0, resources: 0, forecast: 0, 'ai-revolution': 0, sandbox: 0 } });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true }));
    expect(useStore.getState().stepIndex.economy).toBe(1);
    expect(useStore.getState().yearFloat).toBe(1950);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true, cancelable: true }));
    expect(useStore.getState().stepIndex.economy).toBe(0);
    expect(useStore.getState().yearFloat).toBe(1880);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    expect(useStore.getState().stepIndex.economy).toBe(0);
    unmount();
  });
});
