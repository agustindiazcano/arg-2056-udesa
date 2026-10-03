// @ts-ignore
import { readFileSync } from 'fs';
// @ts-ignore
import { join } from 'path';
import { describe, it, expect } from 'vitest';


import { tokens } from '../../src/styles/tokens.js';

describe('token drift', () => {
  it('ensures every hex in tokens.ts appears in tokens.css', () => {
    const cssPath = join(process.cwd(), 'src/styles/tokens.css');
    const cssContent = readFileSync(cssPath, 'utf8');

    // Extract all values from tokens object recursively
    const extractHexValues = (obj: Record<string, unknown>): string[] => {
      let hexes: string[] = [];
      for (const key in obj) {
        if (typeof obj[key] === 'string' && (obj[key].startsWith('#') || obj[key].startsWith('rgba'))) {
          hexes.push(obj[key]);
        } else if (typeof obj[key] === 'object') {
          hexes = hexes.concat(extractHexValues(obj[key]));
        }
      }
      return hexes;
    };

    const tokenValues = extractHexValues(tokens);
    expect(tokenValues.length).toBeGreaterThan(0);

    for (const val of tokenValues) {
      expect(cssContent).toContain(val);
    }
  });
});
