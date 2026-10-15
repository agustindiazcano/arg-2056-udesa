// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { YearSelector } from '../../src/ui/YearSelector';

afterEach(cleanup);

const years = [2022, 2023, 2024, 2025];

describe('the year selector', () => {
  it('shows every year and presses the current one', () => {
    render(<YearSelector label="Año" years={years} value={2025} onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Año' })).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByRole('button', { name: '2025' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('disables the years with no data and never selects them', () => {
    const onChange = vi.fn();
    render(<YearSelector label="Año" years={years} available={[2024, 2025]} value={2025} onChange={onChange} />);
    const off = screen.getByRole('button', { name: '2022' }) as HTMLButtonElement;
    expect(off.disabled).toBe(true);
    expect(off.getAttribute('title')).toBe('Sin datos');
    fireEvent.click(off);
    fireEvent.click(screen.getByRole('button', { name: '2024' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2024);
  });

  it('steps through the available years with the arrow keys and stops at the ends', () => {
    const onChange = vi.fn();
    render(<YearSelector label="Año" years={years} available={[2022, 2024, 2025]} value={2022} onChange={onChange} />);
    const group = screen.getByRole('button', { name: '2022' });
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(2024);
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(group, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith(2025);
  });

  it('shows nothing selected when the value is outside the years', () => {
    render(<YearSelector label="Año" years={years} value={1999} onChange={() => {}} />);
    expect(screen.getAllByRole('button').every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true);
  });
});
