// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ChartPanel } from '../../src/ui/ChartPanel';
import { Tile, TileGrid } from '../../src/ui/Tile';

afterEach(cleanup);

describe('ChartPanel', () => {
  it('shows the title and the chart, and swaps for the table with the toggle', () => {
    render(<ChartPanel title="Largo plazo" chart={<p>el gráfico</p>} table={<p>la tabla</p>} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Largo plazo' })).toBeTruthy();
    expect(screen.getByText('el gráfico')).toBeTruthy();
    expect(screen.queryByText('la tabla')).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Ver tabla' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle);
    expect(screen.getByText('la tabla')).toBeTruthy();
    expect(screen.queryByText('el gráfico')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ver tabla' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Ver tabla' }));
    expect(screen.getByText('el gráfico')).toBeTruthy();
  });

  it('has no toggle when the view has no table', () => {
    render(<ChartPanel title="Sólo gráfico" chart={<p>el gráfico</p>} />);
    expect(screen.queryByRole('button', { name: 'Ver tabla' })).toBeNull();
  });

  it('can show extra controls next to the title', () => {
    render(<ChartPanel title="T" chart={<p>c</p>} actions={<button>Extra</button>} />);
    expect(screen.getByRole('button', { name: 'Extra' })).toBeTruthy();
  });

  it('can start on the table', () => {
    render(<ChartPanel title="T" chart={<p>c</p>} table={<p>t</p>} startAsTable />);
    expect(screen.getByText('t')).toBeTruthy();
  });
});

describe('Tile', () => {
  it('is a labelled group with its test id and the value as children', () => {
    render(
      <TileGrid>
        <Tile id="tile-value" label="Valor en 2030">
          <span>110 u</span>
        </Tile>
      </TileGrid>
    );
    const tile = screen.getByTestId('tile-value');
    expect(tile.getAttribute('role')).toBe('group');
    expect(tile.getAttribute('aria-label')).toBe('Valor en 2030');
    expect(tile.textContent).toContain('110 u');
  });
});
