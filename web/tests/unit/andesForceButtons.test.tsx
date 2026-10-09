// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ForceButtons } from '../../src/scenes/andes/ForceButtons';
import { FORCES } from '../../src/scenes/andes/forces';

afterEach(() => cleanup());

describe('ForceButtons', () => {
  it('has a button with the name of each force', () => {
    render(<ForceButtons active={null} onGo={() => undefined} />);
    const group = screen.getByRole('group', { name: 'Fuerzas' });
    expect(within(group).getAllByRole('button')).toHaveLength(FORCES.length);
    expect(within(group).getByRole('button', { name: 'Fuerza principal' })).toBeTruthy();
    expect(within(group).getByRole('button', { name: 'Artillería y logística' })).toBeTruthy();
    expect(within(group).getByRole('button', { name: /Cabot/ })).toBeTruthy();
    expect(within(group).getByRole('button', { name: /Lemos/ })).toBeTruthy();
  });

  it('calls onGo with the id of the force that was clicked', () => {
    const onGo = vi.fn();
    render(<ForceButtons active={null} onGo={onGo} />);
    fireEvent.click(screen.getByRole('button', { name: 'Artillería y logística' }));
    expect(onGo).toHaveBeenCalledWith('las-heras');
    fireEvent.click(screen.getByRole('button', { name: /Zelada/ }));
    expect(onGo).toHaveBeenLastCalledWith('zelada');
  });

  it('marks the active force as pressed', () => {
    render(<ForceButtons active="freire" onGo={() => undefined} />);
    expect(screen.getByRole('button', { name: /Freire/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Fuerza principal' }).getAttribute('aria-pressed')).toBe('false');
  });
});
