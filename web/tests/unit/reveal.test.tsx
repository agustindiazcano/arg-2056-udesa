// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

let reduced = false;
vi.mock('../../src/runtime/useReducedMotion', () => ({ useReducedMotion: () => reduced }));

import { Reveal } from '../../src/motion/Reveal';

afterEach(() => {
  cleanup();
  reduced = false;
});

describe('Reveal', () => {
  it('renders its children in a box that keeps the class and the data attributes it is given', () => {
    render(
      <Reveal k="a" className="panel" data-step="3">
        <p>contenido</p>
      </Reveal>
    );
    const box = screen.getByText('contenido').parentElement!;
    expect(box.className).toBe('panel');
    expect(box.getAttribute('data-step')).toBe('3');
  });

  it('starts hidden and leaves no inline style behind with reduced motion', () => {
    reduced = true;
    render(<Reveal k="a">x</Reveal>);
    expect(screen.getByText('x').getAttribute('style')).toBeNull();
  });

  it('starts from a transparent box when motion is on', () => {
    render(<Reveal k="a">y</Reveal>);
    expect(screen.getByText('y').style.opacity).toBe('0');
  });
});
