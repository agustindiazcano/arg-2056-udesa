// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Dashboard } from '../../src/dashboard/Dashboard';
import { SlotPortal } from '../../src/dashboard/SlotPortal';
import { useSlots } from '../../src/dashboard/slots';
import type { DashView } from '../../src/dashboard/types';

afterEach(() => {
  cleanup();
  useSlots.setState({ filters: null, narrative: null });
});

const view = (id: string, name: string, kind: DashView['thumb']['kind'] = 'bars'): DashView => ({
  id,
  name,
  thumb: { kind, values: [3, 1, 2] },
  content: <p>{`contenido ${id}`}</p>
});

const VIEWS = [view('a', 'Evolución', 'line'), view('b', 'Ranking'), view('c', 'Puesto', 'line'), view('d', 'Mapa', 'map'), view('e', 'Tabla', 'table')];

function renderDashboard(over: Partial<React.ComponentProps<typeof Dashboard>> = {}) {
  return render(
    <Dashboard
      title="Argentina en la región"
      subtitle="Desde 1880 hasta hoy"
      legend={[{ label: 'Argentina', tone: 'blue' }, { label: 'Resto de la región', tone: 'muted' }]}
      sources={['MOCK']}
      retrievedAt="2026-10-02"
      views={VIEWS}
      tiles={<p>los indicadores</p>}
      rail={<p>la lista</p>}
      filters={<p>los filtros</p>}
      {...over}
    />
  );
}

describe('Dashboard', () => {
  it('has the one h1, the subtitle, the legend and the auditable source line', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { level: 1, name: 'Argentina en la región' })).toBeTruthy();
    expect(screen.getByText('Desde 1880 hasta hoy')).toBeTruthy();
    expect(screen.getByText('Argentina')).toBeTruthy();
    expect(screen.getByText('Resto de la región')).toBeTruthy();
    expect(screen.getByText('Fuente: MOCK, consultado el 2 de octubre de 2026')).toBeTruthy();
  });

  it('shows the rail list, the indicators and the filters', () => {
    renderDashboard();
    expect(screen.getByText('la lista')).toBeTruthy();
    expect(screen.getByText('los indicadores')).toBeTruthy();
    expect(screen.getByText('los filtros')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Indicadores' })).toBeTruthy();
  });

  it('shows the first four views in the carousel and only the first one in the viewer', () => {
    renderDashboard();
    const carousel = screen.getByRole('group', { name: 'Vistas' });
    expect(within(carousel).getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual([
      'Vistas anteriores',
      'Evolución',
      'Ranking',
      'Puesto',
      'Mapa',
      'Vistas siguientes'
    ]);
    expect(screen.getByRole('button', { name: 'Evolución' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Ranking' }).getAttribute('aria-pressed')).toBe('false');
    const viewer = screen.getByRole('region', { name: 'Visor' });
    expect(within(viewer).getByText('contenido a')).toBeTruthy();
    expect(within(viewer).queryByText('contenido b')).toBeNull();
  });

  it('puts the chosen view in the viewer', () => {
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: 'Ranking' }));
    const viewer = screen.getByRole('region', { name: 'Visor' });
    expect(within(viewer).getByText('contenido b')).toBeTruthy();
    expect(within(viewer).queryByText('contenido a')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ranking' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('pages the carousel with the arrows when there are more than four views', () => {
    renderDashboard();
    expect((screen.getByRole('button', { name: 'Vistas anteriores' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Vistas siguientes' }));
    expect(screen.queryByRole('button', { name: 'Evolución' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Tabla' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Vistas siguientes' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Vistas anteriores' }) as HTMLButtonElement).disabled).toBe(false);
    // the selection does not change by paging
    expect(within(screen.getByRole('region', { name: 'Visor' })).getByText('contenido a')).toBeTruthy();
  });

  it('has no arrows to use with four views or fewer', () => {
    renderDashboard({ views: VIEWS.slice(0, 3) });
    expect((screen.getByRole('button', { name: 'Vistas anteriores' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Vistas siguientes' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('falls back to the first view when the selected one disappears', () => {
    const { rerender } = renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: 'Ranking' }));
    rerender(
      <Dashboard title="T" subtitle="S" sources={[]} views={VIEWS.filter((v) => v.id !== 'b')} tiles={null} rail={null} filters={null} />
    );
    expect(within(screen.getByRole('region', { name: 'Visor' })).getByText('contenido a')).toBeTruthy();
  });

  it('keeps the thumbnails out of the accessibility tree: the button name is the view name', () => {
    renderDashboard();
    const button = screen.getByRole('button', { name: 'Evolución' });
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('puts the narrative slot in the right panel', () => {
    renderDashboard();
    expect(document.querySelector('[data-slot="narrative"]')).toBeTruthy();
  });
});

describe('SlotPortal', () => {
  it('renders in place when the slot is not on the page', () => {
    render(
      <div data-testid="here">
        <SlotPortal slot="filters">
          <p>inline</p>
        </SlotPortal>
      </div>
    );
    expect(within(screen.getByTestId('here')).getByText('inline')).toBeTruthy();
  });

  it('renders inside the slot element once it is registered', () => {
    const slot = document.createElement('div');
    document.body.appendChild(slot);
    render(
      <div data-testid="here">
        <SlotPortal slot="filters">
          <p>moved</p>
        </SlotPortal>
      </div>
    );
    act(() => useSlots.getState().set('filters', slot));
    expect(within(slot).getByText('moved')).toBeTruthy();
    expect(within(screen.getByTestId('here')).queryByText('moved')).toBeNull();
    slot.remove();
  });
});

describe('Dashboard in stage mode (one big view with floating controls)', () => {
  it('gives the whole area to the stage: no title rail, no carousel, no viewer bar, no viewer', () => {
    renderDashboard({ stage: <p>el escenario</p> });
    expect(screen.getByText('el escenario')).toBeTruthy();
    expect(screen.queryByText('la lista')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Visor' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Vistas' })).toBeNull();
    expect(document.querySelector('.dash--stage')).not.toBeNull();
  });

  it('keeps the indicators and the side controls on the right', () => {
    renderDashboard({ stage: <p>el escenario</p>, side: <p>el panel</p> });
    expect(screen.getByText('los indicadores')).toBeTruthy();
    expect(screen.getByText('el panel')).toBeTruthy();
  });

  it('is the normal dashboard without a stage', () => {
    renderDashboard();
    expect(document.querySelector('.dash--stage')).toBeNull();
    expect(screen.getByText('la lista')).toBeTruthy();
  });
});
