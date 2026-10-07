// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/runtime/CapabilityProvider', () => ({
  useQualityOptional: () => ({ caps: { webgl2: true }, tier: 'medium' })
}));
// the 3D chunk never arrives: the fallback is what is on screen
vi.mock('../../src/tour3d/TourChart3D', () => new Promise(() => undefined));

import { Spinner } from '../../src/ui/Spinner';
import { TourChart } from '../../src/tour/TourChart';
import { useStore } from '../../src/state/store';
import type { Chart3DSpec } from '../../src/charts3d/types';

afterEach(cleanup);

describe('Spinner', () => {
  it('is an animated ring with a status text for the screen readers', () => {
    const { container } = render(<Spinner label="Cargando el gráfico" />);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Cargando el gráfico');
    expect(container.querySelector('.spinner-ring')).toBeTruthy();
  });
});

describe('the charts of the Recorrido while they load', () => {
  it('show the spinner, not a bare text, while the 3D chunk arrives', () => {
    useStore.setState({ mode: '3d' });
    const { container } = render(
      <TourChart spec={{ kind: 'bars' } as unknown as Chart3DSpec}>
        <p>plano</p>
      </TourChart>
    );
    expect(container.querySelector('.spinner-ring')).toBeTruthy();
  });
});
