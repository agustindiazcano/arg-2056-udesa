// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { SHOW_DASHBOARD_KEY, visibleSections } from '../../src/content/sectionLabels';
import { SECTIONS } from '../../src/types/scene';

afterEach(() => window.localStorage.clear());

describe('visibleSections', () => {
  it('hides the deprecated Data Dashboard by default, keeping the order of the others', () => {
    expect(visibleSections(SECTIONS)).toEqual(SECTIONS.filter((s) => s !== 'dashboard'));
    expect(visibleSections(SECTIONS)).toEqual(['andes', 'tour']);
  });

  it('shows it again when the flag is set (the end-to-end tests and the developers still reach it)', () => {
    window.localStorage.setItem(SHOW_DASHBOARD_KEY, '1');
    expect(visibleSections(SECTIONS)).toEqual([...SECTIONS]);
  });

  it('survives a browser without storage', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    Object.defineProperty(window, 'localStorage', { get: () => { throw new Error('blocked'); }, configurable: true });
    try {
      expect(visibleSections(SECTIONS)).toEqual(['andes', 'tour']);
    } finally {
      Object.defineProperty(window, 'localStorage', original);
    }
  });
});
