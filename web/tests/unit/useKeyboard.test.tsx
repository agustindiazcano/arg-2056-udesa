// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useKeyboard } from '../../src/state/useKeyboard';
import { useStore } from '../../src/state/store';


describe('useKeyboard', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.setState({ playing: false, speed: 1, scene: 'andes' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('dispatches action and calls preventDefault for resolved keys', () => {
    const dispatchSpy = vi.spyOn(useStore.getState(), 'dispatch');
    const { unmount } = renderHook(() => useKeyboard());
    
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    
    window.dispatchEvent(event);
    
    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'nextScene' });
    expect(preventDefaultSpy).toHaveBeenCalled();
    unmount();
  });

  it('ignores events on input elements', () => {
    const dispatchSpy = vi.spyOn(useStore.getState(), 'dispatch');
    const { unmount } = renderHook(() => useKeyboard());
    
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    input.dispatchEvent(event);
    
    expect(dispatchSpy).not.toHaveBeenCalled();
    input.remove();
    unmount();
  });

  it('ignores events with ctrlKey/metaKey/altKey or repeat', () => {
    const dispatchSpy = vi.spyOn(useStore.getState(), 'dispatch');
    const { unmount } = renderHook(() => useKeyboard());
    
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', metaKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true }));
    
    expect(dispatchSpy).not.toHaveBeenCalled();
    unmount();
  });

  it('ignores Space and Enter on button/a elements', () => {
    const dispatchSpy = vi.spyOn(useStore.getState(), 'dispatch');
    const { unmount } = renderHook(() => useKeyboard());
    
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    
    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    
    expect(dispatchSpy).not.toHaveBeenCalled();
    button.remove();
    unmount();
  });

  it('removes listener on unmount', () => {
    const dispatchSpy = vi.spyOn(useStore.getState(), 'dispatch');
    const { unmount } = renderHook(() => useKeyboard());
    
    unmount();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
