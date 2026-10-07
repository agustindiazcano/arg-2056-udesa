// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TabBar } from '../../src/app/TabBar';
import { ProvinceFilter } from '../../src/app/ProvinceFilter';
import { useStore } from '../../src/state/store';
import { SHOW_DASHBOARD_KEY } from '../../src/content/sectionLabels';

describe('UI Components', () => {
  beforeEach(() => {
    window.localStorage.setItem(SHOW_DASHBOARD_KEY, '1'); // the Data Dashboard is deprecated: hidden unless switched on
    useStore.setState({ 
      scene: 'andes', 
      provinceFilterOpen: false, 
      province: null 
    });
  });

  describe('TabBar', () => {
    it('does not offer the deprecated Data Dashboard unless it is switched on', () => {
      window.localStorage.removeItem(SHOW_DASHBOARD_KEY);
      const { unmount } = render(<TabBar />);
      expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Andes', 'Recorrido']);
      unmount();
    });

    it('renders three section tabs in order, aria-selected follows store, click changes section', () => {
      render(<TabBar />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
      expect(tabs[1]!.getAttribute('aria-selected')).toBe('false');

      // Click Data Dashboard: it opens the first data scene and shows the five scene tabs
      fireEvent.click(tabs[1]!);
      expect(useStore.getState()).toMatchObject({ section: 'dashboard', scene: 'economy' });
      expect(tabs[0]!.getAttribute('aria-selected')).toBe('false');
      expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
      expect(screen.getAllByRole('tab')).toHaveLength(8);
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
});
