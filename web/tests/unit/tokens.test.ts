// @ts-ignore
import { readFileSync } from 'fs';
// @ts-ignore
import { join } from 'path';
import { describe, it, expect } from 'vitest';


import { tokens } from '../../src/styles/tokens.js';

describe('token drift', () => {
  it('ensures every hex in tokens.ts appears in tokens.css', () => {
    // @ts-ignore
    const cssPath = join(process.cwd(), 'src/styles/tokens.css');
    // @ts-ignore
    const cssContent = readFileSync(cssPath, 'utf8');

    // Extract all values from tokens object recursively
    const extractHexValues = (obj: Record<string, unknown>): string[] => {
      let hexes: string[] = [];
      for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'string' && (val.startsWith('#') || val.startsWith('rgba'))) {
          hexes.push(val);
        } else if (val && typeof val === 'object') {
          hexes = hexes.concat(extractHexValues(val as Record<string, unknown>));
        }
      }
      return hexes;
    };

    const tokenValues = extractHexValues(tokens as Record<string, unknown>);
    expect(tokenValues.length).toBeGreaterThan(0);

    for (const val of tokenValues) {
      expect(cssContent).toContain(val);
    }
  });
});
