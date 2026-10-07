// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TourStep } from '../../src/tour/TourStep';

afterEach(cleanup);

describe('the test slide of the Recorrido', () => {
  it('is the only slide: any step shows the map and the bars on their own, with the event counters', () => {
    for (const step of [0, 2, 7]) {
      const { unmount } = render(<TourStep step={step} />);
      expect(screen.getByRole('heading', { name: /prueba 3d/i })).toBeTruthy();
      expect(screen.getByTestId('lab-probe').textContent).toMatch(/rueda: 0/);
      unmount();
    }
  });
});
