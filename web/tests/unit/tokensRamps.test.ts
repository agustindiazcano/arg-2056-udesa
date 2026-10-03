import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DIVERGING, NO_DATA, SEQUENTIAL_BLUE, tokens } from '../../src/styles/tokens.js';

const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');

function cssVar(name: string): string | undefined {
  return css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))?.[1];
}

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

describe('sequential blue ramp (design.md section 3, magnitude)', () => {
  it('has the 12 steps of the design, from 700 (darkest, low values) to 100 (lightest, high values)', () => {
    expect(SEQUENTIAL_BLUE).toEqual([
      '#0d366b', // 700
      '#184f95', // 600
      '#1c5cab', // 550
      '#256abf', // 500
      '#2a78d6', // 450
      '#3987e5', // 400
      '#5598e7', // 350
      '#6da7ec', // 300
      '#86b6ef', // 250
      '#9ec5f4', // 200
      '#b7d3f6', // 150
      '#cde2fb' // 100
    ]);
  });

  it('gets lighter with every step, so larger values never look smaller', () => {
    for (let i = 1; i < SEQUENTIAL_BLUE.length; i++) {
      expect(luminance(SEQUENTIAL_BLUE[i]!)).toBeGreaterThan(luminance(SEQUENTIAL_BLUE[i - 1]!));
    }
  });

  it('mirrors tokens.css (drift)', () => {
    SEQUENTIAL_BLUE.forEach((hex, i) => {
      expect(cssVar(`--seq-${i + 1}`)).toBe(hex);
    });
  });
});

describe('diverging ramp (blue = high, red = low, neutral midpoint)', () => {
  it('has 11 stops with the neutral baseline in the middle and equal steps per arm', () => {
    expect(DIVERGING).toHaveLength(11);
    expect(DIVERGING[5]).toBe(tokens.baseline);
    expect(DIVERGING.slice(0, 5)).toHaveLength(5);
    expect(DIVERGING.slice(6)).toHaveLength(5);
  });

  it('ends in the blue token for the highest values', () => {
    expect(DIVERGING[10]).toBe(tokens.blue);
  });

  it('PLACEHOLDER red arm (not in design.md; the human replaces it) is pinned so it cannot change silently', () => {
    expect(DIVERGING.slice(0, 5)).toEqual(['#e53956', '#c2394f', '#a03949', '#7d3842', '#5b383c']);
    expect(DIVERGING.slice(6)).toEqual(['#384858', '#38587b', '#39679f', '#3977c2', '#3987e5']);
  });

  it('is brighter toward both extremes than at the midpoint', () => {
    for (let i = 0; i < 5; i++) {
      expect(luminance(DIVERGING[i]!)).toBeGreaterThan(luminance(DIVERGING[i + 1]!));
    }
    for (let i = 6; i < 11; i++) {
      expect(luminance(DIVERGING[i]!)).toBeGreaterThan(luminance(DIVERGING[i - 1]!));
    }
  });

  it('mirrors tokens.css (drift)', () => {
    DIVERGING.forEach((hex, i) => {
      expect(cssVar(`--div-${i + 1}`)).toBe(hex);
    });
  });
});

describe('NO_DATA token', () => {
  it('is the baseline color (design.md: no-data provinces use the baseline fill)', () => {
    expect(NO_DATA).toBe(tokens.baseline);
    expect(cssVar('--no-data')).toBe(NO_DATA);
  });

  it('is not a step of the sequential ramp, so missing data never looks like the low end', () => {
    expect(SEQUENTIAL_BLUE).not.toContain(NO_DATA);
  });
});
