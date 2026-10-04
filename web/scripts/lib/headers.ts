export interface HeaderRule {
  /** path pattern in the _headers syntax: `*` matches any run of characters */
  source: string;
  headers: Record<string, string>;
}

export interface HeadersConfig {
  _note?: string;
  rules: HeaderRule[];
}

export interface VercelHeader {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

/** { directive: [sources] } of a Content-Security-Policy value. */
export function parseCsp(value: string): Record<string, string[]> {
  const directives: Record<string, string[]> = {};
  for (const part of value.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) directives[name] = sources;
  }
  return directives;
}

/** The `_headers` file of Cloudflare Pages and Netlify: each pattern, then its headers indented by two spaces. */
export function toHeadersFile(config: HeadersConfig): string {
  const blocks = config.rules.map(
    (rule) => `${rule.source}\n${Object.entries(rule.headers).map(([key, value]) => `  ${key}: ${value}`).join('\n')}`
  );
  return `${blocks.join('\n\n')}\n`;
}

/** A _headers pattern as a Vercel `source`: `*` becomes `(.*)` and dots are escaped. */
export function toVercelSource(pattern: string): string {
  return pattern.replace(/\./g, '\\.').replace(/\*/g, '(.*)');
}

/** The `headers` section of vercel.json. */
export function toVercelHeaders(config: HeadersConfig): VercelHeader[] {
  return config.rules.map((rule) => ({
    source: toVercelSource(rule.source),
    headers: Object.entries(rule.headers).map(([key, value]) => ({ key, value }))
  }));
}

/** An existing vercel.json (or null) with its `headers` replaced; every other key stays as it is. */
export function mergeVercel(existing: Record<string, unknown> | null, config: HeadersConfig): Record<string, unknown> {
  return { ...(existing ?? {}), headers: toVercelHeaders(config) };
}
