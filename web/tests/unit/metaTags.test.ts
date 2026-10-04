import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { META } from '../../src/content/meta';
import { applyMeta, buildMetaTags, metaPlugin } from '../../src/content/metaTags';
import type { Meta } from '../../src/content/meta';
import { APP_TITLE } from '../../src/app/title';
import { tokens } from '../../src/styles/tokens';

const fixture: Meta = {
  title: 'Argentina 2056',
  description: 'How the country got here, and where it may go.',
  url: 'https://example.org/',
  ogImage: '/og.png',
  themeColor: '#0d0d0d',
  placeholder: false
};

describe('META', () => {
  it('starts as a clearly fake placeholder the release gate rejects', () => {
    expect(META.placeholder).toBe(true);
    expect(META.description).toBe('Descripción provisoria. Reemplazar antes del lanzamiento.');
    expect(META.url).toBe('https://example.invalid/');
    expect(META.ogImage).toBe('/og.png');
  });

  it('takes the title from the app title constant and the theme color from the page token', () => {
    expect(META.title).toBe(APP_TITLE);
    expect(META.themeColor).toBe(tokens.page);
  });
});

describe('buildMetaTags', () => {
  it('builds exactly these tags for a fixture, with an absolute og:image', () => {
    expect(buildMetaTags(fixture, 'Argentina 2056')).toBe(
      [
        '<title>Argentina 2056</title>',
        '<meta name="description" content="How the country got here, and where it may go." />',
        '<meta name="theme-color" content="#0d0d0d" />',
        '<link rel="canonical" href="https://example.org/" />',
        '<meta property="og:type" content="website" />',
        '<meta property="og:title" content="Argentina 2056" />',
        '<meta property="og:description" content="How the country got here, and where it may go." />',
        '<meta property="og:url" content="https://example.org/" />',
        '<meta property="og:image" content="https://example.org/og.png" />',
        '<meta property="og:image:width" content="1200" />',
        '<meta property="og:image:height" content="630" />',
        '<meta name="twitter:card" content="summary_large_image" />'
      ].join('\n')
    );
  });

  it('escapes quotes, ampersands and angle brackets in every value', () => {
    const tags = buildMetaTags({ ...fixture, title: 'A & "B"', description: '<b>x</b> \'y\'' }, 'A & "B"');
    expect(tags).toContain('<title>A &amp; &quot;B&quot;</title>');
    expect(tags).toContain('content="&lt;b&gt;x&lt;/b&gt; &#39;y&#39;"');
    expect(tags).not.toContain('<b>');
  });

  it('builds the og:image from the site url even when the url has a path', () => {
    const tags = buildMetaTags({ ...fixture, url: 'https://example.org/app/', ogImage: '/og.png' }, 'T');
    expect(tags).toContain('<meta property="og:image" content="https://example.org/og.png" />');
    expect(buildMetaTags({ ...fixture, ogImage: 'https://cdn.example.org/p.png' }, 'T')).toContain(
      'content="https://cdn.example.org/p.png"'
    );
  });

  it('uses the page title for <title> and og:title, not the app title', () => {
    const tags = buildMetaTags(fixture, 'Sources and attributions | Argentina 2056');
    expect(tags).toContain('<title>Sources and attributions | Argentina 2056</title>');
    expect(tags).toContain('<meta property="og:title" content="Sources and attributions | Argentina 2056" />');
  });
});

describe('applyMeta', () => {
  const html = '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Old</title>\n  </head>\n  <body></body>\n</html>';

  it('replaces the existing title and puts the other tags in the head, once', () => {
    const out = applyMeta(html, fixture, 'main');
    expect(out.match(/<title>/g)).toHaveLength(1);
    expect(out).toContain('<title>Argentina 2056</title>');
    expect(out).not.toContain('Old');
    expect(out.indexOf('og:image')).toBeLessThan(out.indexOf('</head>'));
    expect(out).toContain('<meta charset="UTF-8" />');
  });

  it('gives the references page its own title', () => {
    expect(applyMeta(html, fixture, 'references')).toContain('<title>Sources and attributions | Argentina 2056</title>');
  });
});

describe('metaPlugin', () => {
  it('rewrites both html entries through transformIndexHtml', () => {
    const plugin = metaPlugin(fixture);
    const transform = plugin.transformIndexHtml as (html: string, ctx: { filename: string }) => string;
    const html = '<html><head><title>x</title></head><body></body></html>';
    expect(transform(html, { filename: '/repo/web/index.html' })).toContain('<title>Argentina 2056</title>');
    expect(transform(html, { filename: String.raw`C:\repo\web\references.html` })).toContain('<title>Sources and attributions | Argentina 2056</title>');
  });
});

describe('metaPlugin warnings (the dev build only warns, the release check fails)', () => {
  const warnings = (meta: Meta, publicDir: string) => {
    const messages: string[] = [];
    const plugin = metaPlugin(meta, publicDir);
    (plugin.buildStart as unknown as (this: { warn: (m: string) => void }) => void).call({ warn: (m) => messages.push(m) });
    return messages;
  };
  const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'meta-'));

  it('warns about the placeholder metadata, the missing preview image and the missing favicon', () => {
    const dir = tmp();
    expect(warnings(META, dir)).toEqual([
      'metadata is still a placeholder (src/content/meta.ts): the release build will fail',
      `preview image missing: ${path.join(dir, 'og.png')} (the release build will fail)`,
      `favicon missing: ${path.join(dir, 'favicon.svg')} (the release build will fail)`
    ]);
    fs.rmSync(dir, { recursive: true });
  });

  it('warns about nothing when the metadata is real and both files exist', () => {
    const dir = tmp();
    fs.writeFileSync(path.join(dir, 'og.png'), 'x');
    fs.writeFileSync(path.join(dir, 'favicon.svg'), 'x');
    expect(warnings(fixture, dir)).toEqual([]);
    fs.rmSync(dir, { recursive: true });
  });
});
