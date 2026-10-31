// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { SlideReferences } from '../../src/ui/SlideReferences';
import { RefList, refNumber } from '../../src/ui/RefLink';
import { ChartHelp } from '../../src/ui/ChartHelp';

afterEach(cleanup);

describe('slide references', () => {
  it('collects and deduplicates sources, including closed chart help, and restores focus on Escape', () => {
    render(<SlideReferences><RefList ids={['F1', 'W5']} /><ChartHelp title="Ayuda" paragraphs={[]} refs={['F1']} /></SlideReferences>);
    const button = screen.getByRole('button', { name: 'Referencias' });
    fireEvent.click(button);
    const dialog = screen.getByRole('dialog', { name: 'Referencias' });
    expect(within(dialog).getAllByText(`[${refNumber('F1')}]`)).toHaveLength(1);
    expect(within(dialog).getByRole('link', { name: /FMI/ }).getAttribute('href')).toContain('imf.org');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('updates the list when a dynamic source changes', () => {
    const { rerender } = render(<SlideReferences><RefList ids={['F1']} /></SlideReferences>);
    rerender(<SlideReferences><RefList ids={['W5']} /></SlideReferences>);
    fireEvent.click(screen.getByRole('button', { name: 'Referencias' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByText(`[${refNumber('F1')}]`)).toBeNull();
    expect(within(dialog).getByText(`[${refNumber('W5')}]`)).toBeTruthy();
  });
});
