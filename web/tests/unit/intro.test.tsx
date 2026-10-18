import { readFileSync } from 'node:fs';
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SHOW_DASHBOARD_KEY } from '../../src/content/sectionLabels';
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
  it('shows the title and no Comenzar button; the crossing of the Andes button calls onStart', () => {
    const onStart = vi.fn();
    render(<Intro onStart={onStart} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Argentina\s*2056/);
    expect(screen.queryByRole('button', { name: 'Comenzar' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cruce de los Andes' }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith('andes');
  });

  it('tells what the project is in two paragraphs, with the final text of the intro', () => {
    render(<Intro onStart={() => {}} />);
    const paragraphs = Array.from(document.querySelectorAll('.intro-sub')).map((p) => p.textContent);
    expect(paragraphs).toEqual([
      'Del Cruce de los Andes a la Cuarta Revolución Industrial: el desafío estratégico de 1817 como faro para el presente. Un análisis de los recursos de Argentina en 2026 y una proyección de su desarrollo hacia 2056 frente al impacto de la Inteligencia Artificial en la economía.',
      'Es una ventana al inicio de la lucha por nuestra libertad política y, a la vez, una hoja de ruta desde la actualidad hacia el desarrollo económico de las próximas tres décadas, explorada a través de datos, escenarios interactivos y modelos de incertidumbre.'
    ]);
  });

  it('puts the text on a translucent black panel, so it reads over the map', () => {
    render(<Intro onStart={() => {}} />);
    const panel = document.querySelector('.intro-text')!;
    expect(panel).not.toBeNull();
    expect(panel.querySelectorAll('.intro-sub')).toHaveLength(2);
    expect(readFileSync('src/intro/intro.css', 'utf8')).toMatch(/\.intro-text\s*\{[^}]*background:\s*color-mix\(in srgb,\s*var\(--intro-black\)\s*\d+%,\s*transparent\)/);
  });

  it('gives the buttons of the sections the look the Comenzar button had', () => {
    render(<Intro onStart={() => {}} />);
    const group = screen.getByRole('group', { name: 'Ir directo a' });
    for (const b of Array.from(group.querySelectorAll('button'))) {
      expect(b.classList.contains('intro-start'), b.textContent ?? '').toBe(true);
      expect(b.classList.contains('intro-shortcut')).toBe(false);
    }
  });

  it('has two buttons, the Data Dashboard being deprecated: crossing of the Andes and tour to 2056', () => {
    const onStart = vi.fn();
    render(<Intro onStart={onStart} />);
    const group = screen.getByRole('group', { name: 'Ir directo a' });
    expect(Array.from(group.querySelectorAll('button')).map((b) => b.textContent)).toEqual(['Cruce de los Andes', 'Hacia el 2056']);
    expect(screen.queryByRole('button', { name: 'Data Dashboard' })).toBeNull();
  });

  it('has three buttons when the dashboard is switched on: crossing of the Andes, tour to 2056 and data dashboard, each starting in its section', () => {
    window.localStorage.setItem(SHOW_DASHBOARD_KEY, '1');
    const onStart = vi.fn();
    render(<Intro onStart={onStart} />);
    const group = screen.getByRole('group', { name: 'Ir directo a' });
    expect(Array.from(group.querySelectorAll('button')).map((b) => b.textContent)).toEqual([
      'Cruce de los Andes',
      'Hacia el 2056',
      'Data Dashboard'
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Cruce de los Andes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hacia el 2056' }));
    fireEvent.click(screen.getByRole('button', { name: 'Data Dashboard' }));
    expect(onStart.mock.calls).toEqual([['andes'], ['tour'], ['dashboard']]);
  });

  it('draws the 24 provinces and the Malvinas as decoration hidden from assistive technology', () => {
    const { container } = render(<Intro onStart={() => undefined} />);
    expect(container.querySelectorAll('.intro-prov')).toHaveLength(25);
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
        '/images/logo-subsecretaria-sscyt-blanco.png',
        'https://www.argentina.gob.ar/jefatura/innovacion-ciencia-y-tecnologia',
        '_blank',
        'noopener noreferrer'
      ]
    ]);
  });

  it('Enter on a focused button leaves the choice to that button: it does not also open the Andes', () => {
    const onStart = vi.fn();
    render(<Intro onStart={onStart} />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Hacia el 2056' }), { key: 'Enter' });
    expect(onStart).not.toHaveBeenCalled();
  });

  it('starts when Enter is pressed anywhere', () => {
    const onStart = vi.fn();
    render(<Intro onStart={onStart} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('hovering over the Cruce de los Andes button illuminates only San Juan and Mendoza', () => {
    const { container } = render(<Intro onStart={() => undefined} />);
    const andesBtn = screen.getByRole('button', { name: 'Cruce de los Andes' });
    fireEvent.mouseEnter(andesBtn);

    const sanJuan = container.querySelector('[data-province-name="San Juan"]');
    const mendoza = container.querySelector('[data-province-name="Mendoza"]');
    expect(sanJuan?.classList.contains('lit')).toBe(true);
    expect(mendoza?.classList.contains('lit')).toBe(true);

    const salta = container.querySelector('[data-province-name="Salta"]');
    const buenosAires = container.querySelector('[data-province-name="Buenos Aires"]');
    expect(salta?.classList.contains('lit')).toBe(false);
    expect(buenosAires?.classList.contains('lit')).toBe(false);

    fireEvent.mouseLeave(andesBtn);
  });

  it('hovering over the Hacia el 2056 button illuminates all provinces and Malvinas painted in gold', () => {
    const { container } = render(<Intro onStart={() => undefined} />);
    const tourBtn = screen.getByRole('button', { name: 'Hacia el 2056' });
    fireEvent.mouseEnter(tourBtn);

    const allProvs = container.querySelectorAll('.intro-prov');
    expect(allProvs).toHaveLength(25);
    for (const p of Array.from(allProvs)) {
      expect(p.classList.contains('lit')).toBe(true);
      expect(p.classList.contains('gold')).toBe(true);
    }
    const malvinas = container.querySelector('[data-province-name="Islas Malvinas"]');
    expect(malvinas?.classList.contains('gold')).toBe(true);

    fireEvent.mouseLeave(tourBtn);
    expect(container.querySelector('.intro-prov.gold')).toBeNull();
  });

  it('hovering over a province in the 3D map displays a tooltip with its name', () => {
    const { container } = render(<Intro onStart={() => undefined} />);
    const mendoza = container.querySelector('[data-province-name="Mendoza"]')!;
    expect(mendoza).not.toBeNull();

    fireEvent.mouseEnter(mendoza);
    expect(screen.getByText('Mendoza')).toBeTruthy();

    fireEvent.mouseLeave(mendoza);
    expect(screen.queryByText('Mendoza')).toBeNull();
  });
});

describe('Root', () => {
  it('shows the intro first and the app after a button', async () => {
    render(<Root />);
    expect(screen.queryByText(/app view/)).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Cruce de los Andes' }));
    expect(screen.getByText(/app view/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cruce de los Andes' })).toBeNull();
  });

  it('opens the app in the section of the button that was chosen', async () => {
    useStore.setState({ section: 'andes', scene: 'andes' });
    render(<Root />);
    fireEvent.click(await screen.findByRole('button', { name: 'Hacia el 2056' }));
    expect(screen.getByText(/app view/)).toBeTruthy();
    expect(useStore.getState()).toMatchObject({ section: 'tour', scene: 'economy' });
  });

  it('the crossing of the Andes button opens the app in the Andes', async () => {
    useStore.setState({ section: 'dashboard', scene: 'economy' });
    render(<Root />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cruce de los Andes' }));
    expect(useStore.getState()).toMatchObject({ section: 'andes', scene: 'andes' });
  });

  it('goes back to the intro from the app, and the crossing starts again at 0 % with the Andes button', async () => {
    useStore.setState({ scene: 'andes', section: 'andes', yearFloat: 1900, playing: true });
    render(<Root />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cruce de los Andes' }));
    fireEvent.click(screen.getByRole('button', { name: 'volver' }));
    expect(useStore.getState().playing).toBe(false);
    expect(screen.queryByText(/app view/)).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Cruce de los Andes' }));
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

  it('while the flat map loads, the provinces light up one by one and every one is lit when the map tilts', () => {
    vi.useFakeTimers();
    try {
      render(<Intro onStart={() => {}} />);
      const all = () => Array.from(document.querySelectorAll('.intro-prov'));
      expect(all().filter((p) => p.classList.contains('lit'))).toHaveLength(0);
      act(() => {
        vi.advanceTimersByTime(800);
      });
      const half = all().filter((p) => p.classList.contains('lit')).length;
      expect(half).toBeGreaterThan(0);
      expect(half).toBeLessThan(all().length);
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(document.querySelector('.intro')!.getAttribute('data-tilted')).toBe('true');
      expect(all().filter((p) => p.classList.contains('lit'))).toHaveLength(all().length);
    } finally {
      vi.useRealTimers();
    }
  });
});
