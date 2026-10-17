// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MapSearch } from '../../src/ui/MapSearch.js';

afterEach(() => {
  cleanup();
});

describe('MapSearch UI component (C5: map-search)', () => {
  it('renders search input with placeholder', () => {
    render(<MapSearch onSelect={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeDefined();
    expect(screen.getByPlaceholderText(/buscar provincia o departamento/i)).toBeDefined();
  });

  it('shows dropdown results when typing and selects on click', () => {
    const handleSelect = vi.fn();
    render(<MapSearch onSelect={handleSelect} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Salta' } });

    // Should display Salta province result
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]?.textContent).toContain('Salta');

    // Click result
    fireEvent.click(options[0]!);
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Salta', type: 'provincia', provinceId: 'AR-A' })
    );
  });

  it('navigates with keyboard arrows, selects with Enter, and closes with Esc', () => {
    const handleSelect = vi.fn();
    render(<MapSearch onSelect={handleSelect} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Los Andes' } });

    // Arrow down
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Press Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Los Andes', type: 'departamento', provinceId: 'AR-A' })
    );

    // Escape closes results
    fireEvent.change(input, { target: { value: 'San' } });
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('option')).toBeNull();
  });
});
