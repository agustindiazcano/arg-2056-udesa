import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC = path.resolve(__dirname, '../../src');

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.(tsx|ts)$/.test(entry.name) ? [full] : [];
  });
}
const text = (file: string) => fs.readFileSync(path.join(SRC, file), 'utf8');

describe('live regions', () => {
  it('no source announces anything assertively: no aria-live="assertive" and no role="alert"', () => {
    for (const file of sources(SRC)) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content, path.relative(SRC, file)).not.toMatch(/aria-live=["{'\s]*assertive/);
      expect(content, path.relative(SRC, file)).not.toMatch(/role=["'{\s]*alert/);
    }
  });

  it('the caption panel, the references filter count, the copy confirmation, the loading fallback and the WebGL notice are polite', () => {
    expect(text('story/StoryCaption.tsx')).toMatch(/aria-live="polite"\s+className="story-live"/);
    const references = text('references/ReferencesPage.tsx');
    expect(references).toMatch(/role="status" aria-live="polite"/); // filter result count
    expect(references).toMatch(/<span aria-live="polite">\{copy === 'copied'/); // copy confirmation
    expect(text('app/SceneHost.tsx')).toContain('role="status" aria-live="polite"');
    expect(text('runtime/WebGLRequired.tsx').match(/aria-live="polite"/g)).toHaveLength(2);
  });

  it('every aria-live in the sources is polite', () => {
    const values = new Set<string>();
    for (const file of sources(SRC)) {
      for (const match of fs.readFileSync(file, 'utf8').matchAll(/aria-live=["']([^"']+)["']/g)) values.add(match[1]!);
    }
    expect([...values]).toEqual(['polite']);
  });
});
