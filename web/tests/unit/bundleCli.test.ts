import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { runCli } from '../../scripts/check-bundle';
import type { ViteManifest } from '../../scripts/lib/bundle';

const MANIFEST: ViteManifest = {
  'index.html': { file: 'assets/main.js', src: 'index.html', isEntry: true, imports: ['_t.js'], css: ['assets/main.css'] },
  'references.html': { file: 'assets/refs.js', src: 'references.html', isEntry: true, imports: ['_t.js'] },
  '_t.js': { file: 'assets/t.js' }
};

let tmp: string;
let dist: string;
let budgetsFile: string;
let out: string[];
let err: string[];

const io = () => ({ stdout: (t: string) => out.push(t), stderr: (t: string) => err.push(t) });

function size(content: string) {
  return gzipSync(content, { level: 9 }).length;
}

const CONTENT = { 'assets/main.js': 'm'.repeat(5000), 'assets/main.css': 'c'.repeat(800), 'assets/refs.js': 'r'.repeat(3000), 'assets/t.js': 't'.repeat(7000) };

function buildDist(manifest: ViteManifest | null = MANIFEST) {
  fs.mkdirSync(path.join(dist, '.vite'), { recursive: true });
  if (manifest) fs.writeFileSync(path.join(dist, '.vite', 'manifest.json'), JSON.stringify(manifest));
  for (const [file, content] of Object.entries(CONTENT)) {
    fs.mkdirSync(path.dirname(path.join(dist, file)), { recursive: true });
    fs.writeFileSync(path.join(dist, file), content);
  }
}

function writeBudgets(main: number, references: number, chunkMax = 100000) {
  fs.writeFileSync(budgetsFile, JSON.stringify({ _note: 'x', initial: { main, references }, chunk_max: chunkMax }));
}

const MAIN = size(CONTENT['assets/main.js']) + size(CONTENT['assets/main.css']) + size(CONTENT['assets/t.js']);
const REFS = size(CONTENT['assets/refs.js']) + size(CONTENT['assets/t.js']);

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-bundle-'));
  dist = path.join(tmp, 'dist');
  budgetsFile = path.join(tmp, 'budgets.json');
  out = [];
  err = [];
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

const args = (...extra: string[]) => ['--dist', dist, '--budgets', budgetsFile, ...extra];

describe('check-bundle', () => {
  it('exits 0 and prints the table when every initial load is within its budget', () => {
    buildDist();
    writeBudgets(MAIN, REFS);
    expect(runCli(args(), io())).toBe(0);
    const text = out.join('');
    expect(text).toContain('main');
    expect(text).toContain(String(MAIN));
    expect(text).toContain('references');
    expect(text).toContain(String(REFS));
    expect(text).not.toContain('OVER');
    expect(err).toEqual([]);
  });

  it('exits 1 and marks the entry that is over its budget', () => {
    buildDist();
    writeBudgets(MAIN - 1, REFS);
    expect(runCli(args(), io())).toBe(1);
    const lines = out.join('').split('\n');
    expect(lines.find((l) => l.includes('main'))).toContain('OVER');
    expect(lines.find((l) => l.includes('references'))).not.toContain('OVER');
    expect(out.join('')).toContain('1 over budget');
  });

  it('--report prints the table with the suggested budgets and exits 0 even when over budget', () => {
    buildDist();
    writeBudgets(1, 1);
    expect(runCli(args('--report'), io())).toBe(0);
    const text = out.join('');
    expect(text).toContain(String(MAIN));
    expect(text).toMatch(/suggested/i);
    expect(text).toContain(String(Math.ceil((MAIN * 1.15) / 1024) * 1024));
  });

  it('--report works without a budgets file', () => {
    buildDist();
    expect(runCli(['--dist', dist, '--budgets', path.join(tmp, 'none.json'), '--report'], io())).toBe(0);
    expect(out.join('')).toContain(String(REFS));
  });

  it('exits 2 when the manifest is missing', () => {
    buildDist(null);
    writeBudgets(MAIN, REFS);
    expect(runCli(args(), io())).toBe(2);
    expect(err.join('')).toContain(`manifest not found: ${path.join(dist, '.vite', 'manifest.json')}`);
  });

  it('exits 2 when the budgets file is missing (without --report)', () => {
    buildDist();
    expect(runCli(args(), io())).toBe(2);
    expect(err.join('')).toContain(`budgets file not found: ${budgetsFile}`);
  });

  it('exits 2 for a budgets file without a budget for an entry', () => {
    buildDist();
    fs.writeFileSync(budgetsFile, JSON.stringify({ initial: { main: 99999 }, chunk_max: 1 }));
    expect(runCli(args(), io())).toBe(2);
    expect(err.join('')).toContain('no budget for the initial load "references"');
  });

  it('exits 2 for an unknown option and for a file named by the manifest that is missing', () => {
    buildDist();
    writeBudgets(MAIN, REFS);
    expect(runCli(args('--nope'), io())).toBe(2);
    expect(err.join('')).toContain('usage: check-bundle');

    err = [];
    fs.rmSync(path.join(dist, 'assets', 't.js'));
    expect(runCli(args(), io())).toBe(2);
    expect(err.join('')).toContain('file named by the manifest is missing: assets/t.js');
  });
});
