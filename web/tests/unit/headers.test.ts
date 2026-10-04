import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import config from '../../headers.config.json';
import { mergeVercel, parseCsp, toHeadersFile, toVercelHeaders, toVercelSource } from '../../scripts/lib/headers';
import type { HeadersConfig } from '../../scripts/lib/headers';
import { runCli } from '../../scripts/gen-headers';

const cfg = config as HeadersConfig;
const rule = (source: string) => cfg.rules.find((r) => r.source === source);

describe('headers.config.json: the rules', () => {
  it('has each path pattern exactly once, in this order', () => {
    expect(cfg.rules.map((r) => r.source)).toEqual([
      '/*',
      '/',
      '/*.html',
      '/assets/*',
      '/data/*',
      '/data/_version.json',
      '/terrain/*',
      '/geo/*'
    ]);
  });

  it('caches hashed build files for a year, as immutable', () => {
    expect(rule('/assets/*')!.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
  });

  it('revalidates the html and the root every time', () => {
    expect(rule('/*.html')!.headers['Cache-Control']).toBe('public, max-age=0, must-revalidate');
    expect(rule('/')!.headers['Cache-Control']).toBe('public, max-age=0, must-revalidate');
  });

  it('caches the data for a year (its requests carry ?v=) and never caches _version.json', () => {
    expect(rule('/data/*')!.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(rule('/data/_version.json')!.headers['Cache-Control']).toBe('no-cache');
  });

  it('caches terrain and geometry for a day', () => {
    expect(rule('/terrain/*')!.headers['Cache-Control']).toBe('public, max-age=86400');
    expect(rule('/geo/*')!.headers['Cache-Control']).toBe('public, max-age=86400');
  });

  it('sets the security headers on everything, and no Strict-Transport-Security (the host adds it)', () => {
    const all = rule('/*')!.headers;
    expect(all['X-Content-Type-Options']).toBe('nosniff');
    expect(all['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(all['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=(), payment=()');
    expect(all['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(JSON.stringify(cfg)).not.toMatch(/Strict-Transport-Security/i);
  });
});

describe('headers.config.json: the Content-Security-Policy', () => {
  const csp = parseCsp(rule('/*')!.headers['Content-Security-Policy']!);

  it('has exactly these directives', () => {
    expect(csp).toEqual({
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'worker-src': ["'self'", 'blob:'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"]
    });
  });

  it('allows no eval and no wildcard origin', () => {
    const text = rule('/*')!.headers['Content-Security-Policy']!;
    expect(text).not.toContain('unsafe-eval');
    expect(text).not.toMatch(/(^|\s)\*(\s|;|$)/);
    expect(text).not.toMatch(/https?:/);
  });

  it('explains the one loose directive: style-src needs unsafe-inline because ECharts writes inline styles', () => {
    expect(cfg._note).toContain("style-src 'unsafe-inline'");
    expect(cfg._note).toContain('ECharts');
  });
});

describe('parseCsp', () => {
  it('splits directives and sources', () => {
    expect(parseCsp("default-src 'self'; img-src 'self' data:")).toEqual({ 'default-src': ["'self'"], 'img-src': ["'self'", 'data:'] });
  });
});

describe('toHeadersFile (Cloudflare Pages and Netlify)', () => {
  it('writes each pattern with its indented headers', () => {
    const small: HeadersConfig = {
      rules: [
        { source: '/assets/*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
        { source: '/', headers: { 'X-A': '1', 'X-B': '2' } }
      ]
    };
    expect(toHeadersFile(small)).toBe(
      '/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/\n  X-A: 1\n  X-B: 2\n'
    );
  });
});

describe('toVercelSource and toVercelHeaders', () => {
  it('converts the patterns', () => {
    expect(toVercelSource('/assets/*')).toBe('/assets/(.*)');
    expect(toVercelSource('/*.html')).toBe(String.raw`/(.*)\.html`);
    expect(toVercelSource('/data/_version.json')).toBe(String.raw`/data/_version\.json`);
    expect(toVercelSource('/')).toBe('/');
    expect(toVercelSource('/*')).toBe('/(.*)');
  });

  it('lists the headers as key and value pairs', () => {
    expect(toVercelHeaders({ rules: [{ source: '/geo/*', headers: { 'Cache-Control': 'public, max-age=86400' } }] })).toEqual([
      { source: '/geo/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] }
    ]);
  });
});

describe('both formats come from the same config', () => {
  const file = toHeadersFile(cfg);
  const vercel = toVercelHeaders(cfg);

  it('have the same number of rules and the same header lines', () => {
    expect(vercel).toHaveLength(cfg.rules.length);
    expect(file.split('\n\n').filter((b) => b.trim() !== '')).toHaveLength(cfg.rules.length);
    for (const r of cfg.rules) {
      for (const [key, value] of Object.entries(r.headers)) {
        expect(file).toContain(`  ${key}: ${value}`);
        expect(vercel.find((v) => v.source === toVercelSource(r.source))!.headers).toContainEqual({ key, value });
      }
    }
  });
});

describe('mergeVercel', () => {
  it('replaces only the headers of an existing vercel.json', () => {
    const existing = { framework: null, outputDirectory: 'web/dist', headers: [{ source: '/old', headers: [] }] };
    const merged = mergeVercel(existing, cfg);
    expect(merged.framework).toBeNull();
    expect(merged.outputDirectory).toBe('web/dist');
    expect(merged.headers).toEqual(toVercelHeaders(cfg));
  });

  it('creates the document when there is none', () => {
    expect(mergeVercel(null, cfg)).toEqual({ headers: toVercelHeaders(cfg) });
  });
});

describe('gen-headers', () => {
  const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'headers-'));
  const out: string[] = [];
  const err: string[] = [];
  const io = { stdout: (t: string) => out.push(t), stderr: (t: string) => err.push(t) };

  it('writes dist/_headers and the headers of vercel.json, keeping the rest of that file', () => {
    const dir = tmp();
    fs.mkdirSync(path.join(dir, 'dist'));
    fs.writeFileSync(path.join(dir, 'vercel.json'), JSON.stringify({ framework: null, headers: [] }));
    const code = runCli(['--dist', path.join(dir, 'dist'), '--vercel', path.join(dir, 'vercel.json')], io);
    expect(code).toBe(0);
    expect(fs.readFileSync(path.join(dir, 'dist', '_headers'), 'utf8')).toBe(toHeadersFile(cfg));
    const vercel = JSON.parse(fs.readFileSync(path.join(dir, 'vercel.json'), 'utf8'));
    expect(vercel.framework).toBeNull();
    expect(vercel.headers).toEqual(toVercelHeaders(cfg));
    fs.rmSync(dir, { recursive: true });
  });

  it('creates vercel.json when it does not exist', () => {
    const dir = tmp();
    fs.mkdirSync(path.join(dir, 'dist'));
    expect(runCli(['--dist', path.join(dir, 'dist'), '--vercel', path.join(dir, 'vercel.json')], io)).toBe(0);
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'vercel.json'), 'utf8'))).toEqual({ headers: toVercelHeaders(cfg) });
    fs.rmSync(dir, { recursive: true });
  });

  it('--check exits 0 when vercel.json is up to date and 1, naming the file, when it is not', () => {
    const dir = tmp();
    const vercel = path.join(dir, 'vercel.json');
    fs.writeFileSync(vercel, JSON.stringify(mergeVercel(null, cfg)));
    expect(runCli(['--check', '--vercel', vercel], io)).toBe(0);
    fs.writeFileSync(vercel, JSON.stringify({ headers: [] }));
    err.length = 0;
    expect(runCli(['--check', '--vercel', vercel], io)).toBe(1);
    expect(err.join('')).toContain(`${vercel} is out of date`);
    fs.rmSync(dir, { recursive: true });
  });

  it('exits 2 for an unknown option and when dist does not exist', () => {
    err.length = 0;
    expect(runCli(['--nope'], io)).toBe(2);
    expect(err.join('')).toContain('usage: gen-headers');
    err.length = 0;
    expect(runCli(['--dist', path.join(os.tmpdir(), 'no-such-dist-folder'), '--vercel', path.join(os.tmpdir(), 'x.json')], io)).toBe(2);
    expect(err.join('')).toContain('dist folder not found');
  });

  it('the vercel.json committed at the repository root has the generated headers', () => {
    const file = path.resolve(__dirname, '../../../vercel.json');
    expect(runCli(['--check', '--vercel', file], io)).toBe(0);
  });
});
