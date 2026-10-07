// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ 'aria-label': label }: { 'aria-label'?: string }) => <div role="img" aria-label={label} data-testid="echart" />
}));

import { WorldStep } from '../../src/tour/WorldStep';

afterEach(cleanup);

describe('step 0 of the Recorrido', () => {
  it('styles the Repetir button like the other buttons of the app', () => {
    render(<WorldStep />);
    const button = screen.getByRole('button', { name: 'Repetir' });
    expect(button.classList.contains('btn')).toBe(true);
  });
});
