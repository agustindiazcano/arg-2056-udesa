// @vitest-environment jsdom
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EChart } from '../../src/charts/EChart.js';

// Mock echarts
const { mockInit, mockSetOption, mockResize, mockDispose } = vi.hoisted(() => {
  const mockSetOption = vi.fn();
  const mockResize = vi.fn();
  const mockDispose = vi.fn();
  const mockInit = vi.fn(() => ({
    setOption: mockSetOption,
    resize: mockResize,
    dispose: mockDispose,
  }));
  return { mockInit, mockSetOption, mockResize, mockDispose };
});

vi.mock('echarts', () => ({
  init: mockInit,
}));

describe('EChart', () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container) {
      unmountComponentAtNode(container);
      container.remove();
      container = null;
    }
  });

  it('initializes echarts, calls setOption, and disposes on unmount', () => {
    const option = { title: { text: 'Test' } };
    
    // eslint-disable-next-line react/no-deprecated
    const { unmount } = render(<EChart option={option} />);
    
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockSetOption).toHaveBeenCalledWith(option, true);
    
    
    
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it('resizes on window resize', () => {
    // eslint-disable-next-line react/no-deprecated
    const { unmount } = render(<EChart option={{}} />);
    
    window.dispatchEvent(new Event('resize'));
    expect(mockResize).toHaveBeenCalled();
  });
});
