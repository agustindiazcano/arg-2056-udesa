// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Dashboard } from '../../src/dashboard/Dashboard';
import { useDashPrefs } from '../../src/dashboard/prefs';
import { useSlots } from '../../src/dashboard/slots';
import { StoryCaption } from '../../src/story/StoryCaption';
import { useStore } from '../../src/state/store';
import { INITIAL_STEP_INDEX } from '../../src/state/reducer';
import type { DashView } from '../../src/dashboard/types';

beforeEach(() => {
  useDashPrefs.setState({ layout: 1, explore: false });
  useStore.setState({ scene: 'economy', stepIndex: { ...INITIAL_STEP_INDEX } });
});
afterEach(() => {
  cleanup();
  useSlots.setState({ filters: null, narrative: null });
});

const view = (id: string, name: string): DashView => ({
  id,
  name,
  thumb: { kind: 'bars' },
  content: <p>{`contenido ${id}`}</p>
});
const VIEWS = [view('a', 'Uno'), view('b', 'Dos'), view('c', 'Tres'), view('d', 'Cuatro')];

const renderDash = () => render(<Dashboard title="T" sources={[]} views={VIEWS} />);
const viewer = () => screen.getByRole('region', { name: 'Visor' });
const shown = () => within(viewer()).queryAllByText(/^contenido /).map((p) => p.textContent);
const layout = (n: number) => fireEvent.click(within(screen.getByRole('group', { name: 'Paneles a la vez' })).getByRole('button', { name: String(n) }));
const pick = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

describe('Dashboard: one, two or four views at once', () => {
  it('offers 1, 2 and 4 views, with 1 chosen', () => {
    renderDash();
    const group = screen.getByRole('group', { name: 'Paneles a la vez' });
    expect(within(group).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['1', 'true'],
      ['2', 'false'],
      ['4', 'false']
    ]);
  });

  it('with one view, choosing another replaces it', () => {
    renderDash();
    pick('Dos');
    expect(shown()).toEqual(['contenido b']);
  });

  it('with two, choosing adds a view, and choosing a shown one removes it unless it is the only one', () => {
    renderDash();
    layout(2);
    pick('Dos');
    expect(shown()).toEqual(['contenido a', 'contenido b']);
    pick('Uno');
    expect(shown()).toEqual(['contenido b']);
    pick('Dos'); // the only one stays
    expect(shown()).toEqual(['contenido b']);
  });

  it('when the layout is full, the oldest view leaves', () => {
    renderDash();
    layout(2);
    pick('Dos');
    pick('Tres');
    expect(shown()).toEqual(['contenido b', 'contenido c']);
  });

  it('shows four at once and splits the viewer in four', () => {
    renderDash();
    layout(4);
    pick('Dos');
    pick('Tres');
    pick('Cuatro');
    expect(shown()).toHaveLength(4);
    expect(viewer().className).toContain('viewer--4');
  });

  it('going back to one view keeps the last chosen', () => {
    renderDash();
    layout(4);
    pick('Dos');
    pick('Tres');
    layout(1);
    expect(shown()).toEqual(['contenido c']);
    expect(viewer().className).toContain('viewer--1');
  });

  it('marks every shown view as pressed in the carousel', () => {
    renderDash();
    layout(2);
    pick('Dos');
    expect(screen.getByRole('button', { name: 'Uno' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Dos' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Tres' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps the layout when the scene changes (it is a preference)', () => {
    const { unmount } = renderDash();
    layout(2);
    unmount();
    renderDash();
    expect(screen.getByRole('button', { name: '2' }).getAttribute('aria-pressed')).toBe('true');
  });
});

describe('Dashboard: 2D and 3D', () => {
  beforeEach(() => useStore.setState({ mode: '3d' }));

  it('has the same dashboard in two views: flat (2D) or in space (3D), with 3D chosen', () => {
    renderDash();
    const group = screen.getByRole('group', { name: 'Vista' });
    expect(within(group).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['2D', 'false'],
      ['3D', 'true']
    ]);
  });

  it('switches the mode of the whole app, like the D key', () => {
    renderDash();
    fireEvent.click(screen.getByRole('button', { name: '2D' }));
    expect(useStore.getState().mode).toBe('2d');
    expect(screen.getByRole('button', { name: '2D' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    expect(useStore.getState().mode).toBe('3d');
  });

  it('follows the D key', () => {
    renderDash();
    act(() => useStore.getState().dispatch({ type: 'toggle3D' }));
    expect(screen.getByRole('button', { name: '2D' }).getAttribute('aria-pressed')).toBe('true');
  });
});

describe('Dashboard: Recorrido and Explorar', () => {
  it('starts in Recorrido', () => {
    renderDash();
    const group = screen.getByRole('group', { name: 'Modo' });
    expect(within(group).getByRole('button', { name: 'Recorrido' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(group).getByRole('button', { name: 'Explorar' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('Explorar hides the story and Recorrido brings it back', () => {
    render(
      <>
        <Dashboard title="T" sources={[]} views={VIEWS} />
        <StoryCaption />
      </>
    );
    expect(screen.getByRole('region', { name: 'Historia' })).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Explorar' }));
    });
    expect(screen.queryByRole('region', { name: 'Historia' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Explorar' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Recorrido' }));
    expect(screen.getByRole('region', { name: 'Historia' })).toBeTruthy();
  });
});
