// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { StepRunner } from '../../src/story/StepRunner';
import { useStore, type AppStore } from '../../src/state/store';
import { INITIAL_STEP_INDEX } from '../../src/state/reducer';

// forecast step 3 (index 2) plays 2026 -> 2056; economy step 1 only has a year
function playing(over: Partial<AppStore> = {}) {
  useStore.setState({
    scene: 'forecast',
    stepIndex: { ...INITIAL_STEP_INDEX, forecast: 2 },
    yearFloat: 2026,
    playing: true,
    speed: 1,
    ...over
  });
}

beforeEach(() => playing());
afterEach(cleanup);

describe('StepRunner', () => {
  it('renders nothing', () => {
    const { container } = render(<StepRunner />);
    expect(container.innerHTML).toBe('');
  });

  it('pauses at exactly toYear when the year passes it while playing', () => {
    render(<StepRunner />);
    act(() => useStore.setState({ yearFloat: 2055 }));
    expect(useStore.getState().playing).toBe(true);
    expect(useStore.getState().yearFloat).toBe(2055);

    act(() => useStore.setState({ yearFloat: 2056.4 }));
    expect(useStore.getState().yearFloat).toBe(2056);
    expect(useStore.getState().playing).toBe(false);
  });

  it('pauses when the year reaches toYear exactly', () => {
    playing({ stepIndex: { ...INITIAL_STEP_INDEX, forecast: 2 } });
    render(<StepRunner />);
    act(() => useStore.setState({ yearFloat: 2056 }));
    expect(useStore.getState().yearFloat).toBe(2056);
    expect(useStore.getState().playing).toBe(false);
  });

  it('works for a range that ends before the end of the timeline', () => {
    useStore.setState({ yearFloat: 2026 });
    render(<StepRunner />);
    // a play step that ends at 2056 is the only one in the placeholders, so check the guard instead:
    act(() => useStore.setState({ yearFloat: 2040 }));
    expect(useStore.getState().playing).toBe(true);
    expect(useStore.getState().yearFloat).toBe(2040);
  });

  it('does nothing when the user paused before the end year', () => {
    render(<StepRunner />);
    act(() => useStore.setState({ playing: false }));
    act(() => useStore.setState({ yearFloat: 2060 }));
    expect(useStore.getState().yearFloat).toBe(2060);
    expect(useStore.getState().playing).toBe(false);
  });

  it('does not resume playback by itself', () => {
    render(<StepRunner />);
    act(() => useStore.setState({ playing: false, yearFloat: 2030 }));
    act(() => useStore.setState({ yearFloat: 2056 }));
    expect(useStore.getState().playing).toBe(false);
  });

  it('does nothing for a step without a play range', () => {
    useStore.setState({ scene: 'economy', stepIndex: { ...INITIAL_STEP_INDEX, economy: 0 }, yearFloat: 1880, playing: true });
    render(<StepRunner />);
    act(() => useStore.setState({ yearFloat: 2060 }));
    expect(useStore.getState().yearFloat).toBe(2060);
    expect(useStore.getState().playing).toBe(true);
  });

  it('follows the current step: it stops watching when the viewer leaves the play step', () => {
    render(<StepRunner />);
    act(() => useStore.getState().dispatch({ type: 'stepPrev' })); // forecast step 2, no play range
    act(() => useStore.setState({ yearFloat: 2060, playing: true }));
    expect(useStore.getState().yearFloat).toBe(2060);
    expect(useStore.getState().playing).toBe(true);
  });

  it('starts watching when the viewer enters the play step while the year is still before the end', () => {
    useStore.setState({ stepIndex: { ...INITIAL_STEP_INDEX, forecast: 1 }, playing: false, yearFloat: 2000 });
    render(<StepRunner />);
    act(() => useStore.getState().dispatch({ type: 'stepNext' })); // enters the play step: 2026, playing
    expect(useStore.getState().yearFloat).toBe(2026);
    expect(useStore.getState().playing).toBe(true);
    act(() => useStore.setState({ yearFloat: 2057 }));
    expect(useStore.getState().yearFloat).toBe(2056);
    expect(useStore.getState().playing).toBe(false);
  });

  it('removes its subscription on unmount', () => {
    const { unmount } = render(<StepRunner />);
    unmount();
    act(() => useStore.setState({ yearFloat: 2060 }));
    expect(useStore.getState().yearFloat).toBe(2060);
    expect(useStore.getState().playing).toBe(true);
  });
});
