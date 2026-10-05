import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DIVERGING, NO_DATA, SEQUENTIAL_BLUE, SKY_RAMP, TERRAIN_RAMP, tokens } from '../../src/styles/tokens.js';

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

describe('terrain ramp (the natural colors of the Andes scene)', () => {
  it('has 8 steps from the valley green to the snow', () => {
    expect(TERRAIN_RAMP).toEqual([
      '#2f4a26', // valley
      '#4c6a2f',
      '#7a8a3c', // dry grass
      '#a08f4a', // ochre
      '#b0916a', // earth
      '#a9a39c', // rock
      '#cbc8c2', // scree
      '#f1f3f6' // snow
    ]);
  });

  it('gets lighter with every step, so a higher place never looks darker', () => {
    for (let i = 1; i < TERRAIN_RAMP.length; i++) {
      expect(luminance(TERRAIN_RAMP[i]!)).toBeGreaterThan(luminance(TERRAIN_RAMP[i - 1]!));
    }
  });

  it('mirrors tokens.css (drift)', () => {
    TERRAIN_RAMP.forEach((hex, i) => {
      expect(cssVar(`--terrain-${i + 1}`)).toBe(hex);
    });
  });
});

describe('sky ramp (the dome of the Andes scene)', () => {
  it('has 4 steps from the horizon (pale blue, light) to the zenith (deep blue)', () => {
    expect(SKY_RAMP).toEqual(['#cfe1f3', '#93b8e2', '#5189d2', '#2a60c0']);
  });

  it('is a day sky: the horizon is a pale blue haze, not the orange of a dawn', () => {
    const n = parseInt(SKY_RAMP[0]!.slice(1), 16);
    const r = (n >> 16) & 255;
    const b = n & 255;
    expect(b).toBeGreaterThan(r);
  });

  it('gets darker with every step up, so the sky is lightest at the horizon', () => {
    for (let i = 1; i < SKY_RAMP.length; i++) {
      expect(luminance(SKY_RAMP[i]!)).toBeLessThan(luminance(SKY_RAMP[i - 1]!));
    }
  });

  it('mirrors tokens.css (drift)', () => {
    SKY_RAMP.forEach((hex, i) => {
      expect(cssVar(`--sky-${i + 1}`)).toBe(hex);
    });
  });
});
