/**
 * Cache busting for the data files. The host caches /data/* for a year (immutable); every request carries
 * `?v=<data_version>`, read from /data/_version.json (never cached), so a new data version is a new URL.
 * If _version.json cannot be read the files are requested without the query and the app still works.
 */
let pending: Promise<string | null> | null = null;

async function readVersion(): Promise<string | null> {
  try {
    const response = await fetch('/data/_version.json', { cache: 'no-store' });
    if (!response.ok) return null;
    const doc: unknown = await response.json();
    const version = typeof doc === 'object' && doc !== null ? (doc as { data_version?: unknown }).data_version : undefined;
    return typeof version === 'string' && version !== '' ? version : null;
  } catch {
    return null;
  }
}

/** The data version, read once per page load (one shared promise). null when it cannot be read. */
export function getDataVersion(): Promise<string | null> {
  pending ??= readVersion();
  return pending;
}

/** Forgets the version read so far. Only tests need it. */
export function resetDataVersion(): void {
  pending = null;
}

/** `url` with `?v=<data_version>`, or `url` as it is when there is no version. */
export async function versionedUrl(url: string): Promise<string> {
  const version = await getDataVersion();
  return version === null ? url : `${url}?v=${version}`;
}
