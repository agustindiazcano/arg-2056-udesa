// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TabbedChart } from '../../src/ui/TabbedChart';

afterEach(cleanup);

const tabs = (spy = vi.fn()) => [
  { id: 'a', label: 'Minería', render: () => { spy('a'); return <p>panel a</p>; } },
  { id: 'b', label: 'Hidrocarburos', render: () => { spy('b'); return <p>panel b</p>; } },
  { id: 'c', label: 'Agro', render: () => <p>panel c</p> }
];

describe('the tabbed chart', () => {
  it('shows the first tab and builds only the panel that is open', () => {
    const spy = vi.fn();
    render(<TabbedChart label="Recursos" tabs={tabs(spy)} />);
    expect(screen.getByRole('tablist', { name: 'Recursos' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Minería' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toBe('panel a');
    expect(spy).not.toHaveBeenCalledWith('b');
  });

  it('opens a tab on click and links the tab to its panel', () => {
    render(<TabbedChart label="Recursos" tabs={tabs()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Hidrocarburos' }));
    const tab = screen.getByRole('tab', { name: 'Hidrocarburos' });
    expect(tab.getAttribute('aria-selected')).toBe('true');
    const panel = screen.getByRole('tabpanel');
    expect(panel.textContent).toBe('panel b');
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
  });

  it('moves with the arrow keys, wraps around and keeps one tab in the tab order', () => {
    render(<TabbedChart label="Recursos" tabs={tabs()} />);
    const first = screen.getByRole('tab', { name: 'Minería' });
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(screen.getByRole('tab', { name: 'Agro' }).getAttribute('tabindex')).toBe('-1');
    fireEvent.keyDown(first, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'Agro' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Agro' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Minería' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Minería' }), { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Agro' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Agro' }), { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Minería' }).getAttribute('aria-selected')).toBe('true');
  });

  it('works controlled and reports the change', () => {
    const onChange = vi.fn();
    render(<TabbedChart label="Recursos" tabs={tabs()} value="c" onChange={onChange} />);
    expect(screen.getByRole('tabpanel').textContent).toBe('panel c');
    fireEvent.click(screen.getByRole('tab', { name: 'Minería' }));
    expect(onChange).toHaveBeenCalledWith('a');
    expect(screen.getByRole('tabpanel').textContent).toBe('panel c');
  });
});
