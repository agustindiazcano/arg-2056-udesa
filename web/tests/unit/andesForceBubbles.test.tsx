// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ForceBubbles } from '../../src/scenes/andes/ForceBubbles';
import { ENEMY_ID } from '../../src/scenes/andes/forces';

afterEach(() => cleanup());

const items = [
  { id: 'main', ids: ['main'], lon: -69, lat: -32 },
  { id: ENEMY_ID, ids: [ENEMY_ID], lon: -70.7, lat: -33 }
];

describe('ForceBubbles', () => {
  it('has a bubble with the name of each force and the flag over it: patriot for the patriot forces, royalist for the enemy', () => {
    render(<ForceBubbles map={null} items={items} visible />);
    expect(screen.getAllByRole('button', { name: /Fuerza principal|Fuerzas realistas/ })).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'Bandera del Ejército de los Andes' })).toBeTruthy();
    expect(screen.getByRole('img', { name: /Bandera realista/ })).toBeTruthy();
  });

  it('opens the data of a force when its bubble is clicked, with a button to close it', () => {
    render(<ForceBubbles map={null} items={items} visible />);
    const pops = () => document.querySelectorAll<HTMLElement>('.andes-bubble-pop');
    expect([...pops()].every((p) => p.hidden)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Fuerza principal/ }));
    const open = [...pops()].filter((p) => !p.hidden);
    expect(open).toHaveLength(1);
    expect(open[0]!.textContent).toContain('San Martín');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar los datos de Fuerza principal' }));
    expect([...pops()].every((p) => p.hidden)).toBe(true);
  });

  it('is hidden while the spotlight names the forces', () => {
    const { container } = render(<ForceBubbles map={null} items={items} visible={false} />);
    expect((container.querySelector('.andes-bubbles') as HTMLElement).hidden).toBe(true);
  });
});
