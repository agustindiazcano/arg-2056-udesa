// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseAndesEvents } from '../../src/scenes/andes/data';
import { splitColumns } from '../../src/scenes/andes/columns';
import { buildRoute } from '../../src/scenes/andes/timeline';
import { BattleReport } from '../../src/scenes/andes/BattleReport';

afterEach(cleanup);

const events = parseAndesEvents(JSON.parse(readFileSync(resolve(process.cwd(), '../data/mock/andes_events.json'), 'utf8')) as unknown);
const points = buildRoute(splitColumns(events).main).points;
const named = (re: RegExp) => points.find((p) => re.test(p.name))!;

describe('BattleReport', () => {
  it('gives the result, the flag of each side, the forces, the units, the dead, the wounded and the prisoners of the battle', () => {
    render(<BattleReport event={named(/Batalla/)} />);
    const report = screen.getByRole('region', { name: /Resultado: Batalla de Chacabuco/ });
    expect(within(report).getByText('Victoria patriota')).toBeTruthy();
    expect(within(report).getByRole('img', { name: 'Bandera del Ejército de los Andes' })).toBeTruthy();
    expect(within(report).getByRole('img', { name: /Bandera realista/ })).toBeTruthy();
    const patriots = within(report).getByRole('heading', { name: /Ejército de los Andes/ }).parentElement!;
    expect(within(patriots).getByRole('rowheader', { name: 'Muertos' }).nextElementSibling?.textContent).toBe('12');
    expect(within(patriots).getByRole('rowheader', { name: 'Heridos' }).nextElementSibling?.textContent).toBe('120');
    expect(within(patriots).getByRole('rowheader', { name: 'Fuerzas en combate' }).nextElementSibling?.textContent).toBe('3.500');
    const royalists = within(report).getByRole('heading', { name: /Fuerzas realistas/ }).parentElement!;
    expect(within(royalists).getByRole('rowheader', { name: 'Muertos' }).nextElementSibling?.textContent).toBe('500');
    expect(within(royalists).getByRole('rowheader', { name: 'Prisioneros' }).nextElementSibling?.textContent).toBe('600');
    expect(within(royalists).getByRole('rowheader', { name: 'Fuerzas en combate' }).nextElementSibling?.textContent).toMatch(/2\.080/);
  });

  it('says «sin dato» for what the sources do not give, never 0', () => {
    render(<BattleReport event={named(/Achupallas/)} />);
    const rows = screen.getAllByRole('rowheader', { name: /Muertos|Heridos|Prisioneros/ });
    expect(rows).toHaveLength(6);
    for (const row of rows) expect(row.nextElementSibling?.textContent).toBe('sin dato');
  });

  it('is nothing for an event that is not a battle', () => {
    const { container } = render(<BattleReport event={named(/Manantiales/)} />);
    expect(container.textContent).toBe('');
  });
});
