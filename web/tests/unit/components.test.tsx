// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TabBar } from '../../src/app/TabBar';
import { ProvinceFilter } from '../../src/app/ProvinceFilter';
import { MockBadge } from '../../src/app/MockBadge';
import { useStore } from '../../src/state/store';

describe('UI Components', () => {
  beforeEach(() => {
    useStore.setState({ 
      scene: 'andes', 
      provinceFilterOpen: false, 
      province: null 
    });
  });

  describe('TabBar', () => {
    it('renders six tabs in order, aria-selected follows store, click changes scene', () => {
      render(<TabBar />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(6);
      
      // Check order and initial selected
      expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
      expect(tabs[1]!.getAttribute('aria-selected')).toBe('false');
      
      // Click economy tab
      fireEvent.click(tabs[1]!);
      
      expect(useStore.getState().scene).toBe('economy');
      // TabBar should re-render and update aria-selected
      expect(tabs[0]!.getAttribute('aria-selected')).toBe('false');
      expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('ProvinceFilter', () => {
    it('P opens it, choosing sets it and closes', async () => {
      render(<ProvinceFilter />);
      expect(screen.queryByRole('dialog')).toBeNull();
      
      useStore.setState({ provinceFilterOpen: true });
      
      const buttons = await screen.findAllByRole('button');
      expect(buttons.length).toBe(25); // 24 provinces + "All"
      
      fireEvent.click(buttons[1]!); // Click first province (CABA, typically)
      
      const state = useStore.getState();
      expect(state.provinceFilterOpen).toBe(false);
      expect(state.province).not.toBeNull();
    });
  });

  describe('MockBadge', () => {
    it('visible for source: MOCK, absent for argmodel@0.1.0', () => {
      const { rerender } = render(<MockBadge source="MOCK" />);
      expect(screen.queryByText('Datos ilustrativos')).not.toBeNull();
      
      rerender(<MockBadge source="argmodel@0.1.0" />);
      expect(screen.queryByText('Datos ilustrativos')).toBeNull();
    });
  });
});
