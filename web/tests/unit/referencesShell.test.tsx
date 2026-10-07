// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Header } from '../../src/app/Header.js';
import { inputs } from '../../vite.config.js';

afterEach(cleanup);

describe('shell link to the References page', () => {
  it('is present, points to references.html and is keyboard focusable', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Fuentes y métodos' });
    expect(link.getAttribute('href')).toBe('references.html');
    expect(link.getAttribute('tabindex')).not.toBe('-1');
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it('opens in the same tab', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Fuentes y métodos' }).getAttribute('target')).toBeNull();
  });
});

describe('vite entries', () => {
  it('has the app and the references page as inputs, both pointing at existing files', () => {
    expect(Object.keys(inputs).sort()).toEqual(['main', 'references']);
    expect(path.basename(inputs.main)).toBe('index.html');
    expect(path.basename(inputs.references)).toBe('references.html');
    expect(fs.existsSync(inputs.main)).toBe(true);
    expect(fs.existsSync(inputs.references)).toBe(true);
  });

  it('references.html loads the page entry point', () => {
    const html = fs.readFileSync(inputs.references, 'utf8');
    expect(html).toContain('/src/references/main.tsx');
    expect(fs.existsSync(path.join(path.dirname(inputs.references), 'src', 'references', 'main.tsx'))).toBe(true);
  });
});
