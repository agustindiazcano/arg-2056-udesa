// @vitest-environment jsdom
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './reducedMotionStub';

const { mounts, unmounts } = vi.hoisted(() => ({ mounts: { n: 0 }, unmounts: { n: 0 } }));

// the renderer is the only file that touches WebGL: replaced by a stub that shows what it was given
vi.mock('../../src/scenes/andes/Renderer', async () => {
  const React = await import('react');
  return {
    default: ({ day, selectedId, label, terrain }: { day: number; selectedId: string | null; label: string; terrain: { meta: { source: string } } }) => {
      React.useEffect(() => {
        mounts.n += 1;
        return () => {
          unmounts.n += 1;
        };
      }, []);
      return (
        <div data-testid="andes-renderer" data-day={Math.round(day)} data-selected={selectedId ?? ''} data-source={terrain.meta.source}>
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
  it('lists the events of the campaign and shows the made-up terrain with its warning', async () => {
    stubFetch();
    renderScene();
    const list = await screen.findByRole('list', { name: 'Eventos de la campaña' });
    expect(within(list).getAllByRole('button')).toHaveLength(10);
    const renderer = await screen.findByTestId('andes-renderer');
    expect(renderer.getAttribute('data-source')).toBe('Terreno sintético');
    expect(screen.getByRole('note').textContent).toMatch(/provisorio/i);
  });

  it('moves the army with the shared clock: the day follows the year', async () => {
    stubFetch();
    renderScene();
    const renderer = await screen.findByTestId('andes-renderer');
    expect(renderer.getAttribute('data-day')).toBe('0');
    act(() => useStore.setState({ yearFloat: 2056 }));
    expect(screen.getByTestId('andes-renderer').getAttribute('data-day')).toBe('21');
    expect(within(screen.getByTestId('andes-day')).getByText('21')).toBeTruthy();
  });

  it('shows the panel of the chosen event with its forces, and an unknown count says so instead of 0', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    fireEvent.click(screen.getByRole('button', { name: /Alta cordillera/ }));
    const panel = screen.getByRole('region', { name: /Evento: Alta cordillera/ });
    expect(within(panel).getByText(/Columna principal \(ilustrativa\): 3\.400/)).toBeTruthy();
    expect(within(panel).getByText(/sin dato \(Sin fuerzas opuestas registradas/)).toBeTruthy();
    expect(screen.getByTestId('andes-renderer').getAttribute('data-selected')).toBe('mock-andes-05');
  });

  it('says the altitude is unknown when the event has none', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    fireEvent.click(screen.getByRole('button', { name: /Primer valle/ }));
    const panel = screen.getByRole('region', { name: /Evento: Primer valle/ });
    expect(within(panel).getByText('sin dato')).toBeTruthy();
  });

  it('closes the panel with Escape and gives the focus back to the button that opened it', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    const opener = screen.getByRole('button', { name: /Ascenso/ });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('region', { name: /Evento: Ascenso/ })).toBeTruthy();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('region', { name: /Evento: Ascenso/ })).toBeNull();
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
    fireEvent.click(screen.getByRole('button', { name: /Ascenso/ }));
    expect(screen.getByRole('region', { name: /Evento: Ascenso/ })).toBeTruthy();
  });

  it('shows the same events as a table', async () => {
    stubFetch();
    renderScene();
    await screen.findByTestId('andes-renderer');
    fireEvent.click(screen.getByRole('button', { name: 'Tabla de eventos' }));
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Cumbre del paso (ilustrativo)')).toBeTruthy();
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
