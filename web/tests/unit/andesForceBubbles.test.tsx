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
    // the data are little tables: the commanders, and the numbers
    const tables = open[0]!.querySelectorAll('table');
    expect(tables.length).toBe(2);
    expect(tables[0]!.querySelector('caption')!.textContent).toBe('Mando');
    expect(tables[0]!.textContent).toContain('Estanislao Soler');
    expect(tables[0]!.textContent).toContain('vanguardia');
    expect(tables[1]!.querySelector('caption')!.textContent).toBe('Fuerzas');
    expect(tables[1]!.textContent).toContain('Hombres');
    expect(tables[1]!.textContent).toContain('3.987');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar los datos de Fuerza principal' }));
    expect([...pops()].every((p) => p.hidden)).toBe(true);
  });

  it('has the data cards in a container of their own, apart from the bubbles, so they can be over everything', () => {
    const { container } = render(<ForceBubbles map={null} items={items} visible />);
    const pops = container.querySelector('.andes-pops')!;
    expect(pops.querySelectorAll('.andes-bubble-pop')).toHaveLength(items.length);
    expect(container.querySelector('.andes-bubbles')!.querySelector('.andes-bubble-pop')).toBeNull();
  });

  it('is hidden while the spotlight names the forces', () => {
    const { container } = render(<ForceBubbles map={null} items={items} visible={false} />);
    expect((container.querySelector('.andes-bubbles') as HTMLElement).hidden).toBe(true);
    expect((container.querySelector('.andes-pops') as HTMLElement).hidden).toBe(true);
  });
});
