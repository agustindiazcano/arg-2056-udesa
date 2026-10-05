// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act, fireEvent, within } from '@testing-library/react';
import { useStore } from '../../src/state/store';

// The real scenes load charts and maps; the shell wiring is what is under test here. The labels stay the real ones.
vi.mock('../../src/scenes/registry', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/scenes/registry')>();
  const Stub = () => <h1>scene stub</h1>;
  const names = ['andes', 'economy', 'resources', 'forecast', 'ai-revolution', 'sandbox'] as const;
  return { ...original, SCENE_COMPONENTS: Object.fromEntries(names.map((n) => [n, Stub])) };
});

import { App } from '../../src/app/App';
import { APP_TITLE, documentTitle } from '../../src/app/title';

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

const setScene = (scene: 'andes' | 'economy' | 'forecast') => act(() => useStore.getState().dispatch({ type: 'setScene', scene }));

describe('skip link and landmarks', () => {
  it('"Skip to main content" is the first focusable element and points at the main landmark', () => {
    render(<App />);
    const first = document.body.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    expect(first?.textContent).toBe('Saltar al contenido principal');
    expect(first?.getAttribute('href')).toBe('#main');
    expect(first?.className).toBe('skip-link');
  });

  it('has exactly one main landmark, with the id the skip link targets, and the scene is inside it', () => {
    render(<App />);
    const mains = screen.getAllByRole('main');
    expect(mains).toHaveLength(1);
    expect(mains[0]!.id).toBe('main');
    expect(within(mains[0]!).getByText('scene stub')).toBeTruthy();
  });

  it('can receive the focus the skip link gives it', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main.getAttribute('tabindex')).toBe('-1');
    main.focus();
    expect(document.activeElement).toBe(main);
  });

  it('puts the tab bar in a navigation landmark named "Escenas"', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Escenas' });
    expect(within(nav).getByRole('tablist')).toBeTruthy();
    expect(within(nav).getAllByRole('tab')).toHaveLength(3);
  });
});

describe('document title', () => {
  it('uses "<scene label> | <APP_TITLE>" and follows the scene', () => {
    render(<App />);
    expect(APP_TITLE).toBe('Argentina 2056');
    expect(document.title).toBe('Andes | Argentina 2056');
    setScene('economy');
    expect(document.title).toBe('Economía | Argentina 2056');
    setScene('forecast');
    expect(document.title).toBe('Pronóstico 2056 | Argentina 2056');
  });

  it('documentTitle formats the label and the app title', () => {
    expect(documentTitle('sandbox')).toBe('Simulador | Argentina 2056');
  });

  it('the html entries declare lang="es" and index.html carries the same app title', () => {
    const root = path.resolve(__dirname, '../..');
    for (const file of ['index.html', 'references.html']) {
      expect(fs.readFileSync(path.join(root, file), 'utf8'), file).toMatch(/<html lang="es">/);
    }
    expect(fs.readFileSync(path.join(root, 'index.html'), 'utf8')).toContain(`<title>${APP_TITLE}</title>`);
  });
});

describe('toggle buttons expose aria-pressed', () => {
  it('"Efecto de la IA" starts aria-pressed false, becomes true after activation and returns after a second one', () => {
    render(<App />);
    const name = 'Efecto de la IA';
    expect(screen.getByRole('button', { name }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name }));
    expect(screen.getByRole('button', { name }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name }));
    expect(screen.getByRole('button', { name }).getAttribute('aria-pressed')).toBe('false');
  });

  it('play and pause is one button whose name says what it will do, so it needs no aria-pressed', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Reproducir' }).hasAttribute('aria-pressed')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir' }));
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeTruthy();
  });
});

describe('province filter focus', () => {
  const opener = () => screen.getByRole('button', { name: /^Provincia:/ });

  it('is a dialog with an accessible name, and the focus moves into it when it opens', () => {
    render(<App />);
    opener().focus();
    fireEvent.click(opener());
    const dialog = screen.getByRole('dialog', { name: 'Filtrar por provincia' });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('Escape closes it and returns the focus to the control that opened it', () => {
    render(<App />);
    opener().focus();
    fireEvent.click(opener());
    const inside = document.activeElement as HTMLElement;
    fireEvent.keyDown(inside, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener());
  });

  it('choosing a province closes it and returns the focus to the control that opened it', () => {
    render(<App />);
    opener().focus();
    fireEvent.click(opener());
    fireEvent.click(screen.getByRole('button', { name: 'Todas las provincias' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener());
  });

  it('traps no focus: Tab is not intercepted by the dialog', () => {
    render(<App />);
    opener().focus();
    fireEvent.click(opener());
    const dialog = screen.getByRole('dialog');
    const notPrevented = fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(notPrevented).toBe(true);
  });

  it('opened with the p key and closed with Escape, the focus is not left on a removed element', () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true, cancelable: true }));
    });
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.contains(document.activeElement)).toBe(true);
  });
});

describe('global stylesheet', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/tokens.css'), 'utf8');

  it('draws a 2px focus outline with the focus token on every kind of interactive element', () => {
    const rule = css.match(/([^{}]*:focus-visible[^{}]*)\{([^}]*)\}/);
    expect(rule, 'a :focus-visible rule').not.toBeNull();
    const selector = rule![1]!;
    for (const part of ['a:focus-visible', 'button:focus-visible', 'input:focus-visible', 'select:focus-visible', 'textarea:focus-visible']) {
      expect(selector, part).toContain(part);
    }
    expect(rule![2]).toMatch(/outline:\s*2px solid var\(--color-focus\)/);
  });

  it('shows the skip link only while it has the focus', () => {
    expect(css).toMatch(/\.skip-link\s*\{[^}]*position:\s*absolute/);
    expect(css).toMatch(/\.skip-link:focus\s*\{[^}]*top:\s*var\(--space-sm\)/);
  });
});
