// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NavControls } from '../../src/ui/NavControls';

afterEach(cleanup);

const handlers = () => ({ onZoomIn: vi.fn(), onZoomOut: vi.fn(), onReset: vi.fn(), onPreset: vi.fn() });

describe('NavControls', () => {
  it('has the three buttons with Spanish accessible names', () => {
    render(<NavControls {...handlers()} />);
    expect(screen.getByRole('button', { name: 'Acercar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Alejar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Restablecer vista' })).toBeTruthy();
  });

  it('is a labelled group of native buttons', () => {
    render(<NavControls {...handlers()} />);
    expect(screen.getByRole('group', { name: 'Navegación de la vista' })).toBeTruthy();
    for (const b of screen.getAllByRole('button')) expect(b.tagName).toBe('BUTTON');
  });

  it('calls the matching handler on each button', () => {
    const h = handlers();
    render(<NavControls {...h} />);
    fireEvent.click(screen.getByRole('button', { name: 'Acercar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alejar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer vista' }));
    expect(h.onZoomIn).toHaveBeenCalledTimes(1);
    expect(h.onZoomOut).toHaveBeenCalledTimes(1);
    expect(h.onReset).toHaveBeenCalledTimes(1);
  });

  it('shows no presets unless a handler is given, and with one shows Cenital and Perspectiva', () => {
    const { rerender } = render(<NavControls onZoomIn={vi.fn()} onZoomOut={vi.fn()} onReset={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Cenital' })).toBeNull();
    const onPreset = vi.fn();
    rerender(<NavControls onZoomIn={vi.fn()} onZoomOut={vi.fn()} onReset={vi.fn()} onPreset={onPreset} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cenital' }));
    fireEvent.click(screen.getByRole('button', { name: 'Perspectiva' }));
    expect(onPreset.mock.calls).toEqual([['top'], ['perspective']]);
  });

  it('keeps the click from reaching the chart under it', () => {
    const onClick = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={onClick}>
        <NavControls {...handlers()} />
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Acercar' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
