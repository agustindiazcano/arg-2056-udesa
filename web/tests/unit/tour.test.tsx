// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within, act } from '@testing-library/react';
import { useStore } from '../../src/state/store';

// The charts of the Recorrido draw with ECharts, which needs a canvas that jsdom does not have.
vi.mock('../../src/tour/TourStep', () => ({ TourStep: () => <h2>PBI de la Argentina</h2> }));

// The real scenes load charts; the shell is what is under test here. The labels stay the real ones.
vi.mock('../../src/scenes/registry', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/scenes/registry')>();
  const Stub = () => <h1>escena</h1>;
  const names = ['andes', 'economy', 'resources', 'forecast', 'ai-revolution', 'sandbox'] as const;
  return { ...original, SCENE_COMPONENTS: Object.fromEntries(names.map((n) => [n, Stub])) };
});

import { App } from '../../src/app/App';
import { stepWindow } from '../../src/app/TourSteps';

const initial = useStore.getState();

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  useStore.setState({ ...initial, scene: 'economy', section: 'tour', yearFloat: 2026 }, true);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Recorrido', () => {
  it('has no control bar and no play bar: no scenario, AI, province, play, year or speed controls', () => {
    render(<App />);
    expect(screen.queryByRole('region', { name: 'Controles' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Recorrido' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Escenario' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reproducir' })).toBeNull();
    expect(screen.queryByRole('slider', { name: 'Año' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Velocidad' })).toBeNull();
    expect(document.getElementById('overlay')?.getAttribute('data-section')).toBe('tour');
  });

  it('the other sections keep the full control bar', () => {
    useStore.setState({ section: 'dashboard' });
    render(<App />);
    expect(screen.getByRole('region', { name: 'Controles' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Recorrido' })).toBeNull();
  });
});

describe('Recorrido steps in the navbar', () => {
  const steps = () => within(screen.getByRole('group', { name: 'Pasos del Recorrido' }));

  it('shows Anterior, three numbers and Siguiente in the header, step 0 pressed and Anterior disabled', () => {
    render(<App />);
    const buttons = steps().getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Anterior', '0', '1', '2', 'Siguiente']);
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual([null, 'true', 'false', 'false', null]);
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelector('.app-header')?.contains(screen.getByRole('group', { name: 'Pasos del Recorrido' }))).toBe(true);
  });

  it('keeps the current step in the middle of the three numbers, held inside 0 to 15', () => {
    expect(stepWindow(0)).toEqual([0, 1, 2]);
    expect(stepWindow(1)).toEqual([0, 1, 2]);
    expect(stepWindow(2)).toEqual([1, 2, 3]);
    expect(stepWindow(3)).toEqual([2, 3, 4]);
    expect(stepWindow(8)).toEqual([7, 8, 9]);
    expect(stepWindow(14)).toEqual([13, 14, 15]);
    expect(stepWindow(15)).toEqual([13, 14, 15]);
  });

  it('Anterior and Siguiente move one step, and the last step disables Siguiente', () => {
    render(<App />);
    fireEvent.click(steps().getByRole('button', { name: 'Siguiente' }));
    fireEvent.click(steps().getByRole('button', { name: 'Siguiente' }));
    fireEvent.click(steps().getByRole('button', { name: 'Siguiente' }));
    expect(useStore.getState().tourStep).toBe(3);
    expect(steps().getAllByRole('button').map((b) => b.textContent)).toEqual(['Anterior', '2', '3', '4', 'Siguiente']);
    fireEvent.click(steps().getByRole('button', { name: 'Anterior' }));
    expect(useStore.getState().tourStep).toBe(2);
    act(() => useStore.setState({ tourStep: 15 }));
    expect((steps().getByRole('button', { name: 'Siguiente' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('a click picks a step, and the right and left arrow keys move it', () => {
    render(<App />);
    fireEvent.click(steps().getByRole('button', { name: '2' }));
    expect(useStore.getState().tourStep).toBe(2);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(useStore.getState().tourStep).toBe(3);
    expect(steps().getByRole('button', { name: '3' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(useStore.getState().tourStep).toBe(1);
    expect(useStore.getState().scene).toBe('economy');
  });

  it('is only in the Recorrido', () => {
    useStore.setState({ section: 'dashboard' });
    render(<App />);
    expect(screen.queryByRole('group', { name: 'Pasos del Recorrido' })).toBeNull();
  });
});
