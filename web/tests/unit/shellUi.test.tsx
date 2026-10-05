// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { useStore } from '../../src/state/store';

// The real scenes load charts and maps; the shell is what is under test here. The labels stay the real ones.
vi.mock('../../src/scenes/registry', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/scenes/registry')>();
  const Stub = () => <h1>escena</h1>;
  const names = ['andes', 'economy', 'resources', 'forecast', 'ai-revolution', 'sandbox'] as const;
  return { ...original, SCENE_COMPONENTS: Object.fromEntries(names.map((n) => [n, Stub])) };
});

import { App } from '../../src/app/App';
import { SCENE_LABELS } from '../../src/scenes/registry';

const initial = useStore.getState();

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  useStore.setState(initial, true);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const controls = () => screen.getByRole('region', { name: 'Controles' });

describe('header', () => {
  it('names the app and has the three sections in a navigation named Escenas', () => {
    render(<App />);
    expect(screen.getByText('Argentina 2056', { selector: '.brand' })).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: 'Escenas' });
    expect(within(nav).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Andes', 'Data Dashboard', 'Recorrido']);
    expect(SCENE_LABELS.economy).toBe('Economía');
  });

  it('the brand is a button that goes back to the intro', () => {
    const onHome = vi.fn();
    render(<App onHome={onHome} />);
    const brand = screen.getByRole('button', { name: 'Argentina 2056' });
    expect(brand.className).toContain('brand');
    fireEvent.click(brand);
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it('shows the five data scenes only in the Data Dashboard section', () => {
    render(<App />);
    const names = ['Economía', 'Recursos', 'Pronóstico 2056', 'Revolución IA', 'Simulador'];
    expect(screen.queryByRole('navigation', { name: 'Data Dashboard' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Data Dashboard' }));
    const sub = screen.getByRole('navigation', { name: 'Data Dashboard' });
    expect(within(sub).getAllByRole('tab').map((t) => t.textContent)).toEqual(names);
    expect(screen.getByRole('tab', { name: 'Data Dashboard' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Economía' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('tab', { name: 'Recorrido' }));
    expect(screen.queryByRole('navigation', { name: 'Data Dashboard' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Andes' }));
    expect(screen.queryByRole('navigation', { name: 'Data Dashboard' })).toBeNull();
  });

  it('marks the selected tab with aria-selected and a visible class', () => {
    render(<App />);
    const tab = screen.getByRole('tab', { name: 'Andes' });
    expect(tab.getAttribute('aria-selected')).toBe('true');
    expect(tab.className).toContain('tab');
    fireEvent.click(screen.getByRole('tab', { name: 'Data Dashboard' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Recursos' }));
    expect(screen.getByRole('tab', { name: 'Recursos' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Economía' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('tab', { name: 'Andes' }).getAttribute('aria-selected')).toBe('false');
  });

  it('has the skip link and the link to the sources in Spanish', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Saltar al contenido principal' }).getAttribute('href')).toBe('#main');
    expect(screen.getByRole('link', { name: 'Fuentes y métodos' }).getAttribute('href')).toBe('references.html');
  });

  it('the document title is "<escena> | Argentina 2056"', () => {
    render(<App />);
    expect(document.title).toBe('Andes | Argentina 2056');
    fireEvent.click(screen.getByRole('tab', { name: 'Data Dashboard' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Simulador' }));
    expect(document.title).toBe('Simulador | Argentina 2056');
  });
});

describe('control bar', () => {
  it('shows no debug readout: the store fields are not printed as "Scene:", "Mode:" and the like', () => {
    render(<App />);
    expect(screen.queryByText(/^Scene:/)).toBeNull();
    expect(screen.queryByText(/^Mode:/)).toBeNull();
    expect(screen.queryByText(/^AI Overlay:/)).toBeNull();
  });

  it('plays and pauses: the button says what it will do', () => {
    render(<App />);
    const play = within(controls()).getByRole('button', { name: 'Reproducir' });
    fireEvent.click(play);
    expect(useStore.getState().playing).toBe(true);
    expect(within(controls()).getByRole('button', { name: 'Pausar' })).toBeTruthy();
    fireEvent.click(within(controls()).getByRole('button', { name: 'Pausar' }));
    expect(useStore.getState().playing).toBe(false);
  });

  it('shows the progress of the crossing, not the year, in the Andes: the year stays in the page for the clock, out of sight', () => {
    useStore.setState({ scene: 'andes', yearFloat: 1950 });
    render(<App />);
    expect(within(controls()).queryByRole('slider', { name: 'Año' })).toBeNull();
    const year = screen.getByTestId('hud-year');
    expect(year.getAttribute('data-value')).toBe('1950');
    expect(year.closest('.visually-hidden')).not.toBeNull();
    expect(controls().querySelector('.progress-slot')).not.toBeNull();
  });

  it('shows the year and moves it with a slider named Año', () => {
    useStore.setState({ scene: 'economy', yearFloat: 2026.4 });
    render(<App />);
    const year = screen.getByTestId('hud-year');
    expect(year.textContent).toBe('2026');
    expect(year.getAttribute('data-value')).toBe('2026.4');
    const slider = within(controls()).getByRole('slider', { name: 'Año' }) as HTMLInputElement;
    expect(slider.min).toBe('1810');
    expect(slider.max).toBe('2056');
    expect(slider.value).toBe('2026');
    fireEvent.change(slider, { target: { value: '1990' } });
    expect(useStore.getState().yearFloat).toBe(1990);
    expect(screen.getByTestId('hud-year').textContent).toBe('1990');
  });

  it('changes the speed with two buttons and shows it', () => {
    render(<App />);
    const group = within(controls()).getByRole('group', { name: 'Velocidad' });
    expect(within(group).getByText('1×')).toBeTruthy();
    fireEvent.click(within(group).getByRole('button', { name: 'Más rápido' }));
    expect(useStore.getState().speed).toBe(2);
    expect(within(group).getByText('2×')).toBeTruthy();
    fireEvent.click(within(group).getByRole('button', { name: 'Más lento' }));
    fireEvent.click(within(group).getByRole('button', { name: 'Más lento' }));
    expect(useStore.getState().speed).toBe(0.5);
    expect(within(group).getByText('0,5×')).toBeTruthy();
  });

  it('chooses the scenario among Pesimista, Esperado and Optimista, with aria-pressed', () => {
    render(<App />);
    const group = within(controls()).getByRole('group', { name: 'Escenario' });
    const pressed = () => within(group).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')]);
    expect(pressed()).toEqual([['Pesimista', 'false'], ['Esperado', 'true'], ['Optimista', 'false']]);
    fireEvent.click(within(group).getByRole('button', { name: 'Optimista' }));
    expect(useStore.getState().scenario).toBe('optimistic');
    expect(pressed()).toEqual([['Pesimista', 'false'], ['Esperado', 'false'], ['Optimista', 'true']]);
  });

  it('turns the AI overlay on and off with a toggle named Efecto de la IA', () => {
    render(<App />);
    const toggle = () => within(controls()).getByRole('button', { name: 'Efecto de la IA' });
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle());
    expect(useStore.getState().aiOverlay).toBe('on');
    expect(toggle().getAttribute('aria-pressed')).toBe('true');
  });

  it('the province button shows the selection and opens a dialog with the 24 provinces', () => {
    render(<App />);
    const button = () => within(controls()).getByRole('button', { name: /^Provincia:/ });
    expect(button().textContent).toBe('Provincia: Todas');
    expect(button().getAttribute('aria-haspopup')).toBe('dialog');
    expect(button().getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button());
    const dialog = screen.getByRole('dialog', { name: 'Filtrar por provincia' });
    expect(button().getAttribute('aria-expanded')).toBe('true');
    expect(within(dialog).getAllByRole('button')).toHaveLength(25); // todas + 24
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salta' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button().textContent).toBe('Provincia: Salta');
  });

  it('has no 2D/3D toggle until a view uses it', () => {
    render(<App />);
    expect(screen.queryByRole('button', { name: /3D/ })).toBeNull();
    // the key still works (KEY_MAP is unchanged)
    fireEvent.keyDown(window, { key: 'd' });
    expect(useStore.getState().mode).toBe('2d');
  });
});

describe('badge', () => {
  it('says the data are illustrative, in Spanish, once the data are loaded as mock', async () => {
    const { MockBadge } = await import('../../src/app/MockBadge');
    render(<MockBadge source="MOCK" />);
    expect(screen.getByText('Datos ilustrativos')).toBeTruthy();
    cleanup();
    const { container } = render(<MockBadge source="Secretaría de Energía" />);
    expect(container.textContent).toBe('');
  });
});

describe('styles', () => {
  const dir = path.resolve(__dirname, '../../src');
  const cssFiles = (d: string): string[] =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(d, e.name);
      if (e.isDirectory()) return cssFiles(full);
      return e.name.endsWith('.css') ? [full] : [];
    });

  it('no stylesheet other than tokens.css has a color literal: every color is a token', () => {
    const offenders: string[] = [];
    for (const file of cssFiles(dir)) {
      if (path.basename(file) === 'tokens.css') continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/g)) {
        offenders.push(`${path.relative(dir, file)}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the legacy color tokens are gone: the page uses --page, --ink and --blue', () => {
    const css = fs.readFileSync(path.join(dir, 'styles', 'tokens.css'), 'utf8');
    for (const legacy of ['--color-bg', '--color-text', '--color-primary']) expect(css).not.toContain(legacy);
    expect(css).toMatch(/body\s*\{[^}]*background(?:-color)?:\s*var\(--page\)/);
  });

  it('is loaded by both entries', () => {
    expect(fs.readFileSync(path.join(dir, 'main.tsx'), 'utf8')).toContain("./styles/ui.css");
    expect(fs.readFileSync(path.join(dir, 'references', 'main.tsx'), 'utf8')).toContain('../styles/ui.css');
  });
});
