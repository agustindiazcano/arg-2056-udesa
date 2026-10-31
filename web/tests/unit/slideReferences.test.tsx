// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { SlideReferences } from '../../src/ui/SlideReferences';
import { RefList, refNumber } from '../../src/ui/RefLink';
import { ChartHelp } from '../../src/ui/ChartHelp';
import { AiAccessStep } from '../../src/tour/AiAccessStep';

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

  it('keeps tab navigation inside the dialog', () => {
    render(<SlideReferences><RefList ids={['F1']} /></SlideReferences>);
    fireEvent.click(screen.getByRole('button', { name: 'Referencias' }));
    const dialog = screen.getByRole('dialog');
    const close = within(dialog).getByRole('button', { name: 'Cerrar' });
    const link = within(dialog).getByRole('link');
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(link);
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
  });

  it('includes sources from the access slide map and token views before switching views', () => {
    render(<SlideReferences><AiAccessStep /></SlideReferences>);
    fireEvent.click(screen.getByRole('button', { name: 'Referencias' }));
    const dialog = screen.getByRole('dialog', { name: 'Referencias' });
    expect(within(dialog).getByText(`[${refNumber('AI53')}]`)).toBeTruthy();
    expect(within(dialog).getByText(`[${refNumber('AI31')}]`)).toBeTruthy();
  });
});
