import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const config = fs.readFileSync(path.resolve(__dirname, '../../eslint.config.js'), 'utf8');

describe('eslint config', () => {
  it('loads eslint-plugin-jsx-a11y and applies its recommended rules', () => {
    expect(config).toContain("from 'eslint-plugin-jsx-a11y'");
    expect(config).toContain('jsxA11y.flatConfigs.recommended');
  });

  it('turns off no jsx-a11y rule', () => {
    expect(config).not.toMatch(/jsx-a11y\/[\w-]+['"]?\s*:\s*(['"]off['"]|0)/);
  });
});
