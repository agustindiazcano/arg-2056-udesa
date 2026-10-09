// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './reducedMotionStub';

const { mounts, unmounts } = vi.hoisted(() => ({ mounts: { n: 0 }, unmounts: { n: 0 } }));

// the renderer is the only file that touches WebGL: replaced by a stub that shows what it was given
vi.mock('../../src/scenes/andes/MapLibreRenderer', async () => {
  const React = await import('react');
  return {
    default: ({
      day,
      selectedId,
      camera,
      graphics,
      label
    }: {
      day: number;
      selectedId: string | null;
      camera: string;
      graphics: { tier: string; snow: boolean; trees: boolean; textures: boolean; shadows: boolean };
      label: string;
    }) => {
      React.useEffect(() => {
        mounts.n += 1;
        return () => {
          unmounts.n += 1;
        };
      }, []);
      return (
        <div
          data-testid="andes-renderer"
          data-day={Math.round(day)}
          data-selected={selectedId ?? ''}
          data-camera={camera}
          data-tier={graphics.tier}
          data-snow={String(graphics.snow)}
          data-trees={String(graphics.trees)}
          data-textures={String(graphics.textures)}
          data-shadows={String(graphics.shadows)}
        >
          {label}
        </div>
      );
    }
  };
});

import Scene from '../../src/scenes/andes/index';
import { CapabilityProvider } from '../../src/runtime/CapabilityProvider';
import type { CapabilityEnv } from '../../src/runtime/capabilities';
import { useStore } from '../../src/state/store';
import { resetDataVersion } from '../../src/data/version';

const events = JSON.parse(readFileSync(resolve(process.cwd(), '../data/mock/andes_events.json'), 'utf8')) as unknown;

const env = (webgl2: boolean): CapabilityEnv => ({
  createCanvas: () => ({ getContext: () => (webgl2 ? {} : null) }),
  navigator: { hardwareConcurrency: 8, deviceMemory: 8 }
});

const respond = (ok: boolean, status: number, body: unknown) => ({
  ok,
  status,
  json: async () => body,
  blob: async () => new Blob([])
});

function stubFetch(eventsBody: unknown = events) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.startsWith('/data/_version.json')) return respond(false, 404, {});
      if (url.startsWith('/data/andes_events.json')) return respond(true, 200, eventsBody);
      if (url.startsWith('/terrain/')) return respond(false, 404, {});
      throw new Error(`unexpected url ${url}`);
    })
  );
}

const renderScene = (webgl2 = true) =>
  render(
    <CapabilityProvider env={env(webgl2)} search="">
      <Scene />
    </CapabilityProvider>
  );

