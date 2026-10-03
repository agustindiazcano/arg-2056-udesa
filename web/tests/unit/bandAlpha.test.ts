import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { BAND_ALPHA } from '../../src/styles/tokens.js';

describe('BAND_ALPHA token', () => {
  it('is 0.18 as written in docs section 4 of design.md (p10-p90 band at 18% opacity)', () => {
    expect(BAND_ALPHA).toBe(0.18);
  });

  it('matches the --band-alpha variable in tokens.css (drift)', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');
    const match = css.match(/--band-alpha:\s*([0-9.]+)\s*;/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBe(BAND_ALPHA);
  });
});
