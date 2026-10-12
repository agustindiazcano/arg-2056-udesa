// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
    expect(within(report).getAllByRole('img', { name: 'Bandera del Ejército de los Andes' })).toHaveLength(2);
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

  it('heads the report with the small date, the place and the battle, the result with the flag of the winner and a short account', () => {
    render(<BattleReport event={named(/Batalla/)} />);
    const report = screen.getByRole('region', { name: /Resultado: Batalla de Chacabuco/ });
    expect(within(report).getByText('12 de febrero de 1817')).toBeTruthy();
    expect(within(report).getByRole('heading', { level: 2, name: /Batalla de Chacabuco.*hacienda de Chacabuco/i })).toBeTruthy();
    const result = within(report).getByText(/^Resultado:/).parentElement!;
    expect(within(result).getByText('Victoria patriota')).toBeTruthy();
    expect(within(result).getByRole('img', { name: 'Bandera del Ejército de los Andes' })).toBeTruthy();
    expect(within(report).getAllByRole('img', { name: /Bandera del Ejército de los Andes/ })).toHaveLength(2);
    const account = report.querySelector('.andes-report-summary')!;
    expect(account.textContent!.length).toBeGreaterThan(80);
    expect(account.textContent).toMatch(/Soler/);
  });

  it('has an account for every combat too', () => {
    for (const re of [/Achupallas/, /Coimas/]) {
      const event = named(re);
      expect(event.outcome?.summary?.length ?? 0).toBeGreaterThan(80);
      expect(event.outcome?.place).toBeTruthy();
    }
  });

  it('has a toggle that folds the report to its heading and opens it again', () => {
    render(<BattleReport event={named(/Batalla/)} />);
    const report = screen.getByRole('region', { name: /Resultado: Batalla de Chacabuco/ });
    const toggle = within(report).getByRole('button', { name: /Ocultar el detalle/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(within(report).getAllByRole('rowheader', { name: 'Muertos' })).toHaveLength(2);
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-label')).toMatch(/Mostrar el detalle/);
    expect(within(report).queryByRole('rowheader', { name: 'Muertos' })).toBeNull();
    expect(report.querySelector('.andes-report-summary')).toBeNull();
    expect(within(report).getByText('Victoria patriota')).toBeTruthy();
    expect(within(report).getByRole('heading', { level: 2 })).toBeTruthy();
    fireEvent.click(toggle);
    expect(within(report).getAllByRole('rowheader', { name: 'Muertos' }).length).toBe(2);
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
