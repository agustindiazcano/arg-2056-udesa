// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/three/ProjectionScenes', () => ({
  default: () => <div data-testid="projection-scenes">escenas</div>
}));

import { ViewerBar } from '../../src/dashboard/ViewerBar';
import { useStore } from '../../src/state/store';

beforeEach(() => useStore.setState({ mode: '3d' }));
afterEach(cleanup);

describe('the Test proyección button', () => {
  it('is on the bar in 3D and not in 2D', () => {
    render(<ViewerBar />);
    expect(screen.getByRole('button', { name: 'Test proyección' })).toBeTruthy();
    cleanup();
    act(() => useStore.setState({ mode: '2d' }));
    render(<ViewerBar />);
    expect(screen.queryByRole('button', { name: 'Test proyección' })).toBeNull();
  });

  it('opens a dialog named after the test, with the note that the data is a test, and the scenes', async () => {
    render(<ViewerBar />);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Test proyección' }));
    const dialog = screen.getByRole('dialog', { name: 'Test proyección' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.textContent).toContain('Datos de prueba: no son datos del modelo.');
    await waitFor(() => expect(screen.getByTestId('projection-scenes')).toBeTruthy());
  });

  it('closes with its close button and returns the focus to the button that opened it', () => {
    render(<ViewerBar />);
    const open = screen.getByRole('button', { name: 'Test proyección' });
    open.focus();
    fireEvent.click(open);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(open);
  });

  it('closes with Escape without letting the key reach the global handler', () => {
    const global = vi.fn();
    window.addEventListener('keydown', global);
    render(<ViewerBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Test proyección' }));
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Test proyección' }), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(global).not.toHaveBeenCalled();
    window.removeEventListener('keydown', global);
  });
});
