import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { HeadersConfig } from '../../scripts/lib/headers';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8'
};

/** A _headers pattern as a regular expression over the request path: `*` matches any run of characters. */
function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

/** Every matching rule applies, in file order; a later rule overrides an earlier one for the same header. */
export function headersFor(config: HeadersConfig, requestPath: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const rule of config.rules) {
    if (patternToRegExp(rule.source).test(requestPath)) Object.assign(headers, rule.headers);
  }
  return headers;
}

export interface StaticServer {
  url: string;
  close: () => Promise<void>;
}

/**
 * Serves a folder with Node built-ins only, applying the header rules like a static host does. `/` is index.html.
 * A path that is not a file answers 404 (no fallback to index.html).
 */
export async function startStaticServer(root: string, config: HeadersConfig): Promise<StaticServer> {
  const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
    const file = path.resolve(root, relative);
    const inside = file === root || file.startsWith(root + path.sep);
    if (!inside || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404, headersFor(config, requestPath));
      response.end('not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', ...headersFor(config, requestPath) });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}
