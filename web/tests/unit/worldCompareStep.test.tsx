// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

import { WorldStep } from '../../src/tour/WorldStep';

afterEach(cleanup);

const group = () => screen.getByRole('group', { name: 'Países a comparar con Argentina' });
const flag = (name: string) => within(group()).getByRole('button', { name });

describe('slide 1: countries next to Argentina', () => {
  it('shows only flags (no text), Argentina fixed, Brasil and México on, the other seven off', () => {
    render(<WorldStep />);
    const buttons = within(group()).getAllByRole('button');
    expect(buttons).toHaveLength(9);
    for (const b of buttons) {
      expect(b.textContent).toBe('');
      expect(b.querySelector('img')?.getAttribute('src')).toMatch(/^\/flags\/[a-z]{2}\.svg$/);
      expect(b.getAttribute('title')).toBeNull();
    }
    expect(within(group()).getByRole('img', { name: /Argentina, siempre/ })).toBeTruthy();
    expect(flag('Brasil').getAttribute('aria-pressed')).toBe('true');
    expect(flag('México').getAttribute('aria-pressed')).toBe('true');
    for (const name of ['Estados Unidos', 'Australia', 'Japón', 'Alemania', 'Chile', 'Uruguay', 'España']) {
      expect(flag(name).getAttribute('aria-pressed'), name).toBe('false');
    }
  });

  it('switches a country on and off with its flag', () => {
    render(<WorldStep />);
    fireEvent.click(flag('Chile'));
    expect(flag('Chile').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(flag('Chile'));
    expect(flag('Chile').getAttribute('aria-pressed')).toBe('false');
  });

  it('offers no scale switch while nobody is squashed, and a Lineal | Logarítmica switch with its help once Estados Unidos is on', () => {
    render(<WorldStep />);
    expect(screen.queryByRole('group', { name: 'Escala' })).toBeNull();
    fireEvent.click(flag('Estados Unidos'));
    const scale = screen.getByRole('group', { name: 'Escala' });
    expect(within(scale).getByRole('button', { name: 'Lineal' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(scale).getByRole('button', { name: 'Logarítmica' }));
    expect(within(scale).getByRole('button', { name: 'Logarítmica' }).getAttribute('aria-pressed')).toBe('true');
    const help = screen.getByRole('button', { name: /Explicación: Escala logarítmica/ });
    fireEvent.mouseEnter(help);
    expect(screen.getByRole('tooltip').textContent).toContain('menos de una décima parte');
    fireEvent.mouseLeave(help);
    // taking Estados Unidos off removes the switch again, and the scale goes back to linear
    fireEvent.click(flag('Estados Unidos'));
    expect(screen.queryByRole('group', { name: 'Escala' })).toBeNull();
  });

  it('explains the dashed regional growth line in the help of the title, only while the chart shows the PBI', () => {
    render(<WorldStep />);
    const help = () => screen.getByRole('button', { name: /Explicación: Dónde estuvo/ });
    fireEvent.mouseEnter(help());
    expect(screen.getByRole('tooltip').textContent).toContain('crecimiento anual');
    fireEvent.mouseLeave(help());
    fireEvent.click(screen.getByRole('button', { name: 'Ver PBI per cápita real en el gráfico grande' }));
    fireEvent.mouseEnter(help());
    expect(screen.getByRole('tooltip').textContent).not.toContain('línea punteada');
  });
});

