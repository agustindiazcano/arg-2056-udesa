// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { useStore } from '../../src/state/store';

// The real scenes load charts; the shell is what is under test here. The labels stay the real ones.
vi.mock('../../src/scenes/registry', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/scenes/registry')>();
  const Stub = () => <h1>escena</h1>;
  const names = ['andes', 'economy', 'resources', 'forecast', 'ai-revolution', 'sandbox'] as const;
  return { ...original, SCENE_COMPONENTS: Object.fromEntries(names.map((n) => [n, Stub])) };
});

import { App } from '../../src/app/App';

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

const bar = () => screen.getByRole('region', { name: 'Recorrido' });

describe('Recorrido', () => {
  it('replaces the control bar by a clean bar: no scenario, AI or province controls', () => {
    render(<App />);
    expect(screen.queryByRole('region', { name: 'Controles' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Escenario' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Efecto de la IA' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Provincia:/ })).toBeNull();
    expect(bar()).toBeTruthy();
    expect(document.getElementById('overlay')?.getAttribute('data-section')).toBe('tour');
  });

  it('plays and pauses with a button named Reproducir / Pausar', () => {
    render(<App />);
    fireEvent.click(within(bar()).getByRole('button', { name: 'Reproducir' }));
    expect(useStore.getState().playing).toBe(true);
    fireEvent.click(within(bar()).getByRole('button', { name: 'Pausar' }));
    expect(useStore.getState().playing).toBe(false);
  });

  it('has a long slider for the year and shows the year', () => {
    render(<App />);
    const slider = within(bar()).getByRole('slider', { name: 'Año' }) as HTMLInputElement;
    expect(slider.value).toBe('2026');
    fireEvent.change(slider, { target: { value: '1990' } });
    expect(useStore.getState().yearFloat).toBe(1990);
    expect(screen.getByTestId('hud-year').textContent).toBe('1990');
  });

  it('chooses the scene with five chips, the current one pressed', () => {
    render(<App />);
    const group = within(bar()).getByRole('group', { name: 'Escena' });
    const pressed = () => within(group).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')]);
    expect(pressed()).toEqual([
      ['Economía', 'true'],
      ['Recursos', 'false'],
      ['Pronóstico 2056', 'false'],
      ['Revolución IA', 'false'],
      ['Simulador', 'false']
    ]);
    fireEvent.click(within(group).getByRole('button', { name: 'Recursos' }));
    expect(useStore.getState()).toMatchObject({ scene: 'resources', section: 'tour' });
    expect(within(group).getByRole('button', { name: 'Recursos' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('chooses the speed among 0,5×, 1× and 2×', () => {
    render(<App />);
    const group = within(bar()).getByRole('group', { name: 'Velocidad' });
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['0,5×', '1×', '2×']);
    fireEvent.click(within(group).getByRole('button', { name: '2×' }));
    expect(useStore.getState().speed).toBe(2);
    expect(within(group).getByRole('button', { name: '2×' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(group).getByRole('button', { name: '1×' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('the other sections keep the full control bar', () => {
    useStore.setState({ section: 'dashboard' });
    render(<App />);
    expect(screen.getByRole('region', { name: 'Controles' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Recorrido' })).toBeNull();
  });
});
