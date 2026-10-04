import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  COLOR_BY_NAME,
  TEXT_PAIRS,
  TEXT_PAIRS_LARGE,
  contrastRatio,
  relativeLuminance
} from '../../src/styles/contrast';
import { tokens } from '../../src/styles/tokens';

describe('contrastRatio', () => {
  it('is 21 for white on black, in either order', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBe(21);
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
  });

  it('is 1 for identical colors', () => {
    expect(contrastRatio('#3987e5', '#3987e5')).toBe(1);
    expect(contrastRatio('#000000', '#000000')).toBe(1);
  });

  it('matches the hand-computed value for #767676 on white: 4.54', () => {
    // L(#767676) = ((118/255 + 0.055) / 1.055) ^ 2.4 = 0.18116; ratio = (1 + 0.05) / (0.18116 + 0.05) = 4.543
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('accepts upper case and short hex', () => {
    expect(contrastRatio('#FFF', '#000')).toBe(21);
    expect(contrastRatio('#FFFFFF', '#000000')).toBe(21);
  });

  it('throws on a value that is not a hex color', () => {
    expect(() => contrastRatio('white', '#000000')).toThrow('not a hex color: white');
    expect(() => contrastRatio('#12', '#000000')).toThrow('not a hex color: #12');
  });
});

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBe(1);
  });

  it('uses the WCAG weights: pure red 0.2126, green 0.7152, blue 0.0722', () => {
    expect(relativeLuminance('#ff0000')).toBeCloseTo(0.2126, 4);
    expect(relativeLuminance('#00ff00')).toBeCloseTo(0.7152, 4);
    expect(relativeLuminance('#0000ff')).toBeCloseTo(0.0722, 4);
  });
});

describe('design tokens: text contrast', () => {
  it('COLOR_BY_NAME takes its values from tokens.ts', () => {
    expect(COLOR_BY_NAME.page).toBe(tokens.page);
    expect(COLOR_BY_NAME.surface).toBe(tokens.surface);
    expect(COLOR_BY_NAME.ink).toBe(tokens.ink);
    expect(COLOR_BY_NAME.ink2).toBe(tokens.ink2);
    expect(COLOR_BY_NAME.muted).toBe(tokens.muted);
    expect(COLOR_BY_NAME.blue).toBe(tokens.blue);
    expect(COLOR_BY_NAME.warning).toBe(tokens.state.warning);
    expect(COLOR_BY_NAME.expected).toBe(tokens.scenario.expected);
  });

  it('TEXT_PAIRS holds ink, ink-2 and muted on the page and on the surface', () => {
    const keys = TEXT_PAIRS.map(([fg, bg]) => `${fg} on ${bg}`);
    for (const fg of ['ink', 'ink2', 'muted']) {
      for (const bg of ['page', 'surface']) expect(keys).toContain(`${fg} on ${bg}`);
    }
  });

  it.each(TEXT_PAIRS.map(([fg, bg]) => [fg, bg] as const))('%s on %s is at least 4.5:1', (fg, bg) => {
    const ratio = contrastRatio(COLOR_BY_NAME[fg], COLOR_BY_NAME[bg]);
    expect(ratio, `${fg} ${COLOR_BY_NAME[fg]} on ${bg} ${COLOR_BY_NAME[bg]} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(TEXT_PAIRS_LARGE.map(([fg, bg]) => [fg, bg] as const))('%s on %s is at least 3:1', (fg, bg) => {
    const ratio = contrastRatio(COLOR_BY_NAME[fg], COLOR_BY_NAME[bg]);
    expect(ratio, `${fg} ${COLOR_BY_NAME[fg]} on ${bg} ${COLOR_BY_NAME[bg]} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
  });
});

describe('stylesheet colors that the pages really use', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/tokens.css'), 'utf8');
  const color = (name: string): string => {
    const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})\\s*;`));
    if (!match) throw new Error(`tokens.css has no hex value for --${name}`);
    return match[1]!;
  };

  it('the body text (--color-text) on the body background (--color-bg) is at least 4.5:1', () => {
    expect(contrastRatio(color('color-text'), color('color-bg'))).toBeGreaterThanOrEqual(4.5);
  });

  it('the focus ring (--color-focus) is at least 3:1 against the body, the page and the surface backgrounds', () => {
    for (const bg of [color('color-bg'), color('page'), color('surface')]) {
      expect(contrastRatio(color('color-focus'), bg), `focus on ${bg}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('the button border (--color-primary) is at least 3:1 against the body background', () => {
    expect(contrastRatio(color('color-primary'), color('color-bg'))).toBeGreaterThanOrEqual(3);
  });
});
