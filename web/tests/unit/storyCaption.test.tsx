// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react';
import { StoryCaption } from '../../src/story/StoryCaption';
import { useStore, type AppStore } from '../../src/state/store';
import { INITIAL_STEP_INDEX } from '../../src/state/reducer';
import { STEPS } from '../../src/content/steps';
import type { StepsByScene } from '../../src/story/types';

function reset(over: Partial<AppStore> = {}) {
  useStore.setState({
    scene: 'economy',
    yearFloat: 1880,
    scenario: 'expected',
    speed: 1,
    playing: false,
    province: null,
    aiOverlay: 'off',
    stepIndex: { ...INITIAL_STEP_INDEX },
    ...over
  });
}

function region() {
  return screen.getByRole('region', { name: 'Story' });
}

beforeEach(() => reset());
afterEach(cleanup);

describe('StoryCaption', () => {
  it('is a labelled region showing the step counter, title and text', () => {
    render(<StoryCaption />);
    const r = region();
    expect(within(r).getByText('Step 1 of 3')).toBeTruthy();
    expect(within(r).getByRole('heading', { name: /Step 1 \(placeholder\)/ })).toBeTruthy();
    expect(within(r).getByText('Placeholder text. Replace before release.')).toBeTruthy();
  });

  it('shows the visible Placeholder tag for a placeholder step', () => {
    render(<StoryCaption />);
    expect(within(region()).getByText('Placeholder')).toBeTruthy();
  });

  it('does not show the Placeholder tag for a real step', () => {
    const real: StepsByScene = {
      ...STEPS,
      economy: [{ id: 'real', title: 'Real title', text: 'Real text', focus: {}, source_ids: [], placeholder: false }]
    };
    render(<StoryCaption steps={real} />);
    expect(within(region()).queryByText('Placeholder')).toBeNull();
    expect(within(region()).getByText('Step 1 of 1')).toBeTruthy();
  });

  it('Next advances the step through the store and the live region announces the new title', () => {
    render(<StoryCaption />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(useStore.getState().stepIndex.economy).toBe(1);
    expect(useStore.getState().yearFloat).toBe(1950);
    expect(within(region()).getByText('Step 2 of 3')).toBeTruthy();
    const live = region().querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live?.textContent).toBe('Step 2 (placeholder)');
  });

  it('Previous goes back and is disabled at the first step', () => {
    render(<StoryCaption />);
    const prev = screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(prev.disabled).toBe(false);
    fireEvent.click(prev);
    expect(useStore.getState().stepIndex.economy).toBe(0);
    expect(prev.disabled).toBe(true);
  });

  it('has one dot per step; clicking a dot sets the step; aria-current is on exactly one', () => {
    render(<StoryCaption />);
    const dots = screen.getAllByRole('button', { name: /^Go to step \d+: / });
    expect(dots.map((d) => d.getAttribute('aria-label'))).toEqual([
      'Go to step 1: Step 1 (placeholder)',
      'Go to step 2: Step 2 (placeholder)',
      'Go to step 3: Step 3 (placeholder)'
    ]);
    expect(dots.filter((d) => d.getAttribute('aria-current') === 'step')).toEqual([dots[0]]);

    fireEvent.click(dots[2]!);
    expect(useStore.getState().stepIndex.economy).toBe(2);
    expect(useStore.getState().yearFloat).toBe(2025);
    const after = screen.getAllByRole('button', { name: /^Go to step \d+: / });
    expect(after.filter((d) => d.getAttribute('aria-current') === 'step')).toEqual([after[2]]);
  });

  it('on the last step Next reads "Next scene" and moves to the next scene at its step 1', () => {
    reset({ stepIndex: { ...INITIAL_STEP_INDEX, economy: 2, resources: 2 }, yearFloat: 2025 });
    render(<StoryCaption />);
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next scene' }));
    expect(useStore.getState().scene).toBe('resources');
    expect(useStore.getState().stepIndex.resources).toBe(0);
    expect(within(region()).getByText('Step 1 of 3')).toBeTruthy();
  });

  it('on the last step of the last scene Next scene is disabled', () => {
    reset({ scene: 'sandbox', stepIndex: { ...INITIAL_STEP_INDEX, sandbox: 2 } });
    render(<StoryCaption />);
    expect((screen.getByRole('button', { name: 'Next scene' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('Return to step appears only after a manual change, and restores the focus', () => {
    reset({ scene: 'forecast', scenario: 'pessimistic', stepIndex: { ...INITIAL_STEP_INDEX } });
    render(<StoryCaption />);
    expect(screen.queryByRole('button', { name: 'Return to step' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // step 2: expected
    expect(useStore.getState().scenario).toBe('expected');
    expect(screen.queryByRole('button', { name: 'Return to step' })).toBeNull();

    act(() => useStore.getState().dispatch({ type: 'setScenario', scenario: 'optimistic' }));
    const back = screen.getByRole('button', { name: 'Return to step' });
    fireEvent.click(back);
    expect(useStore.getState().scenario).toBe('expected');
    expect(useStore.getState().stepIndex.forecast).toBe(1);
    expect(screen.queryByRole('button', { name: 'Return to step' })).toBeNull();
  });

  it('never shows Return to step for a step with an empty focus', () => {
    reset({ scene: 'sandbox' });
    render(<StoryCaption />);
    act(() => useStore.getState().dispatch({ type: 'setScenario', scenario: 'optimistic' }));
    expect(screen.queryByRole('button', { name: 'Return to step' })).toBeNull();
  });

  it('Hide captions collapses the panel to a Show captions button, and back', () => {
    render(<StoryCaption />);
    const hide = screen.getByRole('button', { name: 'Hide captions' });
    expect(hide.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(hide);

    expect(screen.queryByText('Placeholder text. Replace before release.')).toBeNull();
    const show = screen.getByRole('button', { name: 'Show captions' });
    expect(show.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(show);

    expect(screen.getByText('Placeholder text. Replace before release.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hide captions' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('never takes the focus by itself', () => {
    const before = document.activeElement;
    render(<StoryCaption />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    // clicking in jsdom does not move focus; the point is that the component never calls focus() on its own
    expect(document.activeElement).toBe(before);
  });

  describe('sources', () => {
    const withSources: StepsByScene = {
      ...STEPS,
      economy: [
        { id: 'a', title: 'T', text: 'x', focus: {}, source_ids: ['s:1', 's:2'], placeholder: false }
      ]
    };

    it('renders plain ids when no registry is loaded', () => {
      render(<StoryCaption steps={withSources} />);
      const r = region();
      expect(within(r).getByText('s:1')).toBeTruthy();
      expect(within(r).getByText('s:2')).toBeTruthy();
      expect(within(r).queryAllByRole('link')).toHaveLength(0);
    });

    it('links only the ids that exist in the loaded registry', () => {
      render(<StoryCaption steps={withSources} registryIds={new Set(['s:1'])} />);
      const r = region();
      const link = within(r).getByRole('link', { name: 's:1' });
      expect(link.getAttribute('href')).toBe('references.html#s:1');
      expect(within(r).queryByRole('link', { name: 's:2' })).toBeNull();
      expect(within(r).getByText('s:2')).toBeTruthy();
    });

    it('shows no sources block for a step without source ids', () => {
      render(<StoryCaption />);
      expect(within(region()).queryByText(/Sources/)).toBeNull();
    });
  });
});
