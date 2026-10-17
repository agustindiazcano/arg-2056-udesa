// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { SectionTabs } from '../../src/app/TabBar';
import { menuItems } from '../../src/tour/menuItems';
import { INDEX_STEP, TOUR_ORDER } from '../../src/tour/chartSteps';
import { useStore } from '../../src/state/store';

const initial = useStore.getState();

beforeEach(() => {
  useStore.setState({ ...initial, section: 'andes', tourStep: INDEX_STEP }, true);
});
afterEach(cleanup);

describe('menuItems', () => {
  it('lists slide 0 as «Índice» first and then every other slide in the order of the Recorrido', () => {
    const items = menuItems();
    expect(items).toHaveLength(TOUR_ORDER.length);
    expect(items[0]).toEqual({ id: INDEX_STEP, number: 0, title: 'Índice' });
    expect(items.map((i) => i.id)).toEqual([...TOUR_ORDER]);
    expect(items.map((i) => i.number)).toEqual(items.map((_, n) => n));
  });
});

describe('Hacia el 2056 dropdown menu', () => {
  const tab = () => screen.getByRole('tab', { name: 'Hacia el 2056' });
  const wrap = () => tab().closest('.tour-menu') as HTMLElement;

  it('takes the titles from the light module, so the main chunk does not load the charts of the Recorrido', async () => {
    const fs = await import('node:fs');
    const source = fs.readFileSync('src/app/TourMenu.tsx', 'utf8');
    expect(source).toMatch(/from '\.\.\/tour\/menuItems'/);
    expect(source).not.toMatch(/tour\/indexData/);
    const titles = fs.readFileSync('src/tour/slideTitles.ts', 'utf8');
    expect(titles).not.toMatch(/worldData/);
  });

  it('keeps the tab name and shows a chevron icon so it reads as clickable', () => {
    render(<SectionTabs />);
    expect(tab().querySelector('svg.tour-menu-chevron')).toBeTruthy();
    expect(tab().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens on hover with the list of slides, slide 0 as «Índice», and closes when the pointer leaves', () => {
    render(<SectionTabs />);
    fireEvent.mouseEnter(wrap());
    const menu = await screen.findByRole('menu', { name: 'Diapositivas' });
    const items = within(menu).getAllByRole('menuitem');
    expect(items).toHaveLength(TOUR_ORDER.length);
    expect(items[0]!.textContent).toBe('0 · Índice');
    expect(tab().getAttribute('aria-expanded')).toBe('true');
    fireEvent.mouseLeave(wrap());
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens with the Down arrow on the tab (not with the focus, so Tab walks the page) and closes with Escape', () => {
    render(<SectionTabs />);
    fireEvent.keyDown(tab(), { key: 'ArrowDown' });
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.keyDown(wrap(), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('a click on the tab opens the Recorrido and pins the menu (touch has no hover); a second click closes it', () => {
    render(<SectionTabs />);
    fireEvent.click(tab());
    expect(useStore.getState().section).toBe('tour');
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.click(tab());
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('choosing a slide goes to the Recorrido at that slide and closes the menu', () => {
    render(<SectionTabs />);
    fireEvent.mouseEnter(wrap());
    const target = TOUR_ORDER[3]!;
    fireEvent.click(within(screen.getByRole('menu')).getAllByRole('menuitem')[3]!);
    expect(useStore.getState().section).toBe('tour');
    expect(useStore.getState().tourStep).toBe(target);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('marks the slide being shown as the current one', () => {
    useStore.setState({ section: 'tour', tourStep: TOUR_ORDER[2]! });
    render(<SectionTabs />);
    fireEvent.mouseEnter(wrap());
    const current = within(screen.getByRole('menu')).getAllByRole('menuitem').filter((i) => i.getAttribute('aria-current') === 'step');
    expect(current).toHaveLength(1);
    expect(current[0]!.textContent?.startsWith('2 · ')).toBe(true);
  });
});
