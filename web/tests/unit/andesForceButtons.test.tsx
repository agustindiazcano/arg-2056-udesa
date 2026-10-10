// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { forceColor } from '../../src/scenes/andes/columns';
import { ForceButtons } from '../../src/scenes/andes/ForceButtons';
import { FORCES, forceChip, forceFullName } from '../../src/scenes/andes/forces';

afterEach(() => cleanup());

describe('forceChip and forceFullName', () => {
  it('has a short name for the button and a whole name for the hover', () => {
    expect(forceChip('main')).toBe('Principal');
    expect(forceChip('las-heras')).toBe('Las Heras');
    expect(forceChip('cabot')).toBe('Cabot');
    expect(forceFullName('main')).toContain('Fuerza principal');
    expect(forceFullName('main')).toContain('Los Patos');
    expect(forceFullName('las-heras')).toContain('Columna de Uspallata');
    expect(forceFullName('las-heras')).toContain('artillería y parque');
    expect(forceFullName('lemos')).toContain('Columna secundaria del sur');
    for (const f of FORCES) expect(forceFullName(f.id).length).toBeGreaterThan(forceChip(f.id).length);
  });
});

describe('forceColor', () => {
  it('gives every force its own color', () => {
    const colors = FORCES.map((f) => forceColor(f.id));
    expect(new Set(colors).size).toBe(FORCES.length);
    for (const c of colors) expect(c).toMatch(/^#/);
  });
});

describe('ForceButtons', () => {
  it('has one button per force with its short name, and the whole name as its accessible name', () => {
    render(<ForceButtons active={null} onGo={() => undefined} />);
    const group = screen.getByRole('group', { name: 'Fuerzas' });
    expect(within(group).getAllByRole('button')).toHaveLength(FORCES.length);
    const main = within(group).getByRole('button', { name: /Fuerza principal/ });
    expect(main.textContent).toBe('Principal');
    expect(main.getAttribute('data-full')).toContain('Fuerza principal');
    expect(within(group).getByRole('button', { name: /Columna de Uspallata/ }).textContent).toBe('Las Heras');
    expect(within(group).getByRole('button', { name: /Cabot/ }).textContent).toBe('Cabot');
  });

  it('draws a dot of the color of the force in every button', () => {
    render(<ForceButtons active={null} onGo={() => undefined} />);
    const dots = document.querySelectorAll<HTMLElement>('.andes-force-dot');
    expect(dots).toHaveLength(FORCES.length);
    dots.forEach((dot) => expect(dot.style.background).not.toBe(''));
  });

  it('calls onGo with the id of the force that was clicked', () => {
    const onGo = vi.fn();
    render(<ForceButtons active={null} onGo={onGo} />);
    fireEvent.click(screen.getByRole('button', { name: /Columna de Uspallata/ }));
    expect(onGo).toHaveBeenCalledWith('las-heras');
    fireEvent.click(screen.getByRole('button', { name: /Zelada/ }));
    expect(onGo).toHaveBeenLastCalledWith('zelada');
  });

  it('marks the active force as pressed', () => {
    render(<ForceButtons active="freire" onGo={() => undefined} />);
    expect(screen.getByRole('button', { name: /Freire/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Fuerza principal/ }).getAttribute('aria-pressed')).toBe('false');
  });
});
