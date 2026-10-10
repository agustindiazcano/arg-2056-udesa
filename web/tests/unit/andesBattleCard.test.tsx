// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseAndesEvents } from '../../src/scenes/andes/data';
import { splitColumns } from '../../src/scenes/andes/columns';
import { buildRoute } from '../../src/scenes/andes/timeline';
import { BattleCard } from '../../src/scenes/andes/BattleCard';

afterEach(cleanup);

const events = parseAndesEvents(JSON.parse(readFileSync(resolve(process.cwd(), '../data/mock/andes_events.json'), 'utf8')) as unknown);
const battle = buildRoute(splitColumns(events).main).points.find((p) => /batalla/i.test(p.name))!;

describe('BattleCard', () => {
  it('names the battle, gives its date and a table of its data', () => {
    render(<BattleCard event={battle} x={100} y={100} />);
    expect(screen.getByRole('status', { name: 'Datos de Batalla de Chacabuco' })).toBeTruthy();
    expect(screen.getByText('12 de febrero de 1817')).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: 'Fuerzas realistas' })).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: 'Ejército de los Andes' }).nextElementSibling?.textContent).toBe('3.500');
  });

  it('stays inside the map when the mouse is near its edge', () => {
    render(<BattleCard event={battle} x={790} y={590} area={{ width: 800, height: 600 }} />);
    const card = screen.getByRole('status') as HTMLElement;
    const [left, top] = card.style.transform.match(/-?\d+/g)!.map(Number);
    expect(left!).toBeLessThanOrEqual(800 - 300);
    expect(top!).toBeLessThanOrEqual(600 - 230);
  });
});
