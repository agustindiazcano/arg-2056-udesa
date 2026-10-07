// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCameraNav } from '../../src/three/useCameraNav';

describe('useCameraNav', () => {
  it('gives the 3D charts only the zoom and reset handlers, and the Andes all of them with the presets', () => {
    const { result } = renderHook(() => useCameraNav());
    expect(Object.keys(result.current.chartControls).sort()).toEqual(['onReset', 'onZoomIn', 'onZoomOut']);
    expect(Object.keys(result.current.controls).sort()).toEqual(['onPreset', 'onReset', 'onZoomIn', 'onZoomOut']);
  });
});
