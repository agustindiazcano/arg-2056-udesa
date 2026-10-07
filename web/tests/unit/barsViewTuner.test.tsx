// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_BARS_VIEW } from '../../src/charts3d/followAnim';
import { BarsViewTuner } from '../../src/tour/BarsViewTuner';

afterEach(cleanup);

describe('the tuner of the view of the region bars', () => {
  it('shows the numbers of the camera in degrees and in times of the whole chart', () => {
    render(<BarsViewTuner view={DEFAULT_BARS_VIEW} onChange={() => undefined} onReset={() => undefined} />);
    expect((screen.getByLabelText('Giro horizontal (°)') as HTMLInputElement).value).toBe(String(Math.round((DEFAULT_BARS_VIEW.theta * 180) / Math.PI)));
    expect((screen.getByLabelText('Inclinación (°)') as HTMLInputElement).value).toBe(String(Math.round((DEFAULT_BARS_VIEW.phi * 180) / Math.PI)));
    expect((screen.getByLabelText('Distancia cerca (×)') as HTMLInputElement).value).toBe(String(DEFAULT_BARS_VIEW.near));
    expect((screen.getByLabelText('Distancia final (×)') as HTMLInputElement).value).toBe(String(DEFAULT_BARS_VIEW.end));
    expect((screen.getByLabelText('Altura (±)') as HTMLInputElement).value).toBe(String(DEFAULT_BARS_VIEW.height));
    expect((screen.getByLabelText('Lente (°)') as HTMLInputElement).value).toBe(String(DEFAULT_BARS_VIEW.fov));
  });

  it('reports a change with the angles in radians, and resets', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    render(<BarsViewTuner view={DEFAULT_BARS_VIEW} onChange={onChange} onReset={onReset} />);
    fireEvent.change(screen.getByLabelText('Inclinación (°)'), { target: { value: '90' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_BARS_VIEW, phi: Math.PI / 2 });
    fireEvent.change(screen.getByLabelText('Distancia cerca (×)'), { target: { value: '0.3' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_BARS_VIEW, near: 0.3 });
    fireEvent.click(screen.getByRole('button', { name: 'Valores originales' }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('writes the numbers in one line to read them out', () => {
    render(<BarsViewTuner view={{ ...DEFAULT_BARS_VIEW, near: 0.3 }} onChange={() => undefined} onReset={() => undefined} />);
    expect(screen.getByTestId('tuner-readout').textContent).toMatch(/cerca 0\.3/);
  });
});