beforeEach(() => {
  window.localStorage.clear();
  mounts.n = 0;
  unmounts.n = 0;
  resetDataVersion();
  useStore.setState({ yearFloat: 1810, playing: false, speed: 1 });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Andes scene', () => {
  it('lists the events of the campaign and shows the real map with its credits', async () => {
    stubFetch();
    renderScene();
    const list = await screen.findByRole('list', { name: 'Eventos de la campaña' });
    expect(within(list).getAllByRole('button')).toHaveLength(11);
    const renderer = await screen.findByTestId('andes-renderer');
    expect(renderer).toBeTruthy();
    expect(screen.getByRole('note').textContent).toMatch(/MapTiler/);
  });

  it('moves the army with the shared clock: the day follows the year', async () => {
    stubFetch();
    renderScene();
    const renderer = await screen.findByTestId('andes-renderer');
    expect(renderer.getAttribute('data-day')).toBe('0');
    act(() => useStore.setState({ yearFloat: 2056 }));
    expect(screen.getByTestId('andes-renderer').getAttribute('data-day')).toBe('27');
    expect(within(screen.getByTestId('andes-day')).getByText('27')).toBeTruthy();
  });

  it('shows the panel of the chosen event with its forces, and an unknown count says so instead of 0', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    fireEvent.click(screen.getByRole('button', { name: /Manantiales/ }));
    const panel = screen.getByRole('region', { name: /Evento: Manantiales/ });
    expect(within(panel).getByText(/Ejército de los Andes: 3\.987/)).toBeTruthy();
    expect(screen.getByTestId('andes-renderer').getAttribute('data-selected')).toBe('andes-05');
  });

  it('says the altitude is unknown when the event has none', async () => {
    stubFetch((events as Array<Record<string, unknown>>).map((e) => (e.id === 'andes-03' ? { ...e, elevation_m: null, note: 'sin dato de altitud' } : e)));
    renderScene();
    await screen.findByTestId('andes-renderer');
    fireEvent.click(screen.getByRole('button', { name: /Valle de Calingasta/ }));
    const panel = screen.getByRole('region', { name: /Evento: Valle de Calingasta/ });
    expect(within(panel).getByText('sin dato')).toBeTruthy();
  });

  it('closes the panel with Escape and gives the focus back to the button that opened it', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    const opener = screen.getByRole('button', { name: /Río de los Patos/ });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('region', { name: /Evento: Río de los Patos/ })).toBeTruthy();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('region', { name: /Evento: Río de los Patos/ })).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('does not take the Escape key when no panel is open', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    const seen = vi.fn();
    document.addEventListener('keydown', seen);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    document.removeEventListener('keydown', seen);
    expect(seen).toHaveBeenCalled();
  });

  it('without WebGL2 shows the message and keeps the list and the panel working', async () => {
    stubFetch();
    renderScene(false);
    await screen.findByRole('list', { name: 'Eventos de la campaña' });
    expect(screen.queryByTestId('andes-renderer')).toBeNull();
    expect(screen.getByText(/necesita WebGL2/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Río de los Patos/ }));
    expect(screen.getByRole('region', { name: /Evento: Río de los Patos/ })).toBeTruthy();
  });

  it('is one big stage with floating controls: the title is a heading and there is no carousel', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    expect(screen.getByRole('heading', { level: 1, name: 'Los Andes' })).toBeTruthy();
    expect(document.querySelector('.dash--stage')).not.toBeNull();
    expect(screen.queryByRole('region', { name: 'Visor' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Controles de la escena' })).toBeTruthy();
  });

  it('follows the army only when asked, and says so with a pressed button', async () => {
    stubFetch();
    renderScene();
    const renderer = await screen.findByTestId('andes-renderer');
    expect(renderer.getAttribute('data-camera')).toBe('free');
    const button = screen.getByRole('button', { name: 'Seguir al ejército' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('andes-renderer').getAttribute('data-camera')).toBe('follow');
  });

  it('has a camera for following, cinematic, aerial and the far map, one at a time, and a second press frees it', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    const camera = () => screen.getByTestId('andes-renderer').getAttribute('data-camera');
    const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed');
    fireEvent.click(screen.getByRole('button', { name: 'Aérea' }));
    expect(camera()).toBe('aerial');
    fireEvent.click(screen.getByRole('button', { name: 'Cine' }));
    expect(camera()).toBe('cine');
    expect(pressed('Aérea')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Vista de mapa' }));
    expect(camera()).toBe('map');
    expect(pressed('Cine')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Vista de mapa' }));
    expect(camera()).toBe('free');
  });

  it('shows the progress of the crossing in percent, not the year, and moving it moves the clock', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    const slider = screen.getByRole('slider', { name: 'Avance del cruce' }) as HTMLInputElement;
    expect(screen.getByTestId('andes-progress').textContent).toBe('0 %');
    expect(slider.value).toBe('0');
    fireEvent.change(slider, { target: { value: '50' } });
    expect(screen.getByTestId('andes-progress').textContent).toBe('50 %');
    const year = useStore.getState().yearFloat;
    expect(year).toBeGreaterThan(1810);
    expect(year).toBeLessThan(2056);
    fireEvent.change(slider, { target: { value: '100' } });
    expect(useStore.getState().yearFloat).toBe(2056);
    expect(screen.getByTestId('andes-renderer').getAttribute('data-day')).toBe('27');
  });

  it('follows the clock with the percent too: more years, more crossing', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    const percentAt = (year: number) => {
      act(() => useStore.setState({ yearFloat: year }));
      return Number(screen.getByTestId('andes-progress').getAttribute('data-value'));
    };
    const a = percentAt(1850);
    const b = percentAt(1950);
    const c = percentAt(2030);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(c).toBeLessThanOrEqual(100);
  });

  it('shows an estimate of the oxygen saturation that falls as the army climbs, and says it depends on the person', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    const spo2 = () => Number(screen.getByTestId('andes-spo2').querySelector('.tile-value')!.textContent!.replace(/\D/g, ''));
    const low = spo2();
    // the lowest saturation of the crossing, at the high pass
    let pass = 100;
    for (const year of [1900, 1920, 1940, 1960, 1980, 2000]) {
      act(() => useStore.setState({ yearFloat: year }));
      pass = Math.min(pass, spo2());
    }
    expect(low).toBe(98);
    expect(pass).toBeLessThan(94);
    expect(pass).toBeGreaterThan(85);
    const tile = screen.getByTestId('andes-spo2');
    expect(tile.textContent).toMatch(/Estimada/);
    expect(tile.textContent).toMatch(/depende de cada persona/);
    expect(screen.queryByText(/VO₂/)).toBeNull();
  });

  it('shows the altitude profile of the crossing on the right, says its numbers in words, and its marker follows the army', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    const side = document.querySelector('.dash-side')!;
    const chart = within(side as HTMLElement).getByTestId('andes-profile');
    expect(chart.getAttribute('role')).toBe('img');
    expect(chart.getAttribute('aria-label')).toMatch(/Perfil de altitud del cruce/);
    expect(chart.getAttribute('aria-label')).toMatch(/máximo de 3\.486 m/);
    expect(chart.getAttribute('data-progress')).toBe('0.000');
    const at = (year: number) => {
      act(() => useStore.setState({ yearFloat: year }));
      return Number(screen.getByTestId('andes-profile').getAttribute('data-progress'));
    };
    const early = at(1850);
    const mid = at(1950);
    const late = at(2030);
    expect(early).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(early);
    expect(late).toBeGreaterThan(mid);
    expect(screen.getByTestId('andes-profile').getAttribute('aria-label')).toMatch(/va por [\d.]+ m/);
  });

  it('says there is no profile when the data has no altitude', async () => {
    // the schema asks for a note where the altitude is missing
    const noAltitude = (events as Array<Record<string, unknown>>).map((e) => ({ ...e, elevation_m: null, note: 'sin dato de altitud' }));
    stubFetch(noAltitude);
    renderScene();
    await screen.findByTestId('andes-renderer');
    expect(screen.queryByTestId('andes-profile')).toBeNull();
    const empty = document.querySelector('.dash-side .andes-profile .andes-profile-empty');
    expect(empty?.textContent).toBe('sin dato');
  });

  it('has graphics options: the effects can be switched off, the choice is kept, and a low quality turns off what it cannot afford', async () => {
    stubFetch();
    renderScene();
    const renderer = await screen.findByTestId('andes-renderer');
    expect(renderer.getAttribute('data-snow')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Gráficos' }));
    const menu = screen.getByRole('group', { name: 'Opciones de gráficos' });
    fireEvent.click(within(menu).getByRole('checkbox', { name: /Nieve/ }));
    expect(screen.getByTestId('andes-renderer').getAttribute('data-snow')).toBe('false');
    expect(window.localStorage.getItem('andes-graphics')).toContain('"snow":false');
    fireEvent.click(within(menu).getByRole('checkbox', { name: /Árboles/ }));
    expect(screen.getByTestId('andes-renderer').getAttribute('data-trees')).toBe('false');
    fireEvent.click(within(menu).getByRole('radio', { name: 'Bajo' }));
    const low = screen.getByTestId('andes-renderer');
    expect(low.getAttribute('data-tier')).toBe('low');
    expect(low.getAttribute('data-textures')).toBe('false');
    expect(low.getAttribute('data-shadows')).toBe('false');
    expect(within(menu).getByRole('checkbox', { name: /Texturas/ }).hasAttribute('disabled')).toBe(true);
  });

  it('starts with the effects the reader left switched off last time', async () => {
    window.localStorage.setItem('andes-graphics', JSON.stringify({ snow: false, shadows: true, trees: true, textures: true }));
    stubFetch();
    renderScene();
    const renderer = await screen.findByTestId('andes-renderer');
    expect(renderer.getAttribute('data-snow')).toBe('false');
  });

  it('hides and shows the list of events', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    expect(screen.getByRole('list', { name: 'Eventos de la campaña' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Eventos' }));
    expect(screen.queryByRole('list', { name: 'Eventos de la campaña' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Eventos' }));
    expect(screen.getByRole('list', { name: 'Eventos de la campaña' })).toBeTruthy();
  });

  it('shows the same events as a table', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    fireEvent.click(screen.getByRole('button', { name: 'Tabla de eventos' }));
    expect(screen.queryByTestId('andes-renderer')).toBeNull();
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Cuesta de Chacabuco (batalla)')).toBeTruthy();
  });

  it('shows a message and no blank screen when the data is invalid', async () => {
    stubFetch([{ id: 'x' }]);
    renderScene();
    await waitFor(() => expect(screen.getByText(/No se pudieron cargar los datos/)).toBeTruthy());
  });

  it('mounts and unmounts the renderer without leaving one behind', async () => {
    stubFetch();
    for (let i = 0; i < 3; i += 1) {
      const { unmount } = renderScene();
      await screen.findByTestId('andes-renderer');
      unmount();
    }
    expect(mounts.n).toBe(3);
    expect(unmounts.n).toBe(3);
  });
});
