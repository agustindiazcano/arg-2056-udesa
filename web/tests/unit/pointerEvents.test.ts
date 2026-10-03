import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// The overlay is pointer-events: none so the canvas below stays usable (AGENTS.md section 8), and pointer-events is
// inherited, so the interactive elements inside a scene must switch it back on or the mouse falls through to #stage.
// The Playwright suite proves the real behavior; this keeps the rule from being deleted by accident.
const css = fs.readFileSync(path.join(process.cwd(), 'src', 'styles', 'tokens.css'), 'utf8');

function ruleFor(selector: string): string | undefined {
  const match = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((m) => m[1]!.includes(selector));
  return match?.[2];
}

describe('pointer events inside a scene', () => {
  it.each(['button', 'input', 'select', 'a', "[role='img']"])('%s is clickable', (element) => {
    const rule = ruleFor(`.scene-container ${element}`);
    expect(rule, `no rule for .scene-container ${element}`).toBeDefined();
    expect(rule).toMatch(/pointer-events:\s*auto/);
  });
});
