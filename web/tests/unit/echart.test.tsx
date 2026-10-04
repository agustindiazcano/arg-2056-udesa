// @vitest-environment jsdom
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EChart } from '../../src/charts/EChart.js';

// Mock the tree-shaken echarts module
const { mockInit, mockSetOption, mockResize, mockDispose, mockOn } = vi.hoisted(() => {
  const mockSetOption = vi.fn();
  const mockResize = vi.fn();
  const mockDispose = vi.fn();
  const mockOn = vi.fn();
  const mockInit = vi.fn(() => ({
    setOption: mockSetOption,
    resize: mockResize,
    dispose: mockDispose,
    on: mockOn,
  }));
  return { mockInit, mockSetOption, mockResize, mockDispose, mockOn };
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
});

