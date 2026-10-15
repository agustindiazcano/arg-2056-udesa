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
  it('is gone from the header: the Data button takes its place', () => {
    render(<Header />);
    expect(screen.queryByRole('link', { name: 'Fuentes y métodos' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Data' })).toBeTruthy();
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
