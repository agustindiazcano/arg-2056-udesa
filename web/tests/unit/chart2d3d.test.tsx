// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/three/Chart3D', () => ({
  default: ({ spec }: { spec: { title: string } }) => <div data-testid="chart3d">{`3D ${spec.title}`}</div>
}));

import { Chart2D3D } from '../../src/charts3d/Chart2D3D';
import { CapabilityProvider } from '../../src/runtime/CapabilityProvider';
import type { CapabilityEnv } from '../../src/runtime/capabilities';
import { useStore } from '../../src/state/store';
import type { Bars3DSpec } from '../../src/charts3d/types';

const spec: Bars3DSpec = { kind: 'bars', title: 'Ranking', unit: 'u', bars: [], summary: 's' };

const env = (webgl2: boolean): CapabilityEnv => ({
  createCanvas: () => ({ getContext: () => (webgl2 ? {} : null) }),
  navigator: { hardwareConcurrency: 8, deviceMemory: 8 }
});

beforeEach(() => useStore.setState({ mode: '3d' }));
afterEach(cleanup);

function renderIt(webgl2: boolean | null, s: Bars3DSpec | null = spec) {
  const tree = (
    <Chart2D3D spec={s ?? undefined}>
      <p>el gráfico plano</p>
    </Chart2D3D>
  );
  return render(webgl2 === null ? tree : <CapabilityProvider env={env(webgl2)} search="">{tree}</CapabilityProvider>);
}

describe('Chart2D3D', () => {
  // the first use of the lazy chunk: the poster shows while it loads (later uses find it already loaded)
  it('shows the poster while the 3D chunk loads, then the 3D chart instead of the flat one', async () => {
    renderIt(true);
    expect(screen.getByRole('status').textContent).toBe('Cargando la vista 3D...');
    await waitFor(() => expect(screen.getByTestId('chart3d').textContent).toBe('3D Ranking'));
    expect(screen.queryByText('el gráfico plano')).toBeNull();
  });

  it('shows the flat chart in 2D mode, even with WebGL2', () => {
    useStore.setState({ mode: '2d' });
    renderIt(true);
    expect(screen.getByText('el gráfico plano')).toBeTruthy();
    expect(screen.queryByTestId('chart3d')).toBeNull();
  });

  it('falls back to the flat chart without WebGL2', () => {
    renderIt(false);
    expect(screen.getByText('el gráfico plano')).toBeTruthy();
    expect(screen.queryByTestId('chart3d')).toBeNull();
  });

  it('falls back to the flat chart when there is no capability provider (the tests, the references page)', () => {
    renderIt(null);
    expect(screen.getByText('el gráfico plano')).toBeTruthy();
  });

  it('falls back to the flat chart when the view has no 3D version', () => {
    renderIt(true, null);
    expect(screen.getByText('el gráfico plano')).toBeTruthy();
  });

  it('follows the mode when it changes', async () => {
    renderIt(true);
    await waitFor(() => expect(screen.getByTestId('chart3d')).toBeTruthy());
    act(() => useStore.setState({ mode: '2d' }));
    expect(screen.getByText('el gráfico plano')).toBeTruthy();
    expect(screen.queryByTestId('chart3d')).toBeNull();
  });
});
