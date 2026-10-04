// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataTable, rowsThatFit } from '../../src/charts/DataTable';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const columns = [
  { key: 'n', header: 'Número' },
  { key: 'v', header: 'Valor' }
];
const data = Array.from({ length: 7 }, (_, i) => ({ n: i + 1, v: `v${i + 1}` }));
const bodyRows = () => screen.getAllByRole('row').slice(1);

describe('rowsThatFit', () => {
  it('counts the whole rows that fit under the header and above the pager', () => {
    expect(rowsThatFit({ height: 400, rowHeight: 30, reserved: 100 })).toBe(10);
    expect(rowsThatFit({ height: 129, rowHeight: 30, reserved: 100 })).toBe(1);
  });
  it('never goes below one row', () => {
    expect(rowsThatFit({ height: 50, rowHeight: 30, reserved: 100 })).toBe(1);
  });
});

describe('DataTable paging', () => {
  it('shows every row and no pager by default', () => {
    render(<DataTable caption="T" columns={columns} data={data} />);
    expect(bodyRows()).toHaveLength(7);
    expect(screen.queryByRole('button', { name: 'Página siguiente' })).toBeNull();
  });

  it('pages the rows with a fixed page size and says which page it is', () => {
    render(<DataTable caption="T" columns={columns} data={data} pageSize={3} />);
    expect(bodyRows()).toHaveLength(3);
    expect(screen.getByText('Página 1 de 3')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Página anterior' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(within(bodyRows()[0]!).getByText('4')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(bodyRows()).toHaveLength(1);
    expect(screen.getByText('Página 3 de 3')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Página siguiente' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('has no pager when everything fits on one page', () => {
    render(<DataTable caption="T" columns={columns} data={data} pageSize={10} />);
    expect(bodyRows()).toHaveLength(7);
    expect(screen.queryByText(/Página/)).toBeNull();
  });

  it('keeps a valid page when the data gets shorter', () => {
    const { rerender } = render(<DataTable caption="T" columns={columns} data={data} pageSize={3} />);
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    rerender(<DataTable caption="T" columns={columns} data={data.slice(0, 2)} pageSize={3} />);
    expect(bodyRows()).toHaveLength(2);
  });

  it('in fit mode shows all rows when the room cannot be measured', () => {
    render(<DataTable caption="T" columns={columns} data={data} pageSize="fit" />);
    expect(bodyRows()).toHaveLength(7);
  });

  it('in fit mode pages by the height it is given', () => {
    let notify: () => void = () => undefined;
    class FakeObserver {
      constructor(cb: () => void) {
        notify = cb;
      }
      observe() {
        notify();
      }
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', FakeObserver);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 220, width: 400 } as DOMRect);
    render(<DataTable caption="T" columns={columns} data={data} pageSize="fit" />);
    const shown = bodyRows().length;
    expect(shown).toBeGreaterThanOrEqual(1);
    expect(shown).toBeLessThan(7);
    expect(screen.getByText(new RegExp(`Página 1 de ${Math.ceil(7 / shown)}`))).toBeTruthy();
  });
});
