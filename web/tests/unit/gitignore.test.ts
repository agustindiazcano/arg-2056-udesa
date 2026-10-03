import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

function lines(file: string): string[] {
  const bytes = readFileSync(file);
  expect(bytes.includes(0), `${file} must be plain text, not UTF-16`).toBe(false);
  expect(bytes.subarray(0, 2).toString('hex')).not.toBe('fffe');
  return bytes.toString('utf8').split(/\r?\n/).map((l) => l.trim());
}

describe('gitignore files are plain UTF-8 so their rules work', () => {
  it('web/.gitignore ignores the generated public data folder', () => {
    expect(lines(join(process.cwd(), '.gitignore'))).toContain('public/data/');
  });

  it('the root .gitignore ignores private raw data and keeps its earlier rules', () => {
    const root = lines(join(process.cwd(), '..', '.gitignore'));
    expect(root).toContain('data/raw/_private/');
    expect(root).toContain('node_modules/');
    expect(root).toContain('.venv/');
  });
});
