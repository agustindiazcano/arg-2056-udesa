// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('@vercel/analytics/react', () => ({ Analytics: () => <i data-testid="analytics" /> }));
vi.mock('@vercel/speed-insights/react', () => ({ SpeedInsights: () => <i data-testid="speed" /> }));

import { VercelMetrics } from '../../src/runtime/VercelMetrics';
import config from '../../vite.config';

afterEach(cleanup);

describe('VercelMetrics', () => {
  it('renders the visit counter and the speed insights when enabled', () => {
    const { getByTestId } = render(<VercelMetrics enabled />);
    expect(getByTestId('analytics')).toBeTruthy();
    expect(getByTestId('speed')).toBeTruthy();
  });

  it('renders nothing when disabled, so no request to /_vercel leaves a local or e2e run', () => {
    const { container } = render(<VercelMetrics enabled={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('is disabled by default outside a Vercel build', () => {
    const { container } = render(<VercelMetrics />);
    expect(container.innerHTML).toBe('');
  });
});

describe('vite config', () => {
  it('defines the Vercel flag from the VERCEL build variable', () => {
    expect(config.define?.['import.meta.env.VITE_ON_VERCEL']).toBe(JSON.stringify(process.env.VERCEL === '1'));
  });
});
