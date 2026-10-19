// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

vi.mock('../../src/runtime/useReducedMotion.js', () => ({
  useReducedMotion: () => true
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { milestones } from '../../src/charts/builders/milestones.js';
import { AiStep } from '../../src/tour/AiStep.js';

describe('milestones with baseValue', () => {
  it('calculates milestones based on first value by default', () => {
    const years = [2026, 2030, 2040];
    const values = [100, 150, 250];
    const res = milestones(years, values);
    expect(res).toHaveLength(1);
    expect(res[0]!.multiple).toBe(2);
    expect(res[0]!.year).toBe(2040);
  });

  it('calculates milestones based on explicit baseValue', () => {
    const years = [1960, 2026, 2040];
    const values = [50, 100, 250];
    // baseValue is 100 (2026 value), so x2 requires 200, reached in 2040
    const res = milestones(years, values, [2, 3, 4], 100);
    expect(res).toHaveLength(1);
    expect(res[0]!.multiple).toBe(2);
    expect(res[0]!.year).toBe(2040);
  });
});

describe('AiStep 1960 mode toggle', () => {
  it('has a button to toggle between normal mode and 1960 mode', () => {
    render(<AiStep />);
    const toggle = screen.getByRole('button', { name: 'Ver desde 1960' });
    expect(toggle).toBeDefined();

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Ver desde 2026' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Ver desde 2026' }));
    expect(screen.getByRole('button', { name: 'Ver desde 1960' })).toBeDefined();
  });
});
