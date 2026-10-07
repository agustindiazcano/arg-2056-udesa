// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteFooter } from '../../src/app/SiteFooter';
import { INSTITUTIONS } from '../../src/ui/institutions';

afterEach(cleanup);

describe('SiteFooter', () => {
  it('shows the four logos, each a link that opens in a new tab', () => {
    render(<SiteFooter />);
    const logos = within(screen.getByRole('list', { name: 'Instituciones' })).getAllByRole('link');
    expect(logos).toHaveLength(4);
    expect(logos.map((a) => a.getAttribute('href'))).toEqual(INSTITUTIONS.map((i) => i.href));
    for (const a of logos) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toBe('noopener noreferrer');
      expect(a.querySelector('img')?.getAttribute('alt')).toBeTruthy();
    }
  });

  it('has the buttons Fuentes and Metodología under the logos, going to the references page', () => {
    render(<SiteFooter />);
    const nav = within(screen.getByRole('navigation', { name: 'Fuentes y metodología' }));
    expect(nav.getByRole('link', { name: 'Fuentes' }).getAttribute('href')).toBe('references.html');
    expect(nav.getByRole('link', { name: 'Metodología' }).getAttribute('href')).toBe('references.html#metodologia');
  });

  it('is a footer landmark', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });
});
