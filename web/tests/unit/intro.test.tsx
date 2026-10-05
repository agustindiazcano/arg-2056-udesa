// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Intro } from '../../src/intro/Intro';
import { Root } from '../../src/app/Root';

vi.mock('../../src/app/App', () => ({ App: () => <div>app view</div> }));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
});

describe('Intro', () => {
  it('shows the title and a Comenzar button that calls onStart', () => {
    const onStart = vi.fn();
    render(<Intro onStart={onStart} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Argentina\s*2056/);
    fireEvent.click(screen.getByRole('button', { name: 'Comenzar' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('draws the 24 provinces as decoration hidden from assistive technology', () => {
    const { container } = render(<Intro onStart={() => undefined} />);
    expect(container.querySelectorAll('.intro-prov')).toHaveLength(24);
    expect(container.querySelector('.intro-stage')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('lists the four institutions as placeholders for their logos', () => {
    render(<Intro onStart={() => undefined} />);
    const list = screen.getByRole('list', { name: 'Instituciones' });
    const names = Array.from(list.querySelectorAll('li')).map((li) => li.textContent);
    expect(names).toEqual(['Universidad de San Andrés', 'Data Lab UdeSA', 'Contar con Datos', 'Secretaría de Innovación']);
  });

  it('starts when Enter is pressed anywhere', () => {
    const onStart = vi.fn();
    render(<Intro onStart={onStart} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe('Root', () => {
  it('shows the intro first and the app after Comenzar', async () => {
    render(<Root />);
    expect(screen.queryByText('app view')).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Comenzar' }));
    expect(screen.getByText('app view')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Comenzar' })).toBeNull();
  });

  it('goes straight to the app with ?intro=0', () => {
    window.history.pushState({}, '', '/?intro=0');
    render(<Root />);
    expect(screen.getByText('app view')).toBeTruthy();
  });

  it('goes straight to the app when the skip key is set in localStorage', () => {
    window.localStorage.setItem('arg2056.skipIntro', '1');
    render(<Root />);
    expect(screen.getByText('app view')).toBeTruthy();
  });
});
