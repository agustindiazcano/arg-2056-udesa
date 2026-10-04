// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SceneShell } from '../../src/ui/SceneShell';
import { TableToggle } from '../../src/ui/TableToggle';
import { FilterBar, FilterChip } from '../../src/ui/FilterBar';

afterEach(cleanup);

describe('SceneShell', () => {
  it('renders the title as the one h1, the subtitle, the children and the source line in Spanish', () => {
    render(
      <SceneShell title="Economía" subtitle="Desde 1880 hasta hoy" sources={['MOCK', 'INDEC']} retrievedAt="2026-10-02">
        <p>contenido</p>
      </SceneShell>
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Economía' })).toBeDefined();
    expect(screen.getByText('Desde 1880 hasta hoy')).toBeDefined();
    expect(screen.getByText('contenido')).toBeDefined();
    expect(screen.getByText('Fuente: MOCK, INDEC, consultado el 2 de octubre de 2026')).toBeDefined();
  });

  it('omits the retrieved date when there is none and the whole line when there is no source', () => {
    const { rerender } = render(<SceneShell title="T" sources={['MOCK']} />);
    expect(screen.getByText('Fuente: MOCK')).toBeDefined();
    rerender(<SceneShell title="T" sources={[]} />);
    expect(screen.queryByText(/Fuente/)).toBeNull();
  });
});

describe('TableToggle', () => {
  it('is a button named "Ver tabla" whose aria-pressed follows the prop and that calls onToggle', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<TableToggle pressed={false} onToggle={onToggle} />);
    const button = screen.getByRole('button', { name: 'Ver tabla' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(<TableToggle pressed onToggle={onToggle} />);
    expect(screen.getByRole('button', { name: 'Ver tabla' }).getAttribute('aria-pressed')).toBe('true');
  });
});

describe('FilterBar', () => {
  it('is a labelled group of chips that report their pressed state and clicks', () => {
    const onClick = vi.fn();
    render(
      <FilterBar label="Indicador">
        <FilterChip pressed onClick={onClick}>
          PIB
        </FilterChip>
        <FilterChip pressed={false} disabled onClick={onClick}>
          IDH
        </FilterChip>
      </FilterBar>
    );
    const group = screen.getByRole('group', { name: 'Indicador' });
    expect(group).toBeDefined();
    const pib = screen.getByRole('button', { name: 'PIB' });
    expect(pib.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(pib);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('button', { name: 'IDH' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
