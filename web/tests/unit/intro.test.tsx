// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Intro } from '../../src/intro/Intro';
import { Root } from '../../src/app/Root';
import { useStore } from '../../src/state/store';

vi.mock('../../src/app/App', () => ({
  App: ({ onHome }: { onHome?: () => void }) => (
    <div>
      app view
      <button type="button" onClick={onHome}>
        volver
      </button>
    </div>
  )
}));

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

  it('has three buttons under Comenzar: crossing of the Andes, tour to 2056 and data dashboard, each starting in its section', () => {
    const onStart = vi.fn();
    render(<Intro onStart={onStart} />);
    const group = screen.getByRole('group', { name: 'Ir directo a' });
    expect(Array.from(group.querySelectorAll('button')).map((b) => b.textContent)).toEqual([
      'Cruce de los Andes',
      'Recorrido al 2056',
      'Data Dashboard'
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Cruce de los Andes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Recorrido al 2056' }));
    fireEvent.click(screen.getByRole('button', { name: 'Data Dashboard' }));
    expect(onStart.mock.calls).toEqual([['andes'], ['tour'], ['dashboard']]);
  });

  it('draws the 24 provinces as decoration hidden from assistive technology', () => {
    const { container } = render(<Intro onStart={() => undefined} />);
    expect(container.querySelectorAll('.intro-prov')).toHaveLength(24);
    expect(container.querySelector('.intro-stage')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('stacks 3 layers per province (2 sides and the top) and a glow of 3 strokes', () => {
    const { container } = render(<Intro onStart={() => undefined} />);
    const prov = container.querySelector('.intro-prov')!;
    expect(prov.querySelectorAll('.intro-layer.side')).toHaveLength(2);
    expect(prov.querySelectorAll('.intro-layer.top')).toHaveLength(1);
    expect(prov.querySelectorAll('.intro-layer.glow use')).toHaveLength(3);
  });

  it('lists the four institutions with their logos, each linking to its site in a new tab', () => {
    render(<Intro onStart={() => undefined} />);
    const list = screen.getByRole('list', { name: 'Instituciones' });
    const logos = Array.from(list.querySelectorAll('li')).map((li) => {
      const a = li.querySelector('a')!;
      const img = a.querySelector('img')!;
      return [img.getAttribute('alt'), img.getAttribute('src'), a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')];
    });
    expect(logos).toEqual([
      ['Universidad de San Andrés', '/images/udesa-logo-recortado.png', 'https://www.udesa.edu.ar', '_blank', 'noopener noreferrer'],
      ['Data Science Lab, Universidad de San Andrés', '/images/data-lab-recortado.webp', 'https://www.udesa.edu.ar/data-science-lab', '_blank', 'noopener noreferrer'],
      ['Contar con Datos', '/images/contar-con-datos-logo-udesa.webp', 'https://www.udesa.edu.ar/contar-con-datos', '_blank', 'noopener noreferrer'],
      [
        'Secretaría de Innovación, Ciencia y Tecnología',
        '/images/secretaria-innovacion-ciencia-tecnologia-recortado.png',
        'https://www.argentina.gob.ar/jefatura/innovacion-ciencia-y-tecnologia',
        '_blank',
        'noopener noreferrer'
      ]
    ]);
  });

  it('Enter on a focused button leaves the choice to that button: it does not also open the Andes', () => {
    const onStart = vi.fn();
    render(<Intro onStart={onStart} />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Recorrido al 2056' }), { key: 'Enter' });
    expect(onStart).not.toHaveBeenCalled();
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
    expect(screen.queryByText(/app view/)).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Comenzar' }));
    expect(screen.getByText(/app view/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Comenzar' })).toBeNull();
  });

  it('opens the app in the section of the button that was chosen', async () => {
    useStore.setState({ section: 'andes', scene: 'andes' });
    render(<Root />);
    fireEvent.click(await screen.findByRole('button', { name: 'Recorrido al 2056' }));
    expect(screen.getByText(/app view/)).toBeTruthy();
    expect(useStore.getState()).toMatchObject({ section: 'tour', scene: 'economy' });
  });

  it('Comenzar opens the app in the Andes', async () => {
    useStore.setState({ section: 'dashboard', scene: 'economy' });
    render(<Root />);
    fireEvent.click(await screen.findByRole('button', { name: 'Comenzar' }));
    expect(useStore.getState()).toMatchObject({ section: 'andes', scene: 'andes' });
  });

  it('goes back to the intro from the app, and the crossing starts again at 0 % with Comenzar', async () => {
    useStore.setState({ scene: 'andes', section: 'andes', yearFloat: 1900, playing: true });
    render(<Root />);
    fireEvent.click(await screen.findByRole('button', { name: 'Comenzar' }));
    fireEvent.click(screen.getByRole('button', { name: 'volver' }));
    expect(useStore.getState().playing).toBe(false);
    expect(screen.queryByText(/app view/)).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Comenzar' }));
    expect(screen.getByText(/app view/)).toBeTruthy();
    expect(useStore.getState()).toMatchObject({ scene: 'andes', yearFloat: 1810, playing: false });
  });

  it('goes straight to the app with ?intro=0', () => {
    window.history.pushState({}, '', '/?intro=0');
    render(<Root />);
    expect(screen.getByText(/app view/)).toBeTruthy();
  });

  it('goes straight to the app when the skip key is set in localStorage', () => {
    window.localStorage.setItem('arg2056.skipIntro', '1');
    render(<Root />);
    expect(screen.getByText(/app view/)).toBeTruthy();
  });
});
