import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { META } from './meta';
import type { Meta } from './meta';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const REFERENCES_TITLE = 'Sources and attributions';

const escapeAttribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The head tags for a page: title, description, theme color, canonical link, Open Graph and Twitter card. */
export function buildMetaTags(meta: Meta, pageTitle: string): string {
  const title = escapeAttribute(pageTitle);
  const description = escapeAttribute(meta.description);
  const url = escapeAttribute(meta.url);
  const image = escapeAttribute(new URL(meta.ogImage, meta.url).href);
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="theme-color" content="${escapeAttribute(meta.themeColor)}" />`,
    `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="${OG_WIDTH}" />`,
    `<meta property="og:image:height" content="${OG_HEIGHT}" />`,
    '<meta name="twitter:card" content="summary_large_image" />'
  ].join('\n');
}

/** Replaces the <title> of an html entry and adds the other tags before </head>. */
export function applyMeta(html: string, meta: Meta, page: 'main' | 'references'): string {
  const pageTitle = page === 'references' ? `${REFERENCES_TITLE} | ${meta.title}` : meta.title;
  const tags = buildMetaTags(meta, pageTitle).split('\n');
  const [title, ...rest] = tags as [string, ...string[]];
  const withTitle = html.replace(/<title>[\s\S]*?<\/title>/, title);
  return withTitle.replace('</head>', `${rest.map((tag) => `    ${tag}\n`).join('')}  </head>`);
}

/** Vite plugin: writes the metadata into both html entries of the build and of the dev server. */
export function metaPlugin(meta: Meta = META, publicDir: string = path.resolve(process.cwd(), 'public')): Plugin {
  return {
    name: 'argentina-2056-meta',
    // The dev build only warns; scripts/check_release_assets.py and the placeholder gate fail the release build.
    buildStart() {
      if (meta.placeholder) this.warn('metadata is still a placeholder (src/content/meta.ts): the release build will fail');
      const og = path.join(publicDir, 'og.png');
      if (!fs.existsSync(og)) this.warn(`preview image missing: ${og} (the release build will fail)`);
      const favicon = path.join(publicDir, 'favicon.svg');
      if (!fs.existsSync(favicon)) this.warn(`favicon missing: ${favicon} (the release build will fail)`);
    },
    transformIndexHtml(html, ctx) {
      const file = (ctx as { filename: string }).filename;
      return applyMeta(html, meta, /references\.html$/.test(file) ? 'references' : 'main');
    }
  };
}
