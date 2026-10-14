// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MetricToggle } from '../../src/ui/MetricToggle';

afterEach(cleanup);

const options = [
  { value: 'gdp', label: 'PBI' },
  { value: 'percapita', label: 'PBI per cápita' },
  { value: 'population', label: 'Población', disabled: true, hint: 'Sin datos para este período' }
] as const;

describe('the metric toggle', () => {
  it('is a group with one pressed button', () => {
    render(<MetricToggle label="Dato" options={options} value="percapita" onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Dato' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'PBI per cápita' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'PBI' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('reports the metric that was chosen', () => {
    const onChange = vi.fn();
    render(<MetricToggle label="Dato" options={options} value="gdp" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'PBI per cápita' }));
    expect(onChange).toHaveBeenCalledWith('percapita');
  });

  it('disables a metric with no data, explains why and never selects it', () => {
    const onChange = vi.fn();
    render(<MetricToggle label="Dato" options={options} value="gdp" onChange={onChange} />);
    const off = screen.getByRole('button', { name: 'Población' }) as HTMLButtonElement;
    expect(off.disabled).toBe(true);
    expect(off.getAttribute('title')).toBe('Sin datos para este período');
    fireEvent.click(off);
    expect(onChange).not.toHaveBeenCalled();
  });
});
