import { tokens } from './tokens';

/** Parses #rgb or #rrggbb into 0-255 channels. */
function channels(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`not a hex color: ${hex}`);
  const digits = match[1]!;
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

/** WCAG 2 relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio between two colors, 1 to 21, the same in either order. */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** The colors the contrast checks name, taken from tokens.ts (the source of the design values). */
export const COLOR_BY_NAME = {
  page: tokens.page,
  surface: tokens.surface,
  ink: tokens.ink,
  ink2: tokens.ink2,
  muted: tokens.muted,
  blue: tokens.blue,
  warning: tokens.state.warning,
  pessimistic: tokens.scenario.pessimistic,
  expected: tokens.scenario.expected,
  optimistic: tokens.scenario.optimistic
} as const;

export type ColorName = keyof typeof COLOR_BY_NAME;

/**
 * Text colors on the backgrounds where they are used: at least 4.5:1 (WCAG AA, normal text). ink, ink-2 and muted are
 * the design text tokens (design.md); blue is the link and chart-label color; warning is the MOCK badge and notices.
 */
export const TEXT_PAIRS: ReadonlyArray<readonly [ColorName, ColorName]> = [
  ['ink', 'page'],
  ['ink', 'surface'],
  ['ink2', 'page'],
  ['ink2', 'surface'],
  ['muted', 'page'],
  ['muted', 'surface'],
  ['blue', 'page'],
  ['blue', 'surface'],
  ['warning', 'page'],
  ['warning', 'surface']
];

/** Large text and graphical marks: at least 3:1. The scenario colors draw the fan lines on the chart surface. */
export const TEXT_PAIRS_LARGE: ReadonlyArray<readonly [ColorName, ColorName]> = [
  ['pessimistic', 'surface'],
  ['expected', 'surface'],
  ['optimistic', 'surface']
];
