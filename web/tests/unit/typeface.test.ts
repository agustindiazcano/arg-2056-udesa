import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('typeface', () => {
  const tokens = read('src/styles/tokens.css');

  it('Clarity City and Raleway are bundled, not loaded from a CDN: the CSP allows font-src self only', () => {
    const faces = [...tokens.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]);
    expect(faces.length).toBeGreaterThanOrEqual(2);
    for (const face of faces) {
      expect(face).toMatch(/font-family: '(Clarity City|Raleway)'/);
      const url = /url\(([^)]+)\)/.exec(face)?.[1]?.replace(/['"]/g, '');
      expect(url, face).toMatch(/^\/fonts\/.+\.woff2$/);
      expect(fs.existsSync(path.join(root, 'public', url!))).toBe(true);
    }
    expect(tokens).not.toMatch(/https?:\/\//);
  });

  it('keeps the license of each font next to the files', () => {
    expect(read('public/fonts/OFL-Clarity-City.txt')).toContain('SIL Open Font License');
    expect(read('public/fonts/OFL-Raleway.txt')).toContain('SIL Open Font License');
  });

  it('Raleway is the face of the title "Argentina 2056": the brand in the navbar and the heading of the intro', () => {
    expect(tokens).toMatch(/--font-title:\s*'Raleway',\s*var\(--font-sans\)/);
    expect(read('src/styles/ui.css')).toMatch(/\.brand\s*\{[^}]*font-family:\s*var\(--font-title\)/);
    expect(read('src/intro/intro.css')).toMatch(/\.intro-title\s*\{[^}]*font-family:\s*var\(--font-title\)/);
  });

  it('the page, the intro and the 3D labels all use it, with the system stack as fallback', () => {
    expect(tokens).toMatch(/--font-sans:\s*'Clarity City',\s*system-ui/);
    expect(tokens).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-sans\)/);
    expect(read('src/intro/intro.css')).toMatch(/font-family:\s*var\(--font-sans\)/);
    expect(read('src/three/labels.ts')).toContain('Clarity City');
  });
});

describe('title figures', () => {
  it('the title uses lining figures, as Raleway draws old-style ones by default', () => {
    expect(read('src/intro/intro.css')).toMatch(/\.intro-title\s*\{[^}]*lining-nums/);
    expect(read('src/styles/ui.css')).toMatch(/\.brand\s*\{[^}]*lining-nums/);
  });
});

describe('intro title weights', () => {
  it('"Argentina" is weight 200 and "2056" is weight 400', () => {
    const css = read('src/intro/intro.css');
    expect(css).toMatch(/\.intro-title \.a\s*\{[^}]*font-weight:\s*200/);
    expect(css).toMatch(/\.intro-title \.n\s*\{[^}]*font-weight:\s*400/);
  });
});
