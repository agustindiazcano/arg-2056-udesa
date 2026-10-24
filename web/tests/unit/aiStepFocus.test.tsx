// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': label }: { option?: object; 'aria-label'?: string }) => (
    <div role="img" aria-label={label} data-testid="echart" data-option={JSON.stringify(option)} />
  )
}));

import { AiStep } from '../../src/tour/AiStep.js';

const main = () => document.querySelector('.ai-main-card')!;
const side = () => document.querySelector('.ai-small')!;

describe('AiStep: the chart that is shown big', () => {
  afterEach(cleanup);

  it('starts with the real GDP big and the other two small', () => {
    render(<AiStep />);
    expect(main().textContent).toContain('PBI real de Argentina');
    expect(side().textContent).toContain('PBI per cápita');
    expect(side().textContent).toContain('Población');
  });

  it('swaps the chart that is clicked with the big one', () => {
    render(<AiStep />);
    fireEvent.click(screen.getByRole('button', { name: /Ver en grande: PBI per cápita/ }));
    expect(main().querySelector('strong')!.textContent).toContain('PBI per cápita');
    expect(side().textContent).toContain('PBI real de Argentina');
    expect(side().textContent).toContain('Población');
    expect(side().textContent).not.toContain('PBI per cápita');
  });

  it('can bring the population big and then go back', () => {
    render(<AiStep />);
    fireEvent.click(screen.getByRole('button', { name: /Ver en grande: Población/ }));
    expect(main().querySelector('strong')!.textContent).toContain('Población');
    fireEvent.click(screen.getByRole('button', { name: /Ver en grande: PBI real/ }));
    expect(main().querySelector('strong')!.textContent).toContain('PBI real de Argentina');
  });
});
