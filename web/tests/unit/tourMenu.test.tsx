// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { SectionTabs } from '../../src/app/TabBar';
import { menuItems } from '../../src/tour/indexData';
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

  it('does not load the titles of the slides until the menu opens (they belong to the lazy chunk of the Recorrido)', async () => {
    const fs = await import('node:fs');
    const source = fs.readFileSync('src/app/TourMenu.tsx', 'utf8');
    expect(source).not.toMatch(/import \{[^}]*\} from '\.\.\/tour\/indexData'/);
    expect(source).toMatch(/import\('\.\.\/tour\/indexData'\)/);
  });

  it('keeps the tab name and shows a chevron icon so it reads as clickable', () => {
    render(<SectionTabs />);
    expect(tab().querySelector('svg.tour-menu-chevron')).toBeTruthy();
    expect(tab().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens on hover with the list of slides, slide 0 as «Índice», and closes when the pointer leaves', async () => {
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

  it('opens with the keyboard focus too and closes with Escape', async () => {
    render(<SectionTabs />);
    fireEvent.focus(tab());
    expect(await screen.findByRole('menu')).toBeTruthy();
    fireEvent.keyDown(wrap(), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('a click on the tab opens the Recorrido and pins the menu (touch has no hover); a second click closes it', async () => {
    render(<SectionTabs />);
    fireEvent.click(tab());
    expect(useStore.getState().section).toBe('tour');
    expect(await screen.findByRole('menu')).toBeTruthy();
    fireEvent.click(tab());
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('choosing a slide goes to the Recorrido at that slide and closes the menu', async () => {
    render(<SectionTabs />);
    fireEvent.mouseEnter(wrap());
    const target = TOUR_ORDER[3]!;
    fireEvent.click(within(await screen.findByRole('menu')).getAllByRole('menuitem')[3]!);
    expect(useStore.getState().section).toBe('tour');
    expect(useStore.getState().tourStep).toBe(target);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('marks the slide being shown as the current one', async () => {
    useStore.setState({ section: 'tour', tourStep: TOUR_ORDER[2]! });
    render(<SectionTabs />);
    fireEvent.mouseEnter(wrap());
    const current = within(await screen.findByRole('menu')).getAllByRole('menuitem').filter((i) => i.getAttribute('aria-current') === 'step');
    expect(current).toHaveLength(1);
    expect(current[0]!.textContent?.startsWith('2 · ')).toBe(true);
  });
});
