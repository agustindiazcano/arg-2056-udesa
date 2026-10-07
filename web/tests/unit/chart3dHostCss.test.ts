import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/dashboard/dashboard.css', import.meta.url), 'utf8');

/** The declarations of the first rule with exactly this selector. */
const rule = (selector: string): string => {
  const at = css.indexOf(`
${selector} {`);
  if (at < 0) return '';
  const open = css.indexOf('{', at);
  return css.slice(open + 1, css.indexOf('}', open));
};

describe('the box of a 3D chart', () => {
  it('fills its wrap by being laid over it, so it has a height whatever the layout above it does (the canvas inside no longer gives it one)', () => {
    const declarations = rule('.chart3d-wrap > .chart3d');
    expect(declarations).toMatch(/position:\s*absolute/);
    expect(declarations).toMatch(/inset:\s*0/);
  });
});

describe('where the styles of the 3D charts are loaded', () => {
  it('the Recorrido loads them itself: they live in dashboard.css, which the Dashboard alone imported, so entering the Recorrido first left the charts without a size', () => {
    const tourStep = readFileSync(new URL('../../src/tour/TourStep.tsx', import.meta.url), 'utf8');
    expect(tourStep).toMatch(/import\s+['"]\.\.\/dashboard\/dashboard\.css['"]/);
  });
});
