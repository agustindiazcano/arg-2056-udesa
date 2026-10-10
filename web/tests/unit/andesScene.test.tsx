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
      followId,
      focusForce,
      battleShow,
      label
    }: {
      day: number;
      selectedId: string | null;
      camera: string;
      followId?: string | null;
      battleShow?: number;
      focusForce?: { id: string; n: number; near?: boolean } | null;
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
          data-follow={followId ?? ''}
          data-focus={focusForce?.id ?? ''}
          data-battle={battleShow}
          data-near={String(focusForce?.near ?? false)}
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

/** The dates and events are a dropdown, closed at first: open it. */
const openEvents = () => {
  const toggle = screen.getByRole('button', { name: /^Eventos del cruce/ });
  if (toggle.getAttribute('aria-expanded') !== 'true') fireEvent.click(toggle);
};

describe('Andes scene', () => {
  it('lists the events of the campaign and shows the real map with its credits', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    openEvents();
    const list = await screen.findByRole('list', { name: 'Eventos de la campaña' });
    expect(within(list).getAllByRole('button')).toHaveLength(13);
    const renderer = await screen.findByTestId('andes-renderer');
    expect(renderer).toBeTruthy();
    expect(screen.getByRole('note').textContent).toMatch(/MapTiler/);
  });

  it('shows the date, day and month, next to the other indicators, and it follows the clock', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    expect(within(screen.getByTestId('andes-date')).getByText('19 de enero')).toBeTruthy();
    act(() => useStore.setState({ yearFloat: 2056 }));
    expect(within(screen.getByTestId('andes-date')).getByText('15 de febrero')).toBeTruthy();
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
    openEvents();
    fireEvent.click(screen.getByRole('button', { name: /Manantiales/ }));
    const panel = screen.getByRole('region', { name: /Evento: Manantiales/ });
    expect(within(panel).getByText(/Ejército de los Andes: 3\.987/)).toBeTruthy();
    expect(screen.getByTestId('andes-renderer').getAttribute('data-selected')).toBe('andes-05');
  });

  it('shows the report of a battle at the bottom only when a battle is chosen', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    expect(screen.queryByRole('region', { name: /Resultado:/ })).toBeNull();
    openEvents();
    fireEvent.click(screen.getByRole('button', { name: /Manantiales/ }));
    expect(screen.queryByRole('region', { name: /Resultado:/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Las Coimas/ }));
    const report = screen.getByRole('region', { name: /Resultado: Las Coimas/ });
    expect(within(report).getByText('Victoria patriota')).toBeTruthy();
  });

  it('says the altitude is unknown when the event has none', async () => {
    stubFetch((events as Array<Record<string, unknown>>).map((e) => (e.id === 'andes-03' ? { ...e, elevation_m: null, note: 'sin dato de altitud' } : e)));
    renderScene();
    await screen.findByTestId('andes-renderer');
    openEvents();
    fireEvent.click(screen.getByRole('button', { name: /Valle de Calingasta/ }));
    const panel = screen.getByRole('region', { name: /Evento: Valle de Calingasta/ });
    expect(within(panel).getByText('sin dato')).toBeTruthy();
  });

  it('closes the panel with Escape and gives the focus back to the button that opened it', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    openEvents();
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
    await screen.findByText(/necesita WebGL2/);
    openEvents();
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

  it('has an aerial camera and the far map, one at a time, and a second press frees it', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    const camera = () => screen.getByTestId('andes-renderer').getAttribute('data-camera');
    const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed');
    fireEvent.click(screen.getByRole('button', { name: 'Aérea' }));
    expect(camera()).toBe('aerial');
    fireEvent.click(screen.getByRole('button', { name: 'Vista de mapa' }));
    expect(camera()).toBe('map');
    expect(pressed('Aérea')).toBe('false');
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

  it('starts with the effects the reader left switched off last time', async () => {
    window.localStorage.setItem('andes-graphics', JSON.stringify({ snow: false, shadows: true, trees: true, textures: true }));
    stubFetch();
    renderScene();
    const renderer = await screen.findByTestId('andes-renderer');
    expect(renderer.getAttribute('data-snow')).toBe('false');
  });

  it('opens and closes the dropdown of dates and events, closed at first', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    const toggle = () => screen.getByRole('button', { name: /^Eventos del cruce/ });
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('list', { name: 'Eventos de la campaña' })).toBeNull();
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('list', { name: 'Eventos de la campaña' })).toBeTruthy();
    fireEvent.click(toggle());
    expect(screen.queryByRole('list', { name: 'Eventos de la campaña' })).toBeNull();
  });

  it('follows a force when it is chosen, from near or from afar as asked, until the camera is set free', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    const attr = (name: string) => screen.getByTestId('andes-renderer').getAttribute(name);
    expect(attr('data-follow')).toBe('');
    fireEvent.click(screen.getByRole('button', { name: /Las Heras/ }));
    expect(attr('data-follow')).toBe('las-heras');
    expect(attr('data-near')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Ver de cerca' }));
    expect(attr('data-follow')).toBe('las-heras');
    expect(attr('data-near')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Ver de lejos' }));
    expect(attr('data-follow')).toBe('las-heras');
    expect(attr('data-near')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Cámara libre' }));
    expect(attr('data-follow')).toBe('');
    expect(attr('data-camera')).toBe('free');
  });

  it('follows the main force from close by when no force was chosen', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    fireEvent.click(screen.getByRole('button', { name: 'Ver de cerca' }));
    expect(screen.getByTestId('andes-renderer').getAttribute('data-follow')).toBe('main');
  });

  it('has a "Saltar intro" button that skips the clouds, the tour and the spotlight, leaves the camera on the main force, and goes away', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    expect(screen.getByTestId('andes-renderer').getAttribute('data-focus')).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Saltar intro' }));
    expect(screen.getByTestId('andes-renderer').getAttribute('data-focus')).toBe('main');
    expect(screen.getByTestId('andes-renderer').getAttribute('data-near')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Saltar intro' })).toBeNull();
  });

  it('has a "Batalla de Chacabuco" button that moves the progress to 100 % and shows the battle', async () => {
    stubFetch();
    renderScene();
    const renderer = await screen.findByTestId('andes-renderer');
    expect(renderer.getAttribute('data-battle')).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: 'Batalla de Chacabuco' }));
    expect(screen.getByTestId('andes-renderer').getAttribute('data-battle')).toBe('1');
    expect(screen.getByTestId('andes-renderer').getAttribute('data-day')).toBe('27');
    expect(screen.queryByRole('button', { name: 'Saltar intro' })).toBeNull();
  });

  it('has a toggle for the panel of the right, open by default on a wide screen and folded away on a laptop', async () => {
    const media = (matches: boolean) => vi.fn(() => ({ matches, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList);
    vi.stubGlobal('matchMedia', media(false));
    stubFetch();
    const first = renderScene();
    await screen.findByTestId('andes-renderer');
    const toggle = () => screen.getByRole('button', { name: 'Panel lateral' });
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('.dash--side-hidden')).toBeNull();
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('.dash--side-hidden')).not.toBeNull();
    first.unmount();
    vi.stubGlobal('matchMedia', media(true));
    renderScene();
    await screen.findByTestId('andes-renderer');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('.dash--side-hidden')).not.toBeNull();
    vi.unstubAllGlobals();
  });

  it('shows only the icon on the play button and "Avance" over the progress bar', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    expect(screen.getByText('Avance').className).toContain('progress-label');
    expect(screen.queryByText('Avance del cruce')).toBeNull();
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
