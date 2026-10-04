import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');

describe('html entries', () => {
  it.each(['index.html', 'references.html'])('%s declares Spanish as its language', (file) => {
    const html = readFileSync(path.join(root, file), 'utf-8');
    expect(html).toMatch(/<html lang="es">/);
  });
});
