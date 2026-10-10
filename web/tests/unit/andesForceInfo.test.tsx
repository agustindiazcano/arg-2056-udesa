// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ForceInfo } from '../../src/scenes/andes/ForceInfo';
import { FORCES } from '../../src/scenes/andes/forces';

afterEach(() => cleanup());

describe('ForceInfo', () => {
  it('shows nothing without a force', () => {
    const { container } = render(<ForceInfo id={null} onClose={() => undefined} />);
    expect(container.textContent).toBe('');
  });

  it('shows the name, the commanders and the numbers of the main force, and only data', () => {
    render(<ForceInfo id="main" onClose={() => undefined} />);
    const box = screen.getByRole('region', { name: 'Datos de Fuerza principal' });
    expect(within(box).getByRole('heading', { name: 'Fuerza principal' })).toBeTruthy();
    expect(within(box).getByText(/José de San Martín/)).toBeTruthy();
    expect(within(box).getByText(/Estanislao Soler/)).toBeTruthy();
    expect(within(box).getByText(/O'Higgins/)).toBeTruthy();
    expect(within(box).getByText('Hombres')).toBeTruthy();
    expect(within(box).getByText('3.987')).toBeTruthy();
    expect(within(box).getByText(/Batallones 1 \(Cazadores\)/)).toBeTruthy();
    // no prose: the goal of the force is for the bubble, not for this box
    expect(box.textContent).not.toContain('Cruzar por');
  });

  it('shows the infantry only where the sources give it', () => {
    render(<ForceInfo id="freire" onClose={() => undefined} />);
    expect(screen.getByText('Infantería')).toBeTruthy();
    expect(screen.getByText('75 a 80')).toBeTruthy();
    cleanup();
    render(<ForceInfo id="cabot" onClose={() => undefined} />);
    expect(screen.queryByText('Infantería')).toBeNull();
  });

  it('has a box for every patriot force, never says sin dato', () => {
    for (const f of FORCES) {
      const { container, unmount } = render(<ForceInfo id={f.id} onClose={() => undefined} />);
      expect(container.querySelector('section'), f.id).toBeTruthy();
      expect(container.textContent, f.id).not.toContain('sin dato');
      unmount();
    }
  });

  it('closes with its button', () => {
    const onClose = vi.fn();
    render(<ForceInfo id="lemos" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar los datos de la fuerza' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
