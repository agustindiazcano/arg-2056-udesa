// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../src/charts/EChart.js', () => ({
  EChart: ({ option, 'aria-label': label }: { option?: object; 'aria-label'?: string }) => (
    <div role="img" aria-label={label} data-testid="echart" data-option={JSON.stringify(option)} />
  )
}));

import { AiAccessStep } from '../../src/tour/AiAccessStep';
import { DraftSlide } from '../../src/tour/DraftSlide';
import { DRAFT_SLIDES } from '../../src/tour/draftSlides';
import { AI_ACCESS_TITLE } from '../../src/tour/slideTitles';

afterEach(cleanup);

describe('AiAccessStep', () => {
  it('shows the title and the 20 dollar plan first, with Argentina as the most expensive country', () => {
    render(<AiAccessStep />);
    expect(screen.getByRole('heading', { level: 2, name: AI_ACCESS_TITLE })).toBeDefined();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]!.textContent).toContain('Argentina');
    expect(rows[0]!.textContent).toContain('30,2 USD');
  });

  it('changes the table and the chart with the plan', () => {
    render(<AiAccessStep />);
    fireEvent.click(screen.getByRole('button', { name: 'Plan de 200 USD' }));
    expect(screen.getAllByRole('row')[1]!.textContent).toContain('302,0 USD');
    expect(screen.getByTestId('echart').getAttribute('aria-label')).toContain('plan de 200 usd');
  });
});

describe('the draft slides', () => {
  it.each(DRAFT_SLIDES.map((d) => [d.title, d] as const))('%s lists its topics under its title', (_title, def) => {
    render(<DraftSlide def={def} />);
    expect(screen.getByRole('heading', { level: 2, name: def.title })).toBeDefined();
    for (const t of def.topics) expect(screen.getByText(t.heading)).toBeDefined();
  });
});
