// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/three/Map3D', () => ({ Map3D: (p: { free?: boolean }) => <div data-testid="map3d" data-free={String(p.free)} /> }));
vi.mock('../../src/three/Bars3D', () => ({ Bars3D: (p: { free?: boolean }) => <div data-testid="bars3d" data-free={String(p.free)} /> }));
vi.mock('../../src/three/Lines3D', () => ({ Lines3D: () => <div data-testid="lines3d" /> }));

import TourChart3D from '../../src/tour3d/TourChart3D';
import type { Chart3DSpec } from '../../src/charts3d/types';

afterEach(cleanup);

const spec = (kind: string) => ({ kind }) as unknown as Chart3DSpec;

describe('the 3D of the Recorrido', () => {
  it('draws the bars and the map with the camera of the Data Dashboard, which works, not with a special mode', () => {
    render(<TourChart3D spec={spec('bars')} />);
    expect(screen.getByTestId('bars3d').getAttribute('data-free')).toBe('true');
    cleanup();
    render(<TourChart3D spec={spec('map')} />);
    expect(screen.getByTestId('map3d').getAttribute('data-free')).toBe('true');
  });

  it('keeps the lines as they are', () => {
    render(<TourChart3D spec={spec('lines')} />);
    expect(screen.getByTestId('lines3d')).toBeTruthy();
  });
});
