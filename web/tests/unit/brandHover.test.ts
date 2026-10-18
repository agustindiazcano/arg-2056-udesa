import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/ui.css', 'utf8');
const block = (selector: string): string => {
  const at = css.lastIndexOf(selector + ' {');
  expect(at, selector).toBeGreaterThan(-1);
  return css.slice(at, css.indexOf('}', at));
};

describe('hover on the logo of the navbar', () => {
  it('turns «Argentina» gold with an eased color', () => {
    expect(block('#overlay .chrome button.brand:hover .brand-a,\n#overlay .chrome button.brand:focus-visible .brand-a')).toMatch(/color:\s*var\(--nav-gold\)/);
    expect(block('#overlay .chrome button.brand .brand-a')).toMatch(/transition:\s*color\s+[\d.]+s/);
  });

  it('turns «2056» white with a wipe (the size of a white layer over the gold gradient grows, eased), not a jump', () => {
    const base = block('#overlay .chrome button.brand .brand-n');
    expect(base).toMatch(/var\(--intro-white\)[^;]*\/\s*0% 100%/);
    expect(base).toMatch(/transition:[^;]*background-size\s+[\d.]+s/);
    expect(block('#overlay .chrome button.brand:hover .brand-n,\n#overlay .chrome button.brand:focus-visible .brand-n')).toMatch(/background-size:\s*100% 100%/);
  });

  it('grows an underline from the left with an eased transform', () => {
    expect(block('#overlay .chrome button.brand::after')).toMatch(/transform:\s*scaleX\(0\)/);
    expect(block('#overlay .chrome button.brand::after')).toMatch(/transition:\s*transform\s+[\d.]+s/);
    expect(block('#overlay .chrome button.brand:hover::after,\n#overlay .chrome button.brand:focus-visible::after')).toMatch(/scaleX\(1\)/);
  });
});
