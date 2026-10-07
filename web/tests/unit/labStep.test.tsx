// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/runtime/CapabilityProvider', () => ({
  useQualityOptional: () => ({ caps: { webgl2: true }, tier: 'medium' })
}));
vi.mock('../../src/scenes/forecast/ProvinceMap', () => ({
  useProvinces: () => ({ status: 'success', geo: { type: 'FeatureCollection', features: [] } })
}));
vi.mock('../../src/three/Map3D', () => ({ Map3D: (p: { free?: boolean }) => <div data-testid="map3d" data-free={String(p.free)} /> }));
vi.mock('../../src/three/Bars3D', () => ({ Bars3D: (p: { free?: boolean }) => <div data-testid="bars3d" data-free={String(p.free)} /> }));

import { TourStep } from '../../src/tour/TourStep';

afterEach(cleanup);

describe('the test slide of the Recorrido', () => {
  it('is the only slide: any step shows the navigable map and bars, with the event counters', async () => {
    for (const step of [0, 2, 7]) {
      const { unmount } = render(<TourStep step={step} />);
      expect(screen.getByRole('heading', { name: /prueba 3d/i })).toBeTruthy();
      expect(screen.getByTestId('lab-probe').textContent).toMatch(/rueda: 0/);
      // the same views as the Data Dashboard: free camera, not the fixed side view of the Recorrido
      expect((await screen.findByTestId('map3d')).getAttribute('data-free')).toBe('true');
      expect((await screen.findByTestId('bars3d')).getAttribute('data-free')).toBe('true');
      unmount();
    }
  });
});
