import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('typeface', () => {
  const tokens = read('src/styles/tokens.css');

  it('Clarity City is bundled, not loaded from a CDN: the CSP allows font-src self only', () => {
    const faces = [...tokens.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]);
    expect(faces.length).toBeGreaterThanOrEqual(2);
    for (const face of faces) {
      expect(face).toContain("font-family: 'Clarity City'");
      const url = /url\(([^)]+)\)/.exec(face)?.[1]?.replace(/['"]/g, '');
      expect(url, face).toMatch(/^\/fonts\/.+\.woff2$/);
      expect(fs.existsSync(path.join(root, 'public', url!))).toBe(true);
    }
    expect(tokens).not.toMatch(/https?:\/\//);
  });

  it('keeps the license of the font next to the files', () => {
    expect(read('public/fonts/OFL.txt')).toContain('SIL Open Font License');
  });

  it('the page, the intro and the 3D labels all use it, with the system stack as fallback', () => {
    expect(tokens).toMatch(/--font-sans:\s*'Clarity City',\s*system-ui/);
    expect(tokens).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-sans\)/);
    expect(read('src/intro/intro.css')).toMatch(/font-family:\s*var\(--font-sans\)/);
    expect(read('src/three/labels.ts')).toContain('Clarity City');
  });
});
