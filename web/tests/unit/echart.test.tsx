// @vitest-environment jsdom
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EChart } from '../../src/charts/EChart.js';

// Mock the tree-shaken echarts module
const { mockInit, mockSetOption, mockResize, mockDispose, mockOn, mockGetOption } = vi.hoisted(() => {
  const mockSetOption = vi.fn();
  const mockResize = vi.fn();
  const mockDispose = vi.fn();
  const mockOn = vi.fn();
  const mockGetOption = vi.fn(() => ({}) as unknown);
  const mockInit = vi.fn(() => ({
    getOption: mockGetOption,
    setOption: mockSetOption,
    resize: mockResize,
    dispose: mockDispose,
    on: mockOn,
  }));
  return { mockInit, mockSetOption, mockResize, mockDispose, mockOn, mockGetOption };
});

vi.mock('../../src/charts/echarts.js', () => ({
  init: mockInit,
}));

describe('EChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes echarts, calls setOption, and disposes on unmount', () => {
    const option = { title: { text: 'Test' } };
    
    const { unmount } = render(<EChart option={option} />);
    
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockSetOption).toHaveBeenCalledWith(expect.objectContaining({ title: { text: 'Test' } }), true);

    unmount();
    
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it('draws the series in over 600 ms and updates without delay, whatever the builder said', () => {
    render(<EChart option={{ animation: false }} />);
    expect(mockSetOption).toHaveBeenCalledWith(
      expect.objectContaining({ animation: true, animationDuration: 600, animationDurationUpdate: 0 }),
      true
    );
  });

  it('resizes on window resize', () => {
    render(<EChart option={{}} />);
    
    window.dispatchEvent(new Event('resize'));
    expect(mockResize).toHaveBeenCalled();
  });

  it('registers one click handler that calls the latest onClick prop with the event params', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<EChart option={{}} onClick={first} />);

    expect(mockOn).toHaveBeenCalledTimes(1);
    expect(mockOn.mock.calls[0]![0]).toBe('click');
    const handler = mockOn.mock.calls[0]![1] as (params: unknown) => void;

    handler({ name: 'AR-A' });
    expect(first).toHaveBeenCalledWith({ name: 'AR-A' });

    rerender(<EChart option={{}} onClick={second} />);
    expect(mockOn).toHaveBeenCalledTimes(1); // not registered again
    handler({ name: 'AR-B' });
    expect(second).toHaveBeenCalledWith({ name: 'AR-B' });
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('does not fail when a click happens and there is no onClick prop', () => {
    render(<EChart option={{}} />);
    const handler = mockOn.mock.calls[0]![1] as (params: unknown) => void;
    expect(() => handler({ name: 'AR-A' })).not.toThrow();
  });

  describe('with a roamable map', () => {
    const bbox: [number, number, number, number] = [-70, -50, -50, -30];

    it('clamps the centre after a roam so that the territory stays in the frame', () => {
      mockGetOption.mockReturnValue({ geo: [{ zoom: 2, center: [-100, -100] }] });
      render(<EChart option={{ geo: {} }} roam={{ bbox }} />);
      const roamCall = mockOn.mock.calls.find((c) => c[0] === 'georoam')!;
      (roamCall[1] as () => void)();
      expect(mockSetOption).toHaveBeenLastCalledWith({ geo: { center: [-65, -45] } });
    });

    it('does not touch the chart when the centre is already inside', () => {
      mockGetOption.mockReturnValue({ geo: [{ zoom: 2, center: [-62, -41] }] });
      render(<EChart option={{ geo: {} }} roam={{ bbox }} />);
      mockSetOption.mockClear();
      (mockOn.mock.calls.find((c) => c[0] === 'georoam')![1] as () => void)();
      expect(mockSetOption).not.toHaveBeenCalled();
    });

    it('keeps the zoom and the centre when the option changes (the year, a filter)', () => {
      mockGetOption.mockReturnValue({ geo: [{ zoom: 3, center: [-60, -40] }] });
      const { rerender } = render(<EChart option={{ geo: { a: 1 } }} roam={{ bbox }} />);
      mockSetOption.mockClear();
      rerender(<EChart option={{ geo: { a: 2 } }} roam={{ bbox }} />);
      expect(mockSetOption).toHaveBeenCalledWith(
        expect.objectContaining({ geo: expect.objectContaining({ a: 2, zoom: 3, center: [-60, -40] }) }),
        true
      );
    });

    it('does not fail when the chart has no option yet (getOption returns undefined on the first draw)', () => {
      mockGetOption.mockReturnValue(undefined);
      expect(() => render(<EChart option={{ geo: { a: 1 } }} roam={{ bbox }} />)).not.toThrow();
      expect(mockSetOption).toHaveBeenCalled();
    });

    it('starts from the option as it is when nothing was zoomed yet', () => {
      mockGetOption.mockReturnValue({ geo: [{ zoom: 1 }] });
      render(<EChart option={{ geo: { a: 1 } }} roam={{ bbox }} />);
      const arg = mockSetOption.mock.calls.at(-1)![0] as { geo: Record<string, unknown> };
      expect(arg.geo.zoom).toBeUndefined();
      expect(arg.geo.center).toBeUndefined();
    });

    it('gives the chart instance to the caller and takes it back on unmount', () => {
      const ref = { current: null as unknown };
      const { unmount } = render(<EChart option={{}} roam={{ bbox }} apiRef={ref as never} />);
      expect(ref.current).not.toBeNull();
      unmount();
      expect(ref.current).toBeNull();
    });
  });
});
