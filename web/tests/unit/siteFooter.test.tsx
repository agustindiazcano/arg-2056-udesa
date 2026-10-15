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

  it('has no Fuentes or Metodología buttons', () => {
    render(<SiteFooter />);
    expect(screen.queryByRole('link', { name: 'Fuentes' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Metodología' })).toBeNull();
  });

  it('is a footer landmark', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });
});
