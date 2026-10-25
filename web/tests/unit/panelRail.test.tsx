import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PanelRail, panelAttrs } from '../../src/tour/PanelRail';
import { isCompact } from '../../src/tour/compact';

const ITEMS = [
  { key: 'a', title: 'Evolución', icon: 'line' },
  { key: 'b', title: 'Ranking', icon: 'table' },
  { key: 'c', title: 'Región', icon: 'bars' }
] as const;

describe('isCompact', () => {
  it('is true on a short laptop screen', () => {
    expect(isCompact(1366, 768)).toBe(true);
    expect(isCompact(1536, 864)).toBe(false);
    expect(isCompact(1440, 820)).toBe(true);
  });
  it('is false on a tall screen and on a narrow one', () => {
    expect(isCompact(1440, 900)).toBe(false);
    expect(isCompact(900, 700)).toBe(false);
  });
});

describe('panelAttrs', () => {
  it('hides the panels that are not the chosen one, only in compact mode', () => {
    expect(panelAttrs(true, 'a', 'b')).toEqual({ 'data-panel': 'b', 'data-hidden': 'true' });
    expect(panelAttrs(true, 'a', 'a')).toEqual({ 'data-panel': 'a' });
    expect(panelAttrs(false, 'a', 'b')).toEqual({ 'data-panel': 'b' });
  });
});

describe('PanelRail', () => {
  it('renders nothing on a tall screen', () => {
    const { container } = render(<PanelRail compact={false} items={ITEMS} active="a" onPick={() => undefined} />);
    expect(container.childElementCount).toBe(0);
  });

  it('shows one button per panel with the title and marks the active one', () => {
    render(<PanelRail compact items={ITEMS} active="b" onPick={() => undefined} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Ranking' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Región' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('picks a panel on click', () => {
    const onPick = vi.fn();
    render(<PanelRail compact items={ITEMS} active="a" onPick={onPick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Región' }));
    expect(onPick).toHaveBeenCalledWith('c');
  });
});
